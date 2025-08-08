# Grid 2.0 – Figma Plugin

This plugin connects Figma to the Grid 2.0 desktop app for two workflows:
- Export PNGs of selected frames to Grid
- Control “live” frames (size-only) displayed via figma.com/mirror

## Requirements
- Figma desktop app
- Grid 2.0 app running (WebSocket on `localhost:8080`)
- Node 16+, npm, TypeScript (for building)

## Build
```bash
npm install
npm run build
```
Outputs `code.js`. A packaged zip may be created at the repository root by the app tooling.

## Install in Figma (from manifest)
1. In Figma: Plugins → Development → Import plugin from manifest…
2. Choose `figma_plugin/manifest.json`

## UI actions (bottom 50x50 buttons)
- LABEL SIZE: Adds size to selected frames’ names using 160dp baseline
  - Example: `welcome` → `welcome#12x10` (inches). If duplicates, auto numbers `welcome-01`, `welcome-02`…
- SEND PNG: Exports selected, named frames (from list) as PNGs to the Grid app
- SEND LIVE: Sends a “live” frame (size only) to Grid. If the selected frame is named `name#live`, this button is highlighted
- UPDATE SIZE: Sends the current selected frame’s size to Grid to resize the matching live window

Notes
- Inches conversion uses 160dp: `inches = pixels / 160`
- For live windows, the Grid app lists received frames under “Figma Frames”. Each item has:
  - Truncated name + fixed-width dimensions
  - Vertical actions: Launch (opens a figma.com/mirror window at that size) and Delete (remove listing)

## Typical flows
PNG
1) Select frames → click the refresh icon in the plugin
2) Select desired items → SEND PNG

Live
1) Select the frame you want live; name it `name#live` (optional but recommended)
2) Click SEND LIVE → frame shows in Grid’s Figma Frames list
3) Click Launch in Grid to open a live window (figma.com/mirror)
4) Resize in Figma → click UPDATE SIZE to animate the window to the new size

## Troubleshooting
- Not connected: Ensure Grid 2.0 is running; the status light should be green
- Nothing appears in list: Verify selection and naming (after LABEL SIZE or valid formats)
- Size mismatch: Remember live sizing uses 160dp; rename via LABEL SIZE if needed

## Development
- Main logic: `code.ts`
- UI: `ui.html`
- Manifest: `manifest.json`

