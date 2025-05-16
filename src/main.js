// App by Chris Jacobs
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path = require('path')
const WebSocket = require('ws')
const fs = require('fs')
const os = require('os')

let mainWindow = null  // Keep track of the window
let wss = null // WebSocket server instance
let activeWebSockets = new Set() // Track active WebSocket connections
let cachedGridSystem = null; // Cache the latest grid system info

// Add IPC handler to get grid system info from renderer
/* REMOVED - Incorrect communication pattern for main -> renderer request
ipcMain.handle('get-grid-system', () => {
  return new Promise((resolve) => {
    if (!mainWindow) {
      resolve(null)
      return
    }
    
    // Request grid system info from renderer
    mainWindow.webContents.send('request-grid-system')
    
    // Set up a one-time listener for the response
    ipcMain.once('grid-system-info', (event, gridSystemInfo) => {
      resolve(gridSystemInfo)
    })
  })
})
*/

// Function to send screen info to all connected WebSocket clients
async function broadcastScreenInfo() {
  console.log('[Main Process] broadcastScreenInfo called');
  if (activeWebSockets.size === 0) {
    console.log('[Main Process] No active WebSocket connections, skipping broadcast.');
    return;
  }
  
  // Use the cached grid system info
  const gridSystem = cachedGridSystem;
  console.log('[Main Process] Using cached grid system info:', gridSystem);

  if (!gridSystem) {
      console.log('[Main Process] No valid grid system info cached yet, cannot broadcast.');
      return; // Don't broadcast if we haven't received the initial update
  }
  
  try {
    // We already have the gridSystem from the cache
    const screenInfo = {
      type: 'screen-info',
      monitorWidth: gridSystem.monitorWidth, // width in inches
      monitorHeight: gridSystem.monitorHeight, // height in inches
      gridSpacingX: gridSystem.gridSpacingX, // pixels per inch in grid
      gridSpacingY: gridSystem.gridSpacingY,
      dpi: gridSystem.pxPerInch || (gridSystem.gridSpacingX + gridSystem.gridSpacingY) / 2 // Use pxPerInch or calculate from grid spacing
    };
    
    const screenInfoJSON = JSON.stringify(screenInfo);
    console.log('[Main Process] Broadcasting screenInfo:', screenInfoJSON);
    
    // Send to all connected clients
    let sentCount = 0;
    for (const ws of activeWebSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(screenInfoJSON);
        sentCount++;
      }
    }
    console.log(`[Main Process] Sent screenInfo to ${sentCount} WebSocket clients.`);
  } catch (error) {
    console.error('[Main Process] Error in broadcastScreenInfo:', error);
  }
}

// Handle uncaught exceptions globally, especially for WebSocket errors
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error)
  
  // Check for port in use error, which commonly happens when another instance is running
  if (error.code === 'EADDRINUSE') {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Grid 2.0 Already Running',
      message: 'Another instance of Grid 2.0 appears to be running.',
      detail: 'Please use the existing window or close it first.',
      buttons: ['OK'],
      defaultId: 0
    })
  } else {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Application Error',
      message: 'An unexpected error occurred',
      detail: error.message,
      buttons: ['OK'],
      defaultId: 0
    })
  }
  
  // Force quit the app
  process.exit(1)
})

