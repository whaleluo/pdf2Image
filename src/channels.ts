import {BrowserWindow, dialog, ipcMain} from "electron";
import {dialogShow} from "./util";

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
}