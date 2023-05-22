'use strict';
import {app, ipcMain,BrowserWindow, dialog,Menu,nativeImage} from "electron";
import path from "path";
const main = {};

// Modules to control application life and create native browser window
function createWindow () {
    const logoImage = nativeImage.createFromPath(path.join(__dirname,'../resources/img/favicon.ico'))
    ipcMain.handle('select-Directory', (event, args)=>{
        const dirs = dialog.showOpenDialogSync(BrowserWindow.fromWebContents(event.sender), {
            properties: ['openDirectory']
        })
        return dirs?.[0]
    })
    ipcMain.handle('dialog-show',(event, args)=>{
        dialog.showMessageBoxSync(BrowserWindow.fromWebContents(event.sender), {
            message:args,
            type:'info',
            icon:logoImage,
            title:'提示'
        })
    })
    ipcMain.handle('success',(event, args)=>{
        BrowserWindow.fromWebContents(event.sender).flashFrame(true)
    })

    const mainWindow = new BrowserWindow({
        width: 860,
        height: 700,
        resizable:true,
        icon:logoImage,
        webPreferences: {
            nodeIntegration:true,
            contextIsolation:false
        }
    });
    mainWindow.loadFile('resources/index.html');

    if(! app.isPackaged){
        mainWindow.webContents.openDevTools({mode:"detach"})
    }
}

Menu.setApplicationMenu(null)
app.whenReady().then(() => {
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

module.exports = main;