// Ensure only one instance of the app runs at a time
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  dialog.showMessageBox({
    type: 'error',
    title: 'Grid 2.0 Already Running',
    message: 'Another instance of Grid 2.0 is already active.',
    detail: 'Please use the existing window or close it first.',
    buttons: ['OK'],
    defaultId: 0
  }).then(() => {
    app.exit(0)
  })
} else {
  // This is the first instance - set up single instance behavior
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.show()
      mainWindow.setFullScreen(true)
      
      // Also show a notification
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Grid 2.0',
        message: 'Grid 2.0 is already running',
        detail: 'The application is already running. This window has been focused.',
        buttons: ['OK']
      })
    }
  })

  // Function to setup WebSocket server
  async function setupWebSocketServer() {
    return new Promise((resolve, reject) => {
      try {
        const server = new WebSocket.Server({ port: 8080 }, (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve(server)
        })

        server.on('error', (error) => {
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  // Initialize app
  app.whenReady().then(async () => {
    try {
      // Try to set up WebSocket server
      wss = await setupWebSocketServer()
      
      // If successful, set up connection handlers
      wss.on('connection', (ws) => {
        console.log('Figma plugin connected')
      
        // Add to active connections
        activeWebSockets.add(ws)
      
        // Send cached screen info immediately if available
        if (cachedGridSystem) {
             console.log('[Main Process] Plugin connected, sending cached screen info immediately.');
             broadcastScreenInfo(); // Broadcast immediately using cached data
        } else {
             console.log('[Main Process] Plugin connected, but no grid info cached yet. Waiting for grid setup.');
        }
      
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString())
            console.log('[Main Process] Received WebSocket message:', message)
            
            // Handle different message types
            if (message.type === 'frame-data') {
              const frame = message.frame
              
              // Create temp directory if it doesn't exist
              const tempDir = path.join(os.tmpdir(), 'figma-frames')
              if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true })
              }
      
              // Save PNG file
              const tempPath = path.join(tempDir, `${frame.name}.png`)
              const buffer = Buffer.from(frame.imageBytes)
              fs.writeFileSync(tempPath, buffer)
      
              // Send frame data to renderer (without the large imageBytes array)
              if (mainWindow) {
                const frameInfo = {
                  name: frame.name,
                  widthInches: frame.widthInches,
                  heightInches: frame.heightInches,
                  originalName: frame.originalName,
                  imagePath: tempPath
                }
                mainWindow.webContents.send('frame-data-update', { type: 'frame-data', frame: frameInfo })
              }
            }
            // Handle request for screen info
            else if (message.type === 'get-screen-info') {
              console.log('[Main Process] Received get-screen-info request. Calling broadcastScreenInfo...')
              await broadcastScreenInfo()
            }
          } catch (error) {
            console.error('[Main Process] Error handling WebSocket message:', error, 'Raw data:', data.toString())
          }
        })
      
        ws.on('error', (error) => {
          console.error('WebSocket error:', error)
        })
      
        ws.on('close', () => {
          console.log('Figma plugin disconnected')
          // Remove from active connections
          activeWebSockets.delete(ws)
        })
      })
      
      // Create the application window
      createWindow()
      createDockMenu()
      createApplicationMenu()
      
    } catch (error) {
      console.error('Error setting up WebSocket server:', error)
      
      if (error.code === 'EADDRINUSE') {
        await dialog.showMessageBox({
          type: 'error',
          title: 'Grid 2.0 Already Running',
          message: 'Another instance of Grid 2.0 appears to be running.',
          detail: 'Please use the existing window or close it first.',
          buttons: ['OK'],
          defaultId: 0
        })
      } else {
        await dialog.showMessageBox({
          type: 'error',
          title: 'WebSocket Server Error',
          message: 'Failed to start WebSocket server',
          detail: error.message,
          buttons: ['OK'],
          defaultId: 0
        })
      }
      
      // Quit the app after dialog is closed
      app.exit(0)
    }
  })

  // Handle activation (clicking dock icon)
  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    } else {
      mainWindow.show()
      mainWindow.setFullScreen(true)  // Ensure fullscreen when showing
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // Add cleanup for WebSocket server when quitting
  app.on('before-quit', () => {
    // Force quit instead of hide when actually quitting
    if (mainWindow) {
      mainWindow.removeAllListeners('close')
      mainWindow = null
    }
    
    // Close WebSocket server if it exists
    if (wss) {
      wss.close(() => {
        console.log('WebSocket server closed')
      })
    }
  })

  // Add an event emitter for when grid system changes
  ipcMain.on('grid-system-updated', (event, gridSystem) => {
    console.log('[Main Process] Received grid-system-updated event from renderer:', gridSystem);
    // Update the cache
    cachedGridSystem = gridSystem;
    console.log('[Main Process] Updated cachedGridSystem.');
    // When grid system is updated, broadcast to all connected Figma plugins
    console.log('[Main Process] Scheduling broadcastScreenInfo after grid update...');
    setTimeout(broadcastScreenInfo, 100); // Small delay remains useful
  });

  // Listen for border state updates from renderer and broadcast to all windows
  ipcMain.on('update-border-state', (event, { isEnabled, thicknessInches }) => {
    console.log(`[Main Process] Received update-border-state. Enabled: ${isEnabled}, Thickness: ${thicknessInches}`);
    // Forward to grid-gen page
    mainWindow.webContents.send('border-state-updated-from-main', { isEnabled, thicknessInches });
  });

  // Add new handler for frame controls visibility
  ipcMain.on('update-frame-controls-state', (event, { isVisible }) => {
    console.log(`[Main Process] Received update-frame-controls-state. Visible: ${isVisible}`);
    // Forward to grid-gen page
    mainWindow.webContents.send('frame-controls-state-updated', { isVisible });
  });
}

