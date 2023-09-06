import {BrowserWindow} from "electron";
import {logoImage} from "./util";

export function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 860,
        height: 700,
        resizable: true,
        icon: logoImage,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    mainWindow.loadFile('resources/index.html');
    return mainWindow
}