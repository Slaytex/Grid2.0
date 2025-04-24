"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Figma uses 1 unit = 1 pixel at 1x zoom
// Standard screen resolution is 96 DPI
// 1 inch = 2.54 cm
// So: pixels to cm = pixels * (2.54 / 96)
function pixelsToCM(pixels) {
    return pixels * (2.54 / 96);
}
// Size code mappings in millimeters (converted to cm)
const SIZE_CODES = {
    'SA': { widthCM: 32.333, heightCM: 18.187 },
    'SB': { widthCM: 34.5, heightCM: 19.4 },
    'SC': { widthCM: 37.63, heightCM: 21.17 },
    'LI': { widthCM: 28.56, heightCM: 16.06 },
    'WE': { widthCM: 58.406, heightCM: 21.902 },
    'WS': { widthCM: 58.406, heightCM: 12.9 },
    'WF': { widthCM: 45.38, heightCM: 10.047 }
};
// Function to parse frame names with format: name#widthxheight or name#CODE#
function parseFrameName(fullName) {
    // First, try to match the format name#CODE# (standard size)
    const codeMatch = fullName.match(/^(.+)#([A-Z]+)#$/);
    if (codeMatch) {
        const name = codeMatch[1].trim();
        const code = codeMatch[2];
        // Check if the code exists in our size mapping
        if (SIZE_CODES[code]) {
            return {
                name: name,
                widthCM: SIZE_CODES[code].widthCM,
                heightCM: SIZE_CODES[code].heightCM
            };
        }
    }
    // If not a code, try the original format: name#widthxheight
    const dimensionMatch = fullName.match(/^(.+)#(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
    if (dimensionMatch) {
        return {
            name: dimensionMatch[1].trim(),
            widthCM: parseFloat(dimensionMatch[2]),
            heightCM: parseFloat(dimensionMatch[3])
        };
    }
    // If neither format matches, return null
    return null;
}
// Function to get embed URL
function getEmbedUrl(fileKey, nodeId) {
    return `https://www.figma.com/embed?embed_host=share&url=https://www.figma.com/file/${fileKey}/?node-id=${nodeId}&hide-ui=1&zoom=1`;
}
// Optimized function to count frames that match our naming pattern
function countMatchingFrames() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create regex patterns
        const dimensionPattern = /^.+#\d+(?:\.\d+)?x\d+(?:\.\d+)?$/;
        const codePattern = /^.+#[A-Z]+#$/;
        // Get selected nodes from current page
        const selection = figma.currentPage.selection;
        // Filter selected nodes that are frames with matching naming patterns
        const matchingFrames = selection.filter(node => {
            if (node.type !== 'FRAME') {
                return false;
            }
            // Test using regex test() method which returns a boolean
            return dimensionPattern.test(node.name) || codePattern.test(node.name);
        });
        return matchingFrames.length;
    });
}
// Optimized function to collect frame data
function collectFrameData() {
    return __awaiter(this, void 0, void 0, function* () {
        const frames = [];
        // Create regex patterns
        const dimensionPattern = /^.+#\d+(?:\.\d+)?x\d+(?:\.\d+)?$/;
        const codePattern = /^.+#[A-Z]+#$/;
        // Get selected nodes from current page
        const selection = figma.currentPage.selection;
        // If nothing is selected, return empty array immediately
        if (selection.length === 0) {
            return frames;
        }
        // Filter selected nodes that are frames with matching naming patterns
        const matchingFrames = selection.filter(node => node.type === 'FRAME' && (dimensionPattern.test(node.name) ||
            codePattern.test(node.name)));
        for (const frame of matchingFrames) {
            const parsed = parseFrameName(frame.name);
            if (parsed) {
                frames.push({
                    name: parsed.name,
                    widthCM: parsed.widthCM,
                    heightCM: parsed.heightCM,
                    originalName: frame.name,
                    imageBytes: new Uint8Array(0) // Empty array until export
                });
            }
        }
        return frames;
    });
}
// Request screen info from the Grid Generator app
function requestScreenInfo() {
    figma.ui.postMessage({ type: 'request-screen-info' });
}
// Export frame as PNG and return bytes with proper scaling based on Grid app's dimensions
function exportFrameAsPng(node, frameInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Request screen info from UI layer (which has the WebSocket connection)
            figma.ui.postMessage({ type: 'get-screen-info' });
            // For high-resolution displays (like 4K TVs), we'll use a higher scale factor
            // 4K is approximately 3840x2160, so we'll use a scale of 2 to ensure good quality
            const settings = {
                format: 'PNG',
                constraint: { type: 'SCALE', value: 2 } // Increased from 1 to 2 for better quality
            };
            return yield node.exportAsync(settings);
        }
        catch (error) {
            console.error('Error exporting frame:', error);
            throw error;
        }
    });
}
// Show UI with initial empty state
figma.showUI(__html__, { width: 350, height: 500 });
// Initial state only shows UI without scanning frames
figma.ui.postMessage({ type: 'init-ui' });
// Request screen info when plugin loads
figma.ui.postMessage({ type: 'get-screen-info' });
// Handle messages from UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'scan-frames') {
        // Check if any frames are selected
        if (figma.currentPage.selection.length === 0) {
            figma.ui.postMessage({
                type: 'selection-empty',
                message: 'Please select frames to scan.'
            });
            return;
        }
        // First count frames to check if we need confirmation
        const frameCount = yield countMatchingFrames();
        if (frameCount === 0) {
            figma.ui.postMessage({
                type: 'no-matching-frames',
                message: 'No selected frames match the naming pattern (name#widthxheight or name#CODE#).'
            });
        }
        else if (frameCount > 20 && !msg.confirmScan) {
            // If many frames and no confirmation yet, ask for confirmation
            figma.ui.postMessage({
                type: 'confirm-scan',
                message: `There are ${frameCount} matching frames in your selection. Scanning may take a while. Do you want to continue?`,
                count: frameCount
            });
        }
        else {
            // Either fewer frames or user confirmed, proceed with scan
            figma.ui.postMessage({ type: 'scan-started' });
            const frames = yield collectFrameData();
            figma.ui.postMessage({ type: 'update-frame-list', frames });
        }
    }
    else if (msg.type === 'export-frames' && msg.frameNames) {
        const frames = [];
        figma.ui.postMessage({ type: 'export-started', count: msg.frameNames.length });
        // Request screen info before starting export
        figma.ui.postMessage({ type: 'get-screen-info' });
        for (let i = 0; i < msg.frameNames.length; i++) {
            const frameName = msg.frameNames[i];
            const frameNode = figma.currentPage.findOne(node => node.type === 'FRAME' && node.name === frameName);
            if (frameNode) {
                const parsed = parseFrameName(frameNode.name);
                if (parsed) {
                    // Send progress before starting export (which can take time)
                    figma.ui.postMessage({
                        type: 'export-progress',
                        current: i + 1,
                        total: msg.frameNames.length,
                        frameName: parsed.name,
                        status: 'exporting'
                    });
                    // Do the export
                    const imageBytes = yield exportFrameAsPng(frameNode, {
                        widthCM: parsed.widthCM,
                        heightCM: parsed.heightCM
                    });
                    frames.push({
                        name: parsed.name,
                        widthCM: parsed.widthCM,
                        heightCM: parsed.heightCM,
                        originalName: frameNode.name,
                        imageBytes // Send the raw bytes
                    });
                    // Send progress update after export
                    figma.ui.postMessage({
                        type: 'export-progress',
                        current: i + 1,
                        total: msg.frameNames.length,
                        frameName: parsed.name,
                        status: 'exported'
                    });
                }
            }
        }
        // Send the frames with their PNG bytes to UI for WebSocket transmission
        figma.ui.postMessage({ type: 'send-to-electron', frames });
    }
    else if (msg.type === 'screen-info' && msg.screenInfo) {
        // Received screen info from UI (which got it from Grid app)
        // This information would be used for exports, but currently UI handles this
        console.log('Received screen info:', msg.screenInfo);
        // We could update the exportFrameAsPng function to use this info,
        // but for now UI layer will handle the screen dimensions
    }
});
