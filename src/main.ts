'use strict';
import {app, ipcMain, BrowserWindow, dialog, Menu, nativeImage,MessageBoxOptions} from "electron";
import {autoUpdater} from "electron-updater"
import path from "path";
const main = {};

// Modules to control application life and create native browser window
const logoImage = nativeImage.createFromPath(path.join(__dirname, '../resources/img/favicon.ico'))
function createWindow() {
    ipcMain.handle('select-Directory', (event, args) => {
        const dirs = dialog.showOpenDialogSync(BrowserWindow.fromWebContents(event.sender), {
            properties: ['openDirectory']
        })
        return dirs?.[0]
    })
    ipcMain.handle('dialog-show', (event, args) => {
        dialogShow({
            title: '提示',
            message: args,
        })
    })
    ipcMain.handle('success', (event, args) => {
        BrowserWindow.fromWebContents(event.sender).flashFrame(true)
    })

    const mainWindow = new BrowserWindow({
        width: 860,
        height: 700,
        resizable: true,
        icon: logoImage,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('resources/index.html');
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools({mode: "detach"})
    }
}

Menu.setApplicationMenu(null)
app.whenReady().then(() => {
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    checkingUpdae()
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

async function checkingUpdae() {
    if (!app.isPackaged) {
        autoUpdater.forceDevUpdateConfig = true
    }
    autoUpdater.autoDownload = false;
    autoUpdater.on('error', (error) => {
        if(error.message.startsWith('net')){
            // net::ERR_PROXY_CONNECTION_FAILED
            console.log('update net error')
            return
        }
        dialogShow({
            title:'软件升级错误',
            message:error.message
        })
    });
    // 检测是否需要更新
    autoUpdater.on('checking-for-update', () => {
        console.log('checking-for-update')
    });
    autoUpdater.on('update-available', () => {
        // 检测到可以更新时
        // 这里我们可以做一个提示，让用户自己选择是否进行更新
        dialogShow({
            type: 'info',
            title: '应用有新的更新',
            message: '发现新版本，是否现在更新？',
            buttons: ['是', '否']
        }).then(({response}) => {
            console.log(response)
            if (response === 0) {
                // 下载更新
                autoUpdater.downloadUpdate();
            }
        });
        // 也可以默认直接更新，二选一即可
        // autoUpdater.downloadUpdate();
    });
    // 检测到不需要更新时
    autoUpdater.on('update-not-available', () => {
        // todo 这里可以做静默处理，不给渲染进程发通知，或者通知渲染进程当前已是最新版本，不需要更新
    });
    // 更新下载进度
    autoUpdater.on('download-progress', (progress) => {
        // todo 直接把当前的下载进度发送给渲染进程即可，有渲染层自己选择如何做展示
        // {
        //     total: 60931461,
        //         delta: 1318146,
        //     transferred: 60931461,
        //     percent: 100,
        //     bytesPerSecond: 736341
        // }
    });
    // 当需要更新的内容下载完成后
    autoUpdater.on('update-downloaded', () => {
        // 给用户一个提示，然后重启应用；或者直接重启也可以，只是这样会显得很突兀
        dialogShow({
            title: '安装更新',
            message: '更新下载完毕，应用将重启并进行安装',
            buttons: ['是', '否']
        }).then(({response}) => {
            if (response === 0) {
                // 退出并安装应用
                setImmediate(() => autoUpdater.quitAndInstall());
            }
        });
    });
    // 我们需要主动触发一次更新检查
    await autoUpdater.checkForUpdates();
}

function dialogShow(msgOpt:MessageBoxOptions) {
    return dialog.showMessageBox(Object.assign(msgOpt,{icon:logoImage}))
}
module.exports = main;
