# Grid 2.0

Grid 2.0 is a powerful desktop application that works in conjunction with a Figma plugin to streamline the process of creating and managing grid layouts in Figma. The system consists of two main components:
1. A desktop application (Grid App)
2. A Figma plugin (Grid Plugin)

## Repository Information
- GitHub Repository: [Grid2.0](https://github.com/Slaytex/Grid2.0)
- Main Branch: `main`

## Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)
- Figma Desktop App
- macOS (for running the desktop app)
- TypeScript (for development)

## Installation

### Development Environment Setup

1. Clone this repository:
```bash
git clone https://github.com/Slaytex/Grid2.0.git
cd Grid2.0
```

2. Install global dependencies:
```bash
npm install -g typescript
```

3. Install project dependencies:
```bash
npm install
```

4. Install Figma plugin dependencies:
```bash
cd figma_plugin
npm install
npm install --save-dev @figma/plugin-typings
cd ..
```

### Desktop App Installation

1. Start the application in development mode:
```bash
npm start
```

2. Build the application for distribution:
```bash
npm run dist
```

The built application will be available in the `dist` directory.

### Figma Plugin Installation

1. Build the plugin:
```bash
cd figma_plugin
npm run build
```

The built plugin will be available in the `figma_plugin_dist` directory.

## Project Structure

```
grid/
├── src/                  # Desktop app source files
├── figma_plugin/         # Figma plugin source code
├── figma_plugin_dist/    # Built Figma plugin files
├── build/               # Build configuration files
└── dist/                # Built desktop application
```

## Usage

### Desktop Application

1. Launch the Grid App
2. The app will start a local server and wait for connections from the Figma plugin
3. Status will be shown in the app window

### Figma Plugin

1. Install the plugin in Figma
2. Launch Grid App first
3. In Figma, name your frames using one of these formats:
   - `frame-name]#code#` (using predefined screen codes)
   - `frame-name#widthxheight#` (using custom dimensions)

Available screen codes:
- SA: 360x640
- SB: 390x844
- SC: 412x915
- LI: 744x1133
- WE: 1024x768
- WS: 1440x900
- WF: 1920x1080

4. Click the refresh icon in the plugin
5. Select the frames you want to process
6. Click send to process the frames

## Development

### Desktop App Development

The desktop app is built using Electron and includes:
- WebSocket server for Figma plugin communication
- Frame processing capabilities
- Status monitoring and display

To modify the desktop app, edit files in the `src` directory.

### Plugin Development

The Figma plugin is built using TypeScript and includes:
- Frame selection and processing
- WebSocket client for desktop app communication
- UI for frame management

To modify the plugin, edit files in the `figma_plugin` directory.

## Building for Distribution

### Desktop App

```bash
npm run dist
```

This will create:
- A DMG installer for macOS
- A ZIP archive of the application

### Figma Plugin

```bash
cd figma_plugin
npm run build
```

This will create:
- A distribution-ready plugin in `figma_plugin_dist`
- A ZIP file ready for Figma plugin submission

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**
   - Ensure Grid App is running before using the Figma plugin
   - Check if your firewall is blocking the connection
   - Verify the WebSocket port is available (default: 8080)

2. **Frame Processing Issues**
   - Verify frame naming follows the correct format
   - Ensure frames are selected before sending
   - Check the console for error messages

3. **Development Issues**
   - Make sure TypeScript is installed globally
   - Verify all dependencies are installed
   - Check for any npm audit warnings or vulnerabilities

## License

[Your License Information]

## Contributing

[Your Contributing Guidelines] 
[Your Contributing Guidelines] 