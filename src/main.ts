'use strict';
import {app, BrowserWindow, Menu} from "electron";
import {checkingUpdae, handleUrlFromWeb} from "./util";
import {createMainWindow} from "./window";
import initChannels from "./channels";

const main = {};
let mainWindow: null | BrowserWindow = null
const additionalData = {myKey: 'myValue'}
const gotTheLock = app.requestSingleInstanceLock(additionalData)
if (!gotTheLock) {
    app.quit()
} else {
    handleUrlFromWeb('firstInstance', process.argv)
    initChannels()
    app.on('second-instance', (event, argv, workingDirectory, additionalData) => {
        console.log(additionalData)
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (process.platform === 'win32' || process.platform === 'linux') {
                handleUrlFromWeb('firstInstance', argv)
            }
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
    app.on('open-url', (event, url) => {
        handleUrlFromWeb('secondInstance', [url])
    })
    Menu.setApplicationMenu(null)
    app.whenReady().then(() => {
        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow();
        });
        checkingUpdae()
        mainWindow = createMainWindow()
        if (!app.isPackaged) {
            mainWindow.webContents.openDevTools({mode: "detach"})
        }
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit();
    });
}

module.exports = main;
