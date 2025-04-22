// App by Chris Jacobs
let dpi = null;
let monitorWidth = null;
let monitorHeight = null;
let gridSpacingX = null;
let gridSpacingY = null;
let borderEnabled = false;
let frameData = null;
let zIndexCounter = 100; // Starting z-index for windows

// Add CM to inches conversion factor
const CM_TO_INCHES = 0.393701; // 1 cm = 0.393701 inches

// Initialize window.gridSystem early
window.gridSystem = null;

// At the top of the file, after any other declarations
window.animationInProgress = false;

// Function to bring a window to the front
function bringToFront(windowEl) {
    zIndexCounter++;
    windowEl.style.zIndex = zIndexCounter;
}

// Get the DPI from the main process
async function getDPI() {
    dpi = await window.electron.getScreenDPI();
    return dpi;
}

async function initializeGrid() {
    const widthInput = document.getElementById('monitor-width');
    const heightInput = document.getElementById('monitor-height');
    
    // Store dimensions in cm internally (convert from inches if needed)
    monitorWidth = parseFloat(widthInput.value) / CM_TO_INCHES;
    monitorHeight = parseFloat(heightInput.value) / CM_TO_INCHES;

    if (!monitorWidth || !monitorHeight) {
        alert('Please enter valid dimensions');
        return;
    }

    // Hide setup container
    document.getElementById('setup-container').classList.add('hidden');

    // Get DPI and generate grid
    await getDPI();
    
    // Set up the grid system first
    const canvas = document.getElementById('grid-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Calculate grid spacing
    gridSpacingX = (canvas.width / monitorWidth);
    gridSpacingY = (canvas.height / monitorHeight);

    // Expose grid spacing globally before generating grid
    window.gridSystem = {
        pxPerCm: dpi / 2.54,
        pxPerInch: dpi,
        gridSpacingX,
        gridSpacingY,
        monitorWidth: parseFloat(monitorWidth.toFixed(1)),
        monitorHeight: parseFloat(monitorHeight.toFixed(1)),
        monitorWidthInches: parseFloat((monitorWidth * CM_TO_INCHES).toFixed(1)),
        monitorHeightInches: parseFloat((monitorHeight * CM_TO_INCHES).toFixed(1))
    };
    console.log('[Renderer] window.gridSystem initialized:', window.gridSystem);

    // Notify main process of grid system update
    window.electron.updateGridSystem(window.gridSystem);

    // First do the animated grid drawing
    await animateGrid();
    
    // Then show brightness controls and control panel
    if (typeof window.showControls === 'function') {
        window.showControls();
    } else {
        console.warn("window.showControls is not a function, control panel may not be visible");
        // Fallback to make control panel visible directly if showControls isn't available
        const controlPanel = document.getElementById('control-panel');
        if (controlPanel) {
            controlPanel.classList.add('visible');
        }
    }
    
    // Update the dimensions display
    updateDimensionsDisplay();
    
    // Handle window resize
    window.addEventListener('resize', generateGrid);
}

function generateGrid() {
    console.log("generateGrid called");
    
    if (window.animationInProgress) {
        console.log("Animation in progress, skipping grid generation");
        return;
    }
    
    // Simply call the animation function
    animateGrid();
}

function updateDimensionsDisplay() {
    const display = document.getElementById('dimensions-display');
    // Display dimensions in inches, truncated to one decimal place
    const widthInInches = (monitorWidth * CM_TO_INCHES).toFixed(1);
    const heightInInches = (monitorHeight * CM_TO_INCHES).toFixed(1);
    display.textContent = `Monitor: ${widthInInches}" × ${heightInInches}"`;
}

function animateGrid() {
    console.log("animateGrid called");
    
    // Set a flag to prevent multiple animations from running simultaneously
    window.animationInProgress = true;
    
    const canvas = document.getElementById('grid-canvas');
    const ctx = canvas.getContext('2d');
    
    // Ensure canvas is visible
    canvas.classList.remove('hidden');
    
    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Calculate pixels per centimeter and per inch
    const pxPerCm = dpi / 2.54;
    const pxPerInch = dpi;

    // Calculate grid spacing based on monitor dimensions in cm
    gridSpacingX = (canvas.width / monitorWidth);
    gridSpacingY = (canvas.height / monitorHeight);

    // Calculate inch-based grid spacing
    const inchGridSpacingX = gridSpacingX / CM_TO_INCHES;
    const inchGridSpacingY = gridSpacingY / CM_TO_INCHES;
    
    // Update global grid system values
    if (window.gridSystem) {
        window.gridSystem.pxPerCm = pxPerCm;
        window.gridSystem.pxPerInch = dpi;
        window.gridSystem.gridSpacingX = gridSpacingX;
        window.gridSystem.gridSpacingY = gridSpacingY;
        window.gridSystem.inchGridSpacingX = inchGridSpacingX;
        window.gridSystem.inchGridSpacingY = inchGridSpacingY;
        window.gridSystem.monitorWidth = parseFloat(monitorWidth.toFixed(1));
        window.gridSystem.monitorHeight = parseFloat(monitorHeight.toFixed(1));
        window.gridSystem.monitorWidthInches = parseFloat((monitorWidth * CM_TO_INCHES).toFixed(1));
        window.gridSystem.monitorHeightInches = parseFloat((monitorHeight * CM_TO_INCHES).toFixed(1));
        console.log('[Renderer] window.gridSystem updated in animateGrid:', window.gridSystem);
        
        // Notify main process of grid system update
        window.electron.updateGridSystem(window.gridSystem);
    }
    
    // Update the dimensions display
    updateDimensionsDisplay();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate number of inch lines
    const totalWidthInches = Math.ceil(monitorWidth * CM_TO_INCHES);
    const totalHeightInches = Math.ceil(monitorHeight * CM_TO_INCHES);
    
    // Initialize line objects for animation - based on inches
    const lines = [];
    
    // Vertical lines (inch-based)
    for (let i = 0; i <= totalWidthInches; i++) {
        lines.push({
            type: 'vertical',
            index: i,
            x: i * inchGridSpacingX,
            start: 0,
            end: 0, // Start with no length
            targetEnd: canvas.height,
            speed: Math.random() * 16.9 + 8.45 // Another 30% faster (was Math.random() * 13 + 6.5)
        });
    }
    
    // Horizontal lines (inch-based)
    for (let i = 0; i <= totalHeightInches; i++) {
        lines.push({
            type: 'horizontal',
            index: i,
            y: i * inchGridSpacingY,
            start: 0,
            end: 0, // Start with no length
            targetEnd: canvas.width,
            speed: Math.random() * 16.9 + 8.45 // Another 30% faster (was Math.random() * 13 + 6.5)
        });
    }
    
    // Draw function for animation
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        
        let allLinesComplete = true;
        
        // Draw all lines with their current length
        for (const line of lines) {
            ctx.beginPath();
            
            if (line.type === 'vertical') {
                ctx.moveTo(line.x, line.start);
                ctx.lineTo(line.x, line.end);
            } else { // horizontal
                ctx.moveTo(line.start, line.y);
                ctx.lineTo(line.end, line.y);
            }
            
            ctx.stroke();
            
            // Update line length for next frame
            if (line.end < line.targetEnd) {
                line.end += line.speed;
                if (line.end > line.targetEnd) {
                    line.end = line.targetEnd;
                }
                allLinesComplete = false;
            }
        }
        
        // Draw numbers when lines are complete
        if (allLinesComplete) {
            // Draw numbers
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // X-axis numbers (in inches) - show all numbers
            for (let x = 1; x <= totalWidthInches; x++) {
                const xPos = x * inchGridSpacingX;
                // Display all inch markings
                ctx.fillText(x.toString() + "\"", xPos, 10);
                ctx.fillText(x.toString() + "\"", xPos, canvas.height - 10);
            }
            
            // Y-axis numbers (in inches) - show all numbers
            for (let y = 1; y <= totalHeightInches; y++) {
                const yPos = y * inchGridSpacingY;
                // Display all inch markings
                ctx.fillText(y.toString() + "\"", 10, yPos);
                ctx.fillText(y.toString() + "\"", canvas.width - 10, yPos);
            }
            
            // Animation is complete
            window.animationInProgress = false;
            return true; // Stop animation
        }
        
        return false; // Continue animation
    }
    
    // Animation loop
    return new Promise((resolve) => {
        function animate() {
            const isComplete = draw();
            if (isComplete) {
                console.log("Grid animation complete");
                resolve();
            } else {
                requestAnimationFrame(animate);
            }
        }
        
        animate();
    });
}

