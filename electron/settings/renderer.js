document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Settings] Renderer loaded');


    const navButtons = document.querySelectorAll('.nav-item');


    const tabPanels = document.querySelectorAll('.tab-panel');


    function switchTab(tabId) {

        navButtons.forEach((btn) => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach((panel) => {
            panel.classList.remove('active');
        });


        const activeBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        const activePanel = document.getElementById(`tab-${tabId}`);

        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-selected', 'true');
        }
        if (activePanel) {
            activePanel.classList.add('active');
        }
    }


    navButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            if (tabId) switchTab(tabId);
        });
    });


    async function loadSettings() {
        try {
            if (!window.electron?.ipcRenderer) {
                console.warn('[Settings] IPC not available; running outside Electron');
                return;
            }

            const settings = await window.electron.ipcRenderer.invoke('settings:get-all');
            if (!settings) return;

            console.log('[Settings] Loaded settings:', Object.keys(settings).length, 'keys');


            document.querySelectorAll('input[type="checkbox"][data-setting]').forEach((el) => {
                const key = el.getAttribute('data-setting');
                if (key && key in settings) {
                    el.checked = !!settings[key];
                }
            });


            document.querySelectorAll('select[data-setting]').forEach((el) => {
                const key = el.getAttribute('data-setting');
                if (key && key in settings) {
                    el.value = settings[key];
                }
            });


            const accentColor = document.getElementById('accentColor');
            if (accentColor && settings.accentColor) {
                accentColor.value = settings.accentColor;
            }


            const fontScale = document.getElementById('fontScale');
            const fontScaleValue = document.getElementById('fontScaleValue');
            if (fontScale && settings.fontScale != null) {
                fontScale.value = settings.fontScale;
                if (fontScaleValue) {
                    fontScaleValue.textContent = `${Math.round(settings.fontScale * 100)}%`;
                }
            }


            const theme = settings.theme || 'system';
            document.querySelectorAll('.theme-option').forEach((btn) => {
                btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
            });


            const downloadPathDisplay = document.getElementById('downloadPathDisplay');
            if (downloadPathDisplay && settings.downloadPath) {
                downloadPathDisplay.textContent = settings.downloadPath;
            }

        } catch (err) {
            console.error('[Settings] Failed to load settings:', err);
        }
    }


    async function saveSetting(key, value) {
        try {
            if (!window.electron?.ipcRenderer) return;
            await window.electron.ipcRenderer.invoke('settings:set', key, value);
            console.log(`[Settings] Saved: ${key} = ${JSON.stringify(value)}`);
        } catch (err) {
            console.error(`[Settings] Failed to save ${key}:`, err);
        }
    }


    document.querySelectorAll('input[type="checkbox"][data-setting]').forEach((el) => {
        el.addEventListener('change', () => {
            const key = el.getAttribute('data-setting');
            if (key) {

                if (key === 'startOnLogin') {
                    if (window.electron?.ipcRenderer) {
                        window.electron.ipcRenderer.invoke('settings:toggle-login-item');
                    }
                } else {
                    saveSetting(key, el.checked);
                }
            }
        });
    });


    document.querySelectorAll('select[data-setting]').forEach((el) => {
        el.addEventListener('change', () => {
            const key = el.getAttribute('data-setting');
            if (key) {
                saveSetting(key, el.value);
            }
        });
    });


    const accentColor = document.getElementById('accentColor');
    if (accentColor) {

        let colorTimeout = null;
        accentColor.addEventListener('input', () => {
            clearTimeout(colorTimeout);
            colorTimeout = setTimeout(() => {
                saveSetting('accentColor', accentColor.value);
            }, 300);
        });
    }


    const fontScale = document.getElementById('fontScale');
    const fontScaleValue = document.getElementById('fontScaleValue');

    if (fontScale) {
        fontScale.addEventListener('input', () => {
            const value = parseFloat(fontScale.value);
            if (fontScaleValue) {
                fontScaleValue.textContent = `${Math.round(value * 100)}%`;
            }
        });

        fontScale.addEventListener('change', () => {
            const value = parseFloat(fontScale.value);
            saveSetting('fontScale', value);
        });
    }


    document.querySelectorAll('.theme-option').forEach((btn) => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            if (!theme) return;


            document.querySelectorAll('.theme-option').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');


            saveSetting('theme', theme);
        });
    });


    function addDownloadListener(btnId, platform) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', () => {
            console.log(`[Settings] Download requested: ${platform}`);
            if (window.electron?.downloadPlatform) {
                window.electron.downloadPlatform(platform);
            } else if (window.electron?.ipcRenderer) {
                window.electron.ipcRenderer.invoke('download-platform', platform);
            } else {
                console.error('[Settings] Electron API not available');
                alert('Download failed: running outside Electron');
            }
        });
    }

    addDownloadListener('btn-win', 'win');
    addDownloadListener('btn-mac', 'mac');
    addDownloadListener('btn-linux', 'linux');


    const btnChangeDownloadPath = document.getElementById('btn-change-download-path');
    if (btnChangeDownloadPath) {
        btnChangeDownloadPath.addEventListener('click', async () => {
            try {
                if (!window.electron?.ipcRenderer) return;

                const result = await window.electron.ipcRenderer.invoke('dialog:open', {
                    properties: ['openDirectory'],
                    title: 'Choose Download Folder',
                });

                if (result && result.filePaths && result.filePaths.length > 0) {
                    const newPath = result.filePaths[0];
                    await saveSetting('downloadPath', newPath);

                    const display = document.getElementById('downloadPathDisplay');
                    if (display) display.textContent = newPath;
                }
            } catch (err) {
                console.error('[Settings] Failed to change download path:', err);
            }
        });
    }


    const btnCheckUpdates = document.getElementById('btn-check-updates');
    const updateStatus = document.getElementById('update-status');
    const updateStatusText = document.getElementById('update-status-text');

    if (btnCheckUpdates) {
        btnCheckUpdates.addEventListener('click', async () => {
            if (updateStatus) updateStatus.style.display = 'flex';
            if (updateStatusText) updateStatusText.textContent = 'Checking for updates…';
            btnCheckUpdates.disabled = true;

            try {
                if (window.electron?.ipcRenderer) {
                    const result = await window.electron.ipcRenderer.invoke('updater:check');
                    if (result && result.updateAvailable) {
                        if (updateStatusText) {
                            updateStatusText.textContent = `Update available: v${result.version}`;
                        }
                    } else {
                        if (updateStatusText) {
                            updateStatusText.textContent = 'You are on the latest version.';
                        }
                    }
                }
            } catch (err) {
                if (updateStatusText) {
                    updateStatusText.textContent = 'Failed to check for updates.';
                }
                console.error('[Settings] Update check failed:', err);
            } finally {
                btnCheckUpdates.disabled = false;

                setTimeout(() => {
                    if (updateStatus) updateStatus.style.display = 'none';
                }, 5000);
            }
        });
    }


    const btnClearAllData = document.getElementById('btn-clear-all-data');
    if (btnClearAllData) {
        btnClearAllData.addEventListener('click', async () => {
            const confirmed = confirm(
                'Are you sure you want to clear all local data?\n\n' +
                'This will delete all settings, caches, and stored data.\n' +
                'This action cannot be undone.'
            );

            if (confirmed && window.electron?.ipcRenderer) {
                try {
                    await window.electron.ipcRenderer.invoke('settings:reset');
                    await loadSettings();
                    alert('All data has been cleared.');
                } catch (err) {
                    console.error('[Settings] Failed to clear data:', err);
                    alert('Failed to clear data.');
                }
            }
        });
    }


    document.querySelectorAll('.link-btn[data-url]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            if (url && window.electron?.ipcRenderer) {
                window.electron.ipcRenderer.invoke('shell:open-external', url);
            } else if (url) {
                window.open(url, '_blank');
            }
        });
    });


    async function loadSystemInfo() {
        try {

            if (window.versions) {
                setTextContent('info-electron', window.versions.electron || '—');
                setTextContent('info-chrome', window.versions.chrome || '—');
                setTextContent('info-node', window.versions.node || '—');
                setTextContent('info-v8', window.versions.v8 || '—');
            }


            if (window.electron?.ipcRenderer) {
                const appInfo = await window.electron.ipcRenderer.invoke('get-app-info');
                if (appInfo) {
                    setTextContent('settings-version', `v${appInfo.version || '0.0.0'}`);
                    setTextContent('current-version-label', `v${appInfo.version || '0.0.0'}`);
                    setTextContent('about-version', `Version ${appInfo.version || '0.0.0'}`);
                    setTextContent('info-platform', appInfo.platform || process.platform || '—');
                    setTextContent('info-arch', appInfo.arch || process.arch || '—');
                }
            }
        } catch (err) {
            console.error('[Settings] Failed to load system info:', err);
        }
    }


    function setTextContent(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }


    await loadSettings();
    await loadSystemInfo();

    console.log('[Settings] Initialization complete');
});
