import { app, BrowserWindow } from 'electron';
import * as getWindows from 'get-windows';
import {exec} from 'child_process';
import { ipcMain } from 'electron';
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
            if (data) {
                mainWindow.webContents.send('active-window-data', data)
                // Get active app path and send it separately
                const appPath = await getActiveAppPath();
                if (appPath) {
                    mainWindow.webContents.send('active-app-path', appPath);
                }
            };
        } catch (error) {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('error', `Error fetching active window: ${error.toString()}`);
            }
        }
    }, 1000);
}
// Get active application executable path using PowerShell (Windows-only)
async function getActiveAppPath() {
    return new Promise((resolve, reject) => {
        exec('powershell -command "Get-Process | Where-Object {$_.MainWindowTitle -ne \'\'} | Select-Object -First 1 Path"', (err, stdout) => {
            if (err || !stdout.trim()) {
                resolve(null); // Return null if PowerShell command fails
            } else {
                resolve(stdout.trim());
            }
        });
    });
}// IPC handler for renderer process to request active app path
ipcMain.handle('get-active-app', async () => {
    try {
        const appPath = await getActiveAppPath();
        return appPath;
    } catch (err) {
        return null;
    }
});
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