function toggleBorder() {
    borderEnabled = !borderEnabled;
    const toggleButton = document.getElementById('border-toggle');
    toggleButton.style.background = borderEnabled ? '#437eba' : '#426e9b';
    toggleButton.textContent = borderEnabled ? 'Border On' : 'Border Off';
    
    // Select both figma-window and image-window elements
    const windows = document.querySelectorAll('.figma-window, .image-window');
    windows.forEach(windowEl => {
        if (borderEnabled) {
            // Use 3/8 inch (0.375 inch) for border width for consistent physical size
            const borderWidth = `${0.375 * window.gridSystem.inchGridSpacingX}px`;
            windowEl.style.setProperty('--border-width', borderWidth);
            
            // Apply border directly like in the test file
            windowEl.style.border = `${borderWidth} solid black`;
            windowEl.style.borderRadius = borderWidth;
            windowEl.style.boxShadow = '0px 40px 65px 2px rgba(0, 0, 0, 0.44)';
            
            windowEl.classList.add('border-enabled');
        } else {
            // Remove border properties
            windowEl.style.border = 'none';
            windowEl.style.borderRadius = '0px';
            windowEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            windowEl.classList.remove('border-enabled');
        }
    });
}

function createWindow(config) {
    // ... existing window creation code ...
    
    const windowEl = document.createElement('div');
    windowEl.className = 'figma-window';
    
    // Apply border if enabled
    if (borderEnabled) {
        const borderWidth = 0.5 * gridSpacingX;
        windowEl.style.border = `${borderWidth}px solid black`;
    }
    
    // ... rest of existing window creation code ...
}

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const setupContainer = document.getElementById('setup-container');

    // First fade in splash screen
    Promise.all([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 300))
    ]).then(() => {
        document.body.classList.add('app-ready');
        splashScreen.classList.add('fade-in');
        
        // Wait for user to click splash screen
        splashScreen.addEventListener('click', () => {
            // Fade out splash screen
            splashScreen.classList.add('fade-out');
            
            // After splash screen fades out, show setup modal
            setTimeout(() => {
                setupContainer.classList.add('fade-in');
            }, 500); // Match the fade-out transition time
        });
    });
}); 

