import {BrowserWindow} from "electron";
import {logoImage, memory} from "./util";
import {WindowID} from "./enums";

export function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 860,
        height: 700,
        resizable: true,
        icon: logoImage,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
        }
    });
    mainWindow.loadFile('resources/index.html');
    memory.set(WindowID.Main, mainWindow.id)
    mainWindow.on('close', (event) => {
        event.preventDefault()
        mainWindow.hide()
    })
    return mainWindow
}