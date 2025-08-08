# Grid 2.0

Grid 2.0 is an Electron desktop app plus a Figma plugin that lets you:
- Export selected Figma frames as PNGs to the app
- Drive “live” frames (size-only) displayed via `figma.com/mirror`, and resize them from Figma

## Repository Information
- GitHub Repository: [Grid2.0](https://github.com/Slaytex/Grid2.0)
- Main Branch: `main`

## Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)
- Figma Desktop App
- macOS (for running the desktop app)
- TypeScript (for development)

## Setup

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

### Desktop App

1. Start the application in development mode:
```bash
npm start
```

2. Build the application for distribution:
```bash
npm run dist
```

The built application will be available in the `dist` directory.

### Figma Plugin

1. Build the plugin:
```bash
cd figma_plugin
npm run build
```

This compiles `code.ts` to `code.js`. To import into Figma: Plugins → Development → Import from manifest, choose `figma_plugin/manifest.json`.

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

Buttons (bottom 50x50):
- LABEL SIZE: adds size to selected frames’ names using 160dp baseline (e.g., `welcome` → `welcome#12x10`). If duplicates, auto numbers (`welcome-01`, `welcome-02`).
- SEND PNG: exports selected frames as PNGs to Grid.
- SEND LIVE: registers a live frame (size-only) with Grid. If the selected frame is `name#live`, the button highlights.
- UPDATE SIZE: resizes the matching live window in Grid to the current selected frame’s size.

Notes:
- Inches conversion uses 160dp: `inches = pixels / 160`.
- Grid lists incoming “Figma Frames” with truncated names + dimensions, and per-item actions (Launch/Delete).

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
Produces `code.js`. Packaging into a zip is handled via helper scripts when needed.

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

## Frame Naming Conventions

When creating frames in Figma, you can use two naming formats to specify the frame size:

1. **Custom Size Format**: `name#width×height`
   - Example: `MyFrame#10×5` creates a frame named "MyFrame" with width=10 inches and height=5 inches
   - Use the × symbol (multiplication sign) between width and height
   - Measurements are in inches

2. **Preset Size Format**: `name#code#`
   - Example: `MyFrame#SA#` creates a frame with the preset size "SA"
   - The code must be followed by a # symbol

### Available Size Codes

The following preset sizes are available:

| Code | Size (inches) | Description |
|------|--------------|-------------|
| SA   | 12.73 × 7.16 | Standard A  |
| SB   | 13.58 × 7.64 | Standard B  |
| SC   | 14.81 × 8.33 | Standard C  |
| LI   | 11.24 × 6.32 | Linear     |
| WE   | 22.99 × 8.62 | Wide Extended |
| WS   | 22.99 × 5.08 | Wide Standard |
| WF   | 17.87 × 3.96 | Wide Focused  | 