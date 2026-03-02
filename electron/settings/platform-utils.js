function detectPlatform() {

    if (window.electron && window.electron.platform) {
        const p = window.electron.platform;
        if (p === 'win32') return 'win';
        if (p === 'darwin') return 'mac';
        return 'linux';
    }


    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'win';
    if (ua.includes('mac')) return 'mac';
    return 'linux';
}


function getPlatformName(platform) {
    const names = {
        win: 'Windows',
        mac: 'macOS',
        linux: 'Linux',
    };
    return names[platform] || 'Unknown';
}


function highlightCurrentPlatform() {
    const platform = detectPlatform();
    const buttons = document.querySelectorAll('[data-platform]');

    buttons.forEach((btn) => {
        if (btn.getAttribute('data-platform') === platform) {
            btn.classList.add('active', 'current-platform');
        }
    });


    const label = document.getElementById('current-platform-label');
    if (label) {
        label.textContent = `You're on ${getPlatformName(platform)}`;
    }
}


document.addEventListener('DOMContentLoaded', highlightCurrentPlatform);
