'use strict';
import {app, BrowserWindow} from "electron";
import {dialogShow, handleUrlFromWeb, memory} from "./util";
import {createMainWindow} from "./window";
import initChannels from "./channels";
import {
    initErrorHadle,
    initGlobalShortcut,
    initMenu,
    initSession,
    initUserAgent,
    initWebContentsConfig
} from './initApp'
import {WindowID} from "./enums";
import {NotificationWindow} from "./notification";
import {TrayUtil} from "./tray";
import {checkingUpdae} from "./update";

const main = {}
/***
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
 * modify page performance.memory.jsHeapSizeLimit
 * The maximum size of the heap, in bytes, that is available to the context.
 * app.commandLine.appendSwitch('--js-flags', '--max-heap-size=2048')
 * fix render-process-gone oom
 * bug:
 * let arr = [];while(true){arr.push(new Array(1000000));console.log(performance.memory)}
 * warn:
 * process.getHeapStatistics().heapSizeLimit === performance.memory.jsHeapSizeLimit/1024
 *
 * https://github.com/electron/electron/issues/37214
 */
const maxHeapSize = 2048
if (process.getHeapStatistics().heapSizeLimit < maxHeapSize * 1024) {
    app.commandLine.appendSwitch('--js-flags', `--max-heap-size=${maxHeapSize}`)
}
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
    NotificationWindow.open = true
    NotificationWindow.addListener('created', () => {
        TrayUtil.flashing()
    })
    NotificationWindow.addListener('click', (options) => {
        console.log('[main] NotificationWindow static click once only', options)
    })
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
        TrayUtil.initTray()
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