function createApplicationMenu() {
  const template = [
    {
      label: 'Grid Generator',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'More',  // Changed from 'File' to 'More'
      submenu: [
        {
          label: 'How to use Grid',  // Added new help menu item
          click() {
            require('electron').shell.openExternal('https://css-playground-f31b22.webflow.io/');
          }
        },
        { type: 'separator' },
        {
          label: 'Log into Figma Mirror',
          click() {
            let figmaWindow = new BrowserWindow({
              width: 1024,
              height: 768,
              webPreferences: {
                nodeIntegration: false
              },
              title: 'Figma Mirror Login'
            });
            
            figmaWindow.loadURL('https://www.figma.com/mirror');
            
            // Inject a return button after the page loads
            figmaWindow.webContents.on('did-finish-load', () => {
              figmaWindow.webContents.executeJavaScript(`
                const returnButton = document.createElement('div');
                returnButton.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; \
                                            background: #3971aa; color: white; padding: 10px 20px; \
                                            border-radius: 4px; cursor: pointer; font-family: -apple-system; \
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.2); \
                                            transition: background 0.2s;';
                returnButton.textContent = '← Return to Grid Generator';
                returnButton.onmouseover = () => returnButton.style.background = '#3277bd';
                returnButton.onmouseout = () => returnButton.style.background = '#3971aa';
                returnButton.onclick = () => window.close();
                document.body.appendChild(returnButton);
              `);
            });
            
            // Keep the Escape key functionality
            figmaWindow.webContents.on('before-input-event', (event, input) => {
              if (input.key === 'Escape') {
                figmaWindow.close();
              }
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+I',
          click() {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Minimize Window',  // Changed from 'Close' to 'Minimize Window'
          click() {
            if (mainWindow) {
              mainWindow.setFullScreen(false);  // First exit fullscreen
              // Give it a moment to exit fullscreen before minimizing
              setTimeout(() => {
                mainWindow.minimize();
              }, 100);
            }
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow () {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    transparent: false,
    backgroundColor: '#000000',  // Changed to match your app's background
    hasShadow: true,
    show: false  // Don't show until ready
  })

  // Make it fullscreen
  mainWindow.setFullScreen(true)

  // Load the page
  mainWindow.loadFile(path.join(__dirname, 'grid-gen.html'))

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Set window properties after show
  mainWindow.setMovable(true)
  mainWindow.setResizable(true)
  mainWindow.setMinimumSize(320, 400)

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  // Handle window close
  mainWindow.on('close', (event) => {
    if (mainWindow) {
      event.preventDefault()
      mainWindow.setFullScreen(false)  // Exit fullscreen first
      setTimeout(() => {               // Give it a moment to exit fullscreen
        mainWindow.hide()
      }, 100)
    }
  })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key.toLowerCase() === 'i') {  // Ctrl+I or Cmd+I
      mainWindow.webContents.openDevTools();
      event.preventDefault();
    }
  });

  return mainWindow
}

// Create dock menu
function createDockMenu() {
  const dockMenu = Menu.buildFromTemplate([
    {
      label: 'New Window',
      click() {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.setFullScreen(true)  // Ensure fullscreen when showing
        } else {
          createWindow()
        }
      }
    }
  ])
  app.dock.setMenu(dockMenu)
}

// IPC handler for getting screen DPI
ipcMain.handle('get-screen-dpi', () => {
  const primaryDisplay = require('electron').screen.getPrimaryDisplay()
  return primaryDisplay.scaleFactor * 96
}) 