import {BrowserWindow, dialog, ipcMain} from "electron";
import {dialogShow, memory} from "./util";
import * as fs from "fs";
import path from "path";

export default function initChannels() {
    ipcMain.handle('select-Directory', (event, args) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return
        const dirs = dialog.showOpenDialogSync(win, {
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
        BrowserWindow.fromWebContents(event.sender)?.flashFrame(true)
    })
    ipcMain.handle('fs-write-file', (event, args: { path: string, arrayBuffer: ArrayBuffer }) => {
        const {path, arrayBuffer} = args
        const buffer = Buffer.from(arrayBuffer)
        return new Promise((resolve, reject) => {
            fs.writeFile(path, buffer, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve({success: true})
                }
            })
        })
    })
    ipcMain.on('fs-mkdir-sync', (event, dir: string) => {
        fs.mkdirSync(dir, {recursive: true})
        event.returnValue = dir
    })
    ipcMain.on('path-resolve-sync', (event, dir, name) => {
        event.returnValue = path.resolve(dir, name)
    })
    ipcMain.on('main-listener-count-sync', (event, channel) => {
        event.returnValue = ipcMain.listenerCount(channel)
    })
    ipcMain.on('user-agent-sync', (event) => {
        event.returnValue = event.sender.userAgent
    })

    ipcMain.on('close', (event) => {
        BrowserWindow.fromWebContents(event.sender)?.close()
    })
    ipcMain.on('maximize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return
        if (win.isMaximizable()) {
            win.maximize()
        }
    })
    ipcMain.on('unmaximize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return
        if (win.isMaximized()) {
            win.unmaximize()
        }
    })
    ipcMain.on('minimize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return
        if (win.isMaximized() && win.isMinimizable()) {
            win.minimize()
        }
    })
    ipcMain.on('head-bar-double-click', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return
        if (win.isFullScreen()) {
            win.setFullScreen(false)
        } else if (win.isMaximized()) {
            win.unmaximize()
        } else {
            win.maximize()
        }
    })
    ipcMain.on('get-memory-data-sync', (event, key) => {
        event.returnValue = memory.get(key)
    })
}