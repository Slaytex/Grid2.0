"use strict";
document.addEventListener('DOMContentLoaded', () => {
    // Add click handler for help link
    const helpLink = document.querySelector('.help-link');
    if (helpLink) {
        helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            parent.postMessage({ pluginMessage: { type: 'open-url', url: 'https://css-playground-f31b22.webflow.io/' } }, '*');
        });
    }
});
