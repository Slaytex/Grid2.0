const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    getScreenDPI: () => ipcRenderer.invoke('get-screen-dpi'),
    
    // Update frame data handler to include image paths
    onFrameDataUpdate: (callback) => {
        ipcRenderer.on('frame-data-update', (event, data) => {
            // data now includes { type: 'frame-data', frame: { name, widthCM, heightCM, originalName, imagePath } }
            callback(data);
        });
    },
    
    // Add handler for grid system requests from main process
    onRequestGridSystem: (callback) => {
        ipcRenderer.on('request-grid-system', () => {
            console.log('[Preload] Received request-grid-system from main process.');
            const gridSystem = window.gridSystem;
            if (gridSystem) {
                console.log('[Preload] Found gridSystem info. Sending back to main:', gridSystem);
                ipcRenderer.send('grid-system-info', gridSystem);
            } else {
                console.error('[Preload] window.gridSystem is undefined or null when requested.');
                ipcRenderer.send('grid-system-info', null);
            }
        });
    },
    
    // Add method to notify main process when grid system is updated
    updateGridSystem: (gridSystem) => {
        console.log('[Preload] Sending grid-system-updated to main:', gridSystem);
        ipcRenderer.send('grid-system-updated', gridSystem);
    },

    onFigmaFrameSelected: (callback) => {
        ipcRenderer.on('figma-frame-selected', (event, frameData) => {
            // frameData includes { name, url, widthInches, heightInches }
            callback(frameData);
        });
    },

    // IPC for border state and thickness updates
    updateBorderState: (isEnabled, thicknessInches) => {
        ipcRenderer.send('update-border-state', { isEnabled, thicknessInches });
    },
    onUpdateBorderState: (callback) => {
        ipcRenderer.on('border-state-updated-from-main', (event, { isEnabled, thicknessInches }) => {
            callback(isEnabled, thicknessInches);
        });
    },
    
    // IPC for frame controls visibility updates
    updateFrameControlsState: (isVisible) => {
        ipcRenderer.send('update-frame-controls-state', { isVisible });
    },
    onUpdateFrameControlsState: (callback) => {
        ipcRenderer.on('frame-controls-state-updated', (event, { isVisible }) => {
            callback(isVisible);
        });
    }
}) 