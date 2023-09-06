import {BrowserWindow} from "electron";
import {logoImage} from "./util";
import path from "path";

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
            preload:path.resolve(__dirname,'preload.js')
        }
    });
    mainWindow.loadFile('resources/index.html');
    return mainWindow
}