// Load end product presets and populate dropdown
fetch('end-product-presets.json')
    .then(response => response.json())
    .then(data => {
        const frameSelect = document.getElementById('frame-select');
        frameSelect.innerHTML = '<option value="" disabled selected>Select Screen Size</option>';
        
        data.presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = `${preset.name} (${preset.width} × ${preset.height}cm)`;
            frameSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Error loading presets:', error));

// Screen size presets handler
document.getElementById('frame-select').addEventListener('change', (e) => {
    fetch('end-product-presets.json')
        .then(response => response.json())
        .then(data => {
            const preset = data.presets.find(p => p.id === e.target.value);
            if (preset) {
                document.getElementById('width-input').value = preset.width;
                document.getElementById('height-input').value = preset.height;
            }
            // Keep WebSocket frame handling
            else if (frameData && e.target.value !== '') {
                const selectedFrame = frameData.frames[e.target.value];
                document.getElementById('width-input').value = selectedFrame.widthInches;
                document.getElementById('height-input').value = selectedFrame.heightInches;
            }
        })
        .catch(error => console.error('Error loading presets:', error));
});

// Keep WebSocket frame data handler operational
function handleFrameData(data) {
    if (data.type === 'frame-data') {
        const frame = data.frame;
        addFigmaFrameToUI(frame);
    }
}

function addFigmaFrameToUI(frame) {
    const container = document.getElementById('figma-frames-container');
    
    // Create frame preview element
    const frameEl = document.createElement('div');
    frameEl.className = 'figma-frame-preview';
    
    // Add frame info
    const info = document.createElement('div');
    info.className = 'frame-info';
    info.innerHTML = `
        <div class="frame-name">${frame.name}</div>
        <div class="frame-size">${frame.widthInches}" × ${frame.heightInches}"</div>
    `;
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'frame-buttons';
    
    // Add launch button
    const launchBtn = document.createElement('button');
    launchBtn.textContent = 'Launch';
    launchBtn.onclick = () => {
        const config = {
            width: frame.widthInches,
            height: frame.heightInches,
            imageUrl: `file://${frame.imagePath}`
        };
        createImageWindow(config);
    };
    
    // Add delete button with trashcan icon
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.innerHTML = '<img src="./assets/delete.svg" alt="Delete" style="width: 16px; height: 16px;">';
    deleteBtn.onclick = () => {
        frameEl.remove(); // Remove this frame from the UI
    };
    
    // Assemble elements
    buttonsContainer.appendChild(launchBtn);
    buttonsContainer.appendChild(deleteBtn);
    frameEl.appendChild(info);
    frameEl.appendChild(buttonsContainer);
    container.appendChild(frameEl);
}

// Add listener for grid system requests from main process
window.electron.onRequestGridSystem((gridSystem) => {
    console.log('Main process requested grid system info:', gridSystem);
});

// Keep WebSocket data receiver operational
window.electron.onFrameDataUpdate((data) => {
    handleFrameData(data);
});

// Add function to create Figma frame
function createFigmaFrame(frame) {
    const container = document.getElementById('container');
    const windowEl = document.createElement('div');
    windowEl.className = 'figma-window';
    
    // Set initial z-index and bring to front
    windowEl.style.zIndex = zIndexCounter++;
    
    // Set dimensions using the grid system
    const pxWidth = frame.widthCM * window.gridSystem.gridSpacingX;
    const pxHeight = frame.heightCM * window.gridSystem.gridSpacingY;
    windowEl.style.width = pxWidth + 'px';
    windowEl.style.height = pxHeight + 'px';
    
    // Center the window initially
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    windowEl.style.left = `${(screenWidth - pxWidth) / 2}px`;
    windowEl.style.top = `${(screenHeight - pxHeight) / 2}px`;
    
    // Create and add the iframe
    const iframe = document.createElement('iframe');
    iframe.src = frame.embedUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    windowEl.appendChild(iframe);
    
    // Add window controls
    const dragHandle = document.createElement('div');
    dragHandle.className = 'window-drag-handle';
    dragHandle.innerHTML = '<img src="./assets/arrows.svg" alt="Move">';
    windowEl.appendChild(dragHandle);

    const closeButton = document.createElement('button');
    closeButton.className = 'window-close-button';
    windowEl.appendChild(closeButton);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle se';
    windowEl.appendChild(resizeHandle);

    // Add size indicator
    const sizeIndicator = document.createElement('div');
    sizeIndicator.className = 'size-indicator';
    document.body.appendChild(sizeIndicator);
    
    // Make window draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    
    dragHandle.addEventListener('mousedown', (e) => {
        bringToFront(windowEl); // Bring window to front when starting to drag
        isDragging = true;
        initialX = e.clientX - windowEl.offsetLeft;
        initialY = e.clientY - windowEl.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            windowEl.style.left = `${currentX}px`;
            windowEl.style.top = `${currentY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Make window resizable
    let isResizing = false;
    let initialWidth = 0;
    let initialHeight = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        bringToFront(windowEl); // Bring window to front when starting to resize
        isResizing = true;
        initialWidth = parseInt(windowEl.style.width);
        initialHeight = parseInt(windowEl.style.height);
        initialX = e.clientX;
        initialY = e.clientY;
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const width = initialWidth + (e.clientX - initialX);
            const height = initialHeight + (e.clientY - initialY);
            windowEl.style.width = `${width}px`;
            windowEl.style.height = `${height}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
    });

    // Close button functionality
    closeButton.addEventListener('click', () => {
        windowEl.remove();
        sizeIndicator.remove();
    });
    
    // Add click handler to bring window to front
    windowEl.addEventListener('mousedown', () => {
        bringToFront(windowEl);
    });
    
    // Apply border if enabled
    if (borderEnabled) {
        // Use 3/8 inch (0.375 inch) for border width
        const borderWidth = `${0.375 * window.gridSystem.inchGridSpacingX}px`;
        windowEl.style.setProperty('--border-width', borderWidth);
        windowEl.style.border = `${borderWidth} solid black`;
        windowEl.style.borderRadius = borderWidth;
        windowEl.style.boxShadow = '0px 40px 65px 2px rgba(0, 0, 0, 0.44)';
        windowEl.classList.add('border-enabled');
    } else {
        windowEl.style.borderRadius = '0px'; // Explicitly set border radius to 0 when border is disabled
    }
    
    container.appendChild(windowEl);
}

function createImageWindow(config) {
    // Convert pixels directly from inches using grid spacing 
    // Adjust for the 24px extra space by subtracting it from the height
    const pxWidth = config.width * window.gridSystem.inchGridSpacingX;
    const pxHeight = config.height * window.gridSystem.inchGridSpacingY;
    
    // Create a single element instead of a nested structure to eliminate extra spacing
    const windowEl = document.createElement('div');
    windowEl.className = 'image-window';
    windowEl.style.position = 'absolute';
    windowEl.style.zIndex = zIndexCounter++;
    
    // Center window
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const x = (config.x !== undefined) ? config.x : (screenWidth - pxWidth) / 2;
    const y = (config.y !== undefined) ? config.y : (screenHeight - pxHeight) / 2;
    windowEl.style.left = x + 'px';
    windowEl.style.top = y + 'px';
    windowEl.style.width = pxWidth + 'px';
    windowEl.style.height = pxHeight + 'px';
    
    // Hard set all properties that could affect sizing
    windowEl.style.padding = '0';
    windowEl.style.margin = '0';
    windowEl.style.overflow = 'hidden';
    windowEl.style.boxSizing = 'content-box'; // Use content-box to ensure borders appear outside
    windowEl.style.backgroundColor = 'transparent';
    windowEl.style.lineHeight = '0';
    windowEl.style.fontSize = '0'; // Eliminate any font-related spacing
    windowEl.style.display = 'block'; // Use block instead of flex
    windowEl.style.borderWidth = '0';
    
    // Create image element with exact dimensions
    const img = document.createElement('img');
    img.src = config.imageUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    img.style.objectFit = 'fill';
    img.style.padding = '0';
    img.style.margin = '0';
    
    // Apply border if enabled
    if (borderEnabled) {
        // Use 3/8 inch (0.375 inch) for border width
        const borderWidth = `${0.375 * window.gridSystem.inchGridSpacingX}px`;
        windowEl.style.setProperty('--border-width', borderWidth);
        windowEl.style.border = `${borderWidth} solid black`; // Apply border directly to match test file
        windowEl.style.borderRadius = borderWidth;
        windowEl.style.boxShadow = '0px 40px 65px 2px rgba(0, 0, 0, 0.44)';
        windowEl.classList.add('border-enabled');
    }
    
    // Add window controls as direct siblings at the same level as the image
    windowEl.appendChild(img);
    
    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'window-drag-handle';
    dragHandle.innerHTML = '<img src="./assets/arrows.svg" alt="Move">';
    windowEl.appendChild(dragHandle);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'window-close-button';
    closeButton.innerHTML = '<img src="./assets/close.svg" alt="Close">';
    closeButton.onclick = () => {
        // Revoke the object URL when closing the window
        if (img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
        windowEl.remove();
    };
    windowEl.appendChild(closeButton);
    
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle se';
    windowEl.appendChild(resizeHandle);
    
    // Make draggable
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    dragHandle.addEventListener('mousedown', (e) => {
        bringToFront(windowEl);
        isDragging = true;
        initialX = e.clientX - windowEl.offsetLeft;
        initialY = e.clientY - windowEl.offsetTop;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            windowEl.style.left = `${currentX}px`;
            windowEl.style.top = `${currentY}px`;
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Make window resizable
    let isResizing = false;
    let initialWidth = 0;
    let initialHeight = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        bringToFront(windowEl);
        isResizing = true;
        initialWidth = parseInt(windowEl.style.width);
        initialHeight = parseInt(windowEl.style.height);
        initialX = e.clientX;
        initialY = e.clientY;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const width = initialWidth + (e.clientX - initialX);
            const height = initialHeight + (e.clientY - initialY);
            windowEl.style.width = `${width}px`;
            windowEl.style.height = `${height}px`;
        }
    });
    
    document.addEventListener('mouseup', () => {
        isResizing = false;
    });
    
    // Bring to front when clicked
    windowEl.addEventListener('mousedown', () => {
        bringToFront(windowEl);
    });
    
    // Add to DOM
    document.getElementById('container').appendChild(windowEl);
    
    return windowEl;
}

function updateGridLines() {
    console.log("updateGridLines called");
    
    if (window.animationInProgress) {
        console.log("Animation in progress, skipping grid update");
        return;
    }
    
    // Simply call the animation function rather than drawing a separate grid
    animateGrid();
} 