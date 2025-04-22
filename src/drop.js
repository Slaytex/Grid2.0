const fs = require('fs');
const path = require('path');

// Load monitor presets from JSON file
function loadMonitorPresets() {
    const presetsPath = path.join(__dirname, 'monitor-presets.json');
    const presetsData = fs.readFileSync(presetsPath, 'utf8');
    return JSON.parse(presetsData);
}

document.addEventListener('DOMContentLoaded', () => {
    // Load monitor presets
    fetch('monitor-presets.json')
        .then(response => response.json())
        .then(data => {
            const presetsDatalist = document.getElementById('monitor-presets');
            data.presets.forEach(preset => {
                const option = document.createElement('option');
                option.value = `${preset.name} | ${preset.width}×${preset.height}cm`;
                option.dataset.width = preset.width;
                option.dataset.height = preset.height;
                presetsDatalist.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading presets:', error));

    // Handle selection
    document.getElementById('monitor-select').addEventListener('change', function() {
        const selectedOption = Array.from(document.getElementById('monitor-presets').options)
            .find(option => option.value === this.value);
            
        if (selectedOption) {
            document.getElementById('monitor-width').value = selectedOption.dataset.width;
            document.getElementById('monitor-height').value = selectedOption.dataset.height;
            initializeGrid();
        }
    });
}); 