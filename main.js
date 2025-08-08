const { app, BrowserWindow, ipcMain } = require('electron');
require('dotenv').config();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true // Required for renderer to use remote
        }
    });
    mainWindow.loadFile('index.html');

    // Open DevTools only in development
    if (process.env.NODE_ENV !== 'production') {
        try { mainWindow.webContents.openDevTools({ mode: 'detach' }); } catch (_) {}
    }

    let getWindows;
    import('get-windows').then(module => {
        getWindows = module;
        
        // Handle requests for active window data
        ipcMain.on('request-active-window', async () => {
            try {
                if (!mainWindow || mainWindow.isDestroyed() || !getWindows) return;
                
                const data = await getWindows.activeWindow();
                
                if (data && data.owner && data.owner.path) {
                    try {
                        const icon = await app.getFileIcon(data.owner.path);
                        data.icon = icon.toDataURL();
                    } catch (iconError) {
                        console.error('Could not get file icon:', iconError);
                        data.icon = null; // Send null if icon fetching fails
                    }
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('active-window-data', data);
                    }
                }
            } catch (error) {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    console.error('Error fetching active window:', error);
                }
            }
        });

    }).catch(err => {
        console.error("Failed to load get-windows", err);
    });
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
