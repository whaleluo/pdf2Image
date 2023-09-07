'use strict';
import {app, BrowserWindow} from "electron";
import {checkingUpdae, dialogShow, handleUrlFromWeb, memory} from "./util";
import {createMainWindow} from "./window";
import initChannels from "./channels";
import {
    initErrorHadle,
    initGlobalShortcut,
    initMenu,
    initSession,
    initTray,
    initUserAgent,
    initWebContentsConfig
} from './initApp'
import {WindowID} from "./enums";

const main = {}
// (Use `electron --trace-warnings ...` to show where the warning was created)
process.traceProcessWarnings = true
handleUrlFromWeb('firstInstance', process.argv)
const additionalData = {myKey: 'myValue'}
const gotTheLock = app.requestSingleInstanceLock(additionalData)
if (!gotTheLock) {
    app.quit()
} else {
    initErrorHadle(errMsg => dialogShow({title: 'Error', message: errMsg}))
    initChannels()
    initUserAgent()
    initSession()
    initMenu()
    initGlobalShortcut()
    initWebContentsConfig()
    app.on('second-instance', (event, argv, workingDirectory, additionalData) => {
        console.log(additionalData)
        // Someone tried to run a second instance, we should focus our window.
        const mainWindow = BrowserWindow.fromId(memory.get(WindowID.Main))
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
    app.whenReady().then(() => {
        initTray()
        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
        });
        checkingUpdae()
        createMainWindow()
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit();
    });
}

module.exports = main;
