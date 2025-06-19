# Grid 2.0 - Windows Build Guide

This guide explains how to build and deploy Grid 2.0 for Windows platforms.

## Prerequisites

### Required Software
1. **Node.js** (v14 or higher)
   - Download from https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (for version control)
   - Download from https://git-scm.com/

### Optional Tools
- **Visual Studio Code** (recommended editor)
- **Windows SDK** (for code signing)

## Setup Instructions

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd Grid2.0
npm install
```

### 2. Create Windows Icon
The app needs a proper Windows ICO file. You have several options:

#### Option A: Use the provided script (when Node.js is available)
```bash
node build/create-icon.js
```

#### Option B: Install to-ico package and create ICO
```bash
npm install to-ico
node build/create-icon.js
```

#### Option C: Use online converter
1. Go to https://convertio.co/png-ico/
2. Upload the PNG files from `icons_export/` folder
3. Use these sizes: 16x16, 32x32, 64x64, 128x128, 256x256
4. Download the ICO file and save as `build/icon.ico`

### 3. Build the Application

#### Development Build
```bash
npm start
```

#### Production Build for Windows
```bash
# Build Windows installer (NSIS)
npm run build:win

# Build portable Windows app
npm run pack:win

# Build for all platforms
npm run dist:all
```

## Windows-Specific Features

### Menu Structure
- **File Menu**: Contains app functions and exit option
- **View Menu**: Developer tools, zoom controls, fullscreen toggle
- **Help Menu**: About dialog and help resources

### Keyboard Shortcuts
- `Ctrl+I` or `F12`: Toggle Developer Tools
- `Ctrl+M`: Minimize Window
- `Alt+F4`: Exit Application
- `F11`: Toggle Fullscreen

### Window Behavior
- **Close Button**: Closes the app (exits completely)
- **Minimize Button**: Minimizes to taskbar
- **Maximize Button**: Maximizes window or toggles fullscreen

## Build Outputs

After building, you'll find the Windows distributables in the `dist/` folder:

- **Grid 2.0 Setup.exe**: Windows installer (NSIS)
- **Grid 2.0 Portable.exe**: Portable executable
- **Grid 2.0-win-unpacked/**: Unpacked application folder

## Installation Types

### NSIS Installer
- Creates Start Menu shortcuts
- Creates Desktop shortcut
- Allows custom installation directory
- Includes uninstaller

### Portable Version
- No installation required
- Run directly from any location
- Ideal for USB drives or temporary use

## Troubleshooting

### Common Issues

1. **Node.js not found**
   - Install Node.js from https://nodejs.org/
   - Restart command prompt/PowerShell

2. **npm command not recognized**
   - Node.js installation may be incomplete
   - Add Node.js to system PATH

3. **Build fails with "icon.ico not found"**
   - Run `node build/create-icon.js` to create the icon
   - Manually create ICO file using online converter

4. **WebSocket connection issues**
   - Ensure Windows Firewall allows the app
   - Check if port 8080 is available

### Build Environment
- Tested on Windows 10/11
- Requires PowerShell or Command Prompt
- Works with Windows Subsystem for Linux (WSL)

## Code Signing (Optional)

For production releases, you may want to code sign the executable:

1. Obtain a code signing certificate
2. Configure electron-builder with certificate details
3. Update package.json build configuration

## Deployment

### For Distribution
1. Build the installer: `npm run dist:win`
2. Test the installer on a clean Windows system
3. Upload to your distribution platform

### For Development
1. Use `npm start` for development
2. Use `npm run pack:win` for testing builds
3. Use the portable version for quick testing

## Performance Notes

- The app uses WebSocket communication on port 8080
- Full-screen mode is optimized for Windows
- Memory usage is typically 50-100MB
- Startup time is usually under 3 seconds

## Support

For Windows-specific issues:
- Check Windows Event Viewer for error logs
- Ensure all dependencies are installed
- Verify the app has necessary permissions
- Test with Windows Defender temporarily disabled 