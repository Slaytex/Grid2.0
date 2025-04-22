# Figma Plugin UI Test

This is a test environment for the Figma plugin UI. Open `index.html` in a browser to test the interface.

## Features
- Connection status indicator
- Frame list with checkboxes
- Send button with states (normal, sending, success, error)
- Debug console

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (Node Package Manager)
- TypeScript (installed globally)
- Figma Desktop App

### Installation Steps

1. Install TypeScript globally:
```bash
npm install -g typescript
```

2. Install project dependencies:
```bash
npm install
```

3. Install Figma plugin typings:
```bash
npm install --save-dev @figma/plugin-typings
```

### Development with Visual Studio Code

1. Download and install Visual Studio Code: https://code.visualstudio.com/
2. Open the `figma_plugin` directory in Visual Studio Code
3. Compile TypeScript to JavaScript:
   - Run the "Terminal > Run Build Task..." menu item
   - Select "npm: watch"
   - This needs to be done every time you reopen Visual Studio Code

The JavaScript file will be regenerated automatically every time you save your TypeScript files.

## TypeScript Development

TypeScript adds type annotations to variables, allowing code editors to provide information about the Figma API while writing code and help catch bugs early.

For more information about TypeScript, visit https://www.typescriptlang.org/

### TypeScript Configuration
The project includes a `tsconfig.json` file that configures TypeScript compilation settings. Key features:
- Strict type checking
- ES6 module support
- Source map generation for debugging

### Figma Plugin API Types
The project uses `@figma/plugin-typings` to provide type definitions for the Figma Plugin API. This enables:
- Autocomplete for Figma API methods
- Type checking for plugin code
- Better IDE support

## Building the Plugin

To build the plugin for distribution:

```bash
npm run build
```

This will:
1. Compile TypeScript files to JavaScript
2. Generate source maps
3. Create a distribution-ready plugin

## Testing

1. Open `index.html` in a browser to test the UI
2. Use the debug console for troubleshooting
3. Check the connection status indicator
4. Test frame selection and sending functionality

## Troubleshooting

Common issues and solutions:

1. **TypeScript Compilation Errors**
   - Ensure TypeScript is installed globally
   - Check for syntax errors in `.ts` files
   - Verify all dependencies are installed

2. **UI Testing Issues**
   - Clear browser cache if UI changes aren't visible
   - Check console for JavaScript errors
   - Verify all required files are present

3. **Figma Plugin Issues**
   - Ensure the plugin is properly built
   - Check Figma's developer console
   - Verify API permissions in manifest.json

Below are the steps to get your plugin running. You can also find instructions at:

  https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here:

  https://nodejs.org/en/download/

Next, install TypeScript using the command:

  npm install -g typescript

Finally, in the directory of your plugin, get the latest type definitions for the plugin API by running:

  npm install --save-dev @figma/plugin-typings

If you are familiar with JavaScript, TypeScript will look very familiar. In fact, valid JavaScript code
is already valid Typescript code.

TypeScript adds type annotations to variables. This allows code editors such as Visual Studio Code
to provide information about the Figma API while you are writing code, as well as help catch bugs
you previously didn't notice.

For more information, visit https://www.typescriptlang.org/

Using TypeScript requires a compiler to convert TypeScript (code.ts) into JavaScript (code.js)
for the browser to run.

We recommend writing TypeScript code using Visual Studio code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/.
2. Open this directory in Visual Studio Code.
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
    then select "npm: watch". You will have to do this again every time
    you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.
