import {BrowserWindow, dialog, ipcMain} from "electron";
import {dialogShow} from "./util";
import * as fs from "fs";
import path from "path";

export default function initChannels() {
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
    ipcMain.on('main-listener-count-sync',(event, channel)=> {
        event.returnValue = ipcMain.listenerCount(channel)
    })
}