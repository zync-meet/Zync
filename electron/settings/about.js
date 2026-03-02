async function initAboutTab() {
    try {

        const info = await window.electron.getAppInfo();


        setTextContent('app-version', `v${info.version}`);
        setTextContent('electron-version', info.electronVersion);
        setTextContent('chrome-version', info.chromeVersion);
        setTextContent('node-version', info.nodeVersion);
        setTextContent('v8-version', info.v8Version);
        setTextContent('platform-info', `${info.platform} (${info.arch})`);
        setTextContent('user-data-path', info.userDataPath);

    } catch (error) {
        console.error('[About] Failed to load app info:', error);
        setTextContent('app-version', 'Error loading version');
    }
}


function setTextContent(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}


function copyVersionInfo() {
    const elements = [
        'app-version',
        'electron-version',
        'chrome-version',
        'node-version',
        'platform-info',
    ];

    const info = elements
        .map((id) => {
            const el = document.getElementById(id);
            const label = id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            return `${label}: ${el ? el.textContent : 'N/A'}`;
        })
        .join('\n');

    window.electron.copyToClipboard(info);


    const btn = document.getElementById('copy-version-btn');
    if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = original;
        }, 2000);
    }
}


document.addEventListener('DOMContentLoaded', initAboutTab);
