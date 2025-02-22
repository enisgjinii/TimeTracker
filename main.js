import { app, BrowserWindow } from 'electron';
import * as getWindows from 'get-windows';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    mainWindow.loadFile('index.html');
    setInterval(async () => {
        try {
            if (!mainWindow || mainWindow.isDestroyed()) return;
            const data = await getWindows.activeWindow();
            if (data) mainWindow.webContents.send('active-window-data', data);
        } catch (error) {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('error', `Error fetching active window: ${error.toString()}`);
            }
        }
    }, 1000);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
