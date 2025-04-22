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
// Keep track of the latest screen info received from the UI layer
let lastReceivedScreenInfo = null;
// Size code mappings (remain in CM as source)
const SIZE_CODES = {
    'SA': { widthCM: 32.333, heightCM: 18.187 },
    'SB': { widthCM: 34.5, heightCM: 19.4 },
    'SC': { widthCM: 37.63, heightCM: 21.17 },
    'LI': { widthCM: 28.56, heightCM: 16.06 },
    'WE': { widthCM: 58.406, heightCM: 21.902 },
    'WS': { widthCM: 58.406, heightCM: 12.9 },
    'WF': { widthCM: 45.38, heightCM: 10.047 }
};
// Function to parse frame names (now interprets dimensions as inches)
function parseFrameName(fullName) {
    // First, try to match the format name#CODE# (standard size)
    const codeMatch = fullName.match(/^(.+)#([A-Z]+)#$/);
    if (codeMatch) {
        const name = codeMatch[1].trim();
        const code = codeMatch[2];
        if (SIZE_CODES[code]) {
            return {
                name: name,
                widthInches: SIZE_CODES[code].widthCM * 0.393701, // Convert CM to inches
                heightInches: SIZE_CODES[code].heightCM * 0.393701 // Convert CM to inches
            };
        }
    }
    // If not a code, try the format: name#widthxheight (now assuming INCHES)
    const dimensionMatch = fullName.match(/^(.+)#(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
    if (dimensionMatch) {
        return {
            name: dimensionMatch[1].trim(),
            widthInches: parseFloat(dimensionMatch[2]), // Now directly interpreted as inches
            heightInches: parseFloat(dimensionMatch[3]) // Now directly interpreted as inches
        };
    }
    return null;
}
// Optimized function to collect frame data (now collects inch values)
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
                    widthInches: parsed.widthInches,
                    heightInches: parsed.heightInches,
                    originalName: frame.name,
                    // imageBytes added later during export
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
// Updated: Export frame as PNG, potentially using screen info for scaling
function exportFrameAsPng(node) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let scaleFactor = 1; // Default scale factor
            if (lastReceivedScreenInfo && lastReceivedScreenInfo.ppi) {
                // Example logic: Export at 2x if screen PPI is high (e.g., > 150)
                // You might refine this logic based on Figma's native resolution (72ppi)
                // or the specific needs for sharpness on the target display.
                if (lastReceivedScreenInfo.ppi > 150) {
                    scaleFactor = 2;
                    console.log(`High PPI screen (${lastReceivedScreenInfo.ppi.toFixed(0)}) detected, exporting at ${scaleFactor}x`);
                }
                else {
                    console.log(`Standard PPI screen (${lastReceivedScreenInfo.ppi.toFixed(0)}) detected, exporting at ${scaleFactor}x`);
                }
            }
            else {
                // If no PPI info, fallback to a default (e.g., 1x or 2x)
                scaleFactor = 2; // Default to 2x if PPI unknown, often a good balance
                console.log(`Screen PPI unknown, exporting at default ${scaleFactor}x`);
            }
            const settings = {
                format: 'PNG',
                constraint: { type: 'SCALE', value: scaleFactor }
            };
            console.log(`Exporting frame "${node.name}" with settings:`, settings);
            return yield node.exportAsync(settings);
        }
        catch (error) {
            console.error(`Error exporting frame "${node.name}":`, error);
            throw error;
        }
    });
}
// Count matching frames (remains the same)
function countMatchingFrames() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create regex patterns
        const dimensionPattern = /^.+#\d+(?:\.\d+)?x\d+(?:\.\d+)?$/;
        const codePattern = /^.+#[A-Z]+#$/;
        // Get selected nodes from current page
        const selection = figma.currentPage.selection;
        // Filter selected nodes that are frames with matching naming patterns
        return selection.filter(node => node.type === 'FRAME' && (dimensionPattern.test(node.name) || codePattern.test(node.name))).length;
    });
}
// Show UI with initial empty state
figma.showUI(__html__, { width: 350, height: 500 });
// Initial state only shows UI without scanning frames
figma.ui.postMessage({ type: 'init-ui' });
// Request screen info when plugin loads (remains useful)
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
        const framesToExport = []; // Store frames with exported bytes
        figma.ui.postMessage({ type: 'export-started', count: msg.frameNames.length });
        for (let i = 0; i < msg.frameNames.length; i++) {
            const frameName = msg.frameNames[i];
            const frameNode = figma.currentPage.findOne(node => node.type === 'FRAME' && node.name === frameName);
            if (frameNode) {
                const parsed = parseFrameName(frameNode.name); // Parses name to get base info (now uses inches)
                if (parsed) {
                    figma.ui.postMessage({ type: 'export-progress', current: i + 1, total: msg.frameNames.length, frameName: parsed.name, status: 'exporting' });
                    try {
                        const imageBytes = yield exportFrameAsPng(frameNode); // Export happens here
                        framesToExport.push({
                            name: parsed.name,
                            widthInches: parsed.widthInches, // Now using inches directly
                            heightInches: parsed.heightInches,
                            originalName: frameNode.name,
                            imageBytes: imageBytes // Add the exported bytes
                        });
                        figma.ui.postMessage({ type: 'export-progress', current: i + 1, total: msg.frameNames.length, frameName: parsed.name, status: 'exported' });
                    }
                    catch (exportError) {
                        console.error(`Failed to export frame: ${frameName}`, exportError);
                        figma.ui.postMessage({ type: 'export-progress', current: i + 1, total: msg.frameNames.length, frameName: parsed.name, status: 'error' });
                        // Optionally notify user of specific export failure
                    }
                }
            }
        }
        // Send the frames that successfully exported (with bytes) to UI for WebSocket transmission
        if (framesToExport.length > 0) {
            figma.ui.postMessage({ type: 'send-to-electron', frames: framesToExport });
        }
        else {
            console.log('No frames were successfully exported.');
            // Optionally notify the user that export failed completely
        }
    }
    else if (msg.type === 'screen-info' && msg.screenInfo) {
        console.log('[Code.ts] Received screen info from UI:', msg.screenInfo);
        lastReceivedScreenInfo = msg.screenInfo; // Cache the latest info
    }
    else if (msg.type === 'get-screen-info') {
        // Request fresh info from the Electron app via the UI layer
        figma.ui.postMessage({ type: 'request-screen-info' });
        console.log('[Code.ts] Requested fresh screen info via UI layer.');
    }
    else if (msg.type === 'request-screen-info-for-export') {
        // Send back the cached info immediately if available
        if (lastReceivedScreenInfo) {
            figma.ui.postMessage({ type: 'screen-info-response', screenInfo: lastReceivedScreenInfo });
        }
        else {
            // If not cached, maybe trigger a request? Or UI handles waiting.
            console.log('[Code.ts] UI requested screen info for export, but none cached yet.');
        }
    }
});
