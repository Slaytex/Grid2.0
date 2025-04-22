// Debug logging helper
function addDebug(message) {
    const debug = document.getElementById('debug');
    const timestamp = new Date().toLocaleTimeString();
    debug.innerHTML = `${timestamp} ${message}<br>${debug.innerHTML}`;
    console.log('Debug:', message);
}

// Button click handler
document.getElementById('sendButton').addEventListener('click', async function() {
    console.log('Button clicked!');
    addDebug('Button clicked!');
    
    const button = this;
    const selectedFrames = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    console.log('Selected frames:', selectedFrames);
    addDebug(`Selected frames: ${selectedFrames.length}`);

    if (selectedFrames.length > 0) {
        try {
            button.textContent = 'Sending...';
            button.classList.add('sending');
            button.disabled = true;
            
            addDebug(`Sending ${selectedFrames.length} frames...`);
            
            // Simulate sending delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            button.textContent = 'Success!';
            button.classList.remove('sending');
            button.classList.add('success');
            
            setTimeout(() => {
                button.textContent = 'Send to Grid';
                button.classList.remove('success');
                button.disabled = false;
            }, 2000);
            
        } catch (error) {
            addDebug(`Error: ${error.message}`);
            button.textContent = 'Error!';
            button.classList.remove('sending');
            button.classList.add('error');
            
            setTimeout(() => {
                button.textContent = 'Send to Grid';
                button.classList.remove('error');
                button.disabled = false;
            }, 2000);
        }
    } else {
        addDebug('No frames selected!');
    }
});

// Simulate connection status changes
function toggleConnection() {
    const light = document.querySelector('.status-light');
    const text = document.querySelector('.connection-status span');
    const isConnected = !light.classList.contains('disconnected');
    
    if (isConnected) {
        light.classList.add('disconnected');
        text.textContent = 'DISCONNECTED';
        addDebug('Disconnected');
    } else {
        light.classList.remove('disconnected');
        text.textContent = 'CONNECTED';
        addDebug('Connected');
    }
} 