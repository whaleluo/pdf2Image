import {logoImage, memory} from "./util";
import {app, BrowserWindow, Menu, nativeImage, Tray} from "electron";
import {WindowID} from "./enums";
import {NotificationWindow} from "./notification";

export class TrayUtil {
    private static tray: Tray | null = null
    private static intervalId = -1
    private static intervalTime = 700
    private static isFlashing = false
    private static flag = true
    private static iconImage = logoImage.resize({width: 16, height: 16});
    private static iconEmptyImage = nativeImage.createEmpty().resize({width: 16, height: 16});
    private static messageCount = 0

    public static exists(): boolean {
        return this.tray?.isDestroyed() === false;
    }

    public static initTray() {
        if (this.exists()) return
        const icon = logoImage
        const contextMenu = Menu.buildFromTemplate([
            {
                label: '显示',
                click: () => {
                    BrowserWindow.fromId(memory.get(WindowID.Main))?.show()
                }
            },
            {
                label: '退出',
                click: () => {
                    app.exit()
                }
            }
        ])
        this.tray = new Tray(icon.resize({width: 16, height: 16}))
        this.tray.setToolTip(app.name)
        this.tray.setContextMenu(contextMenu)
        this.tray.on('click', () => {
            if(this.isFlashing){
                NotificationWindow.emitLatestClickEventAtWebContents()
            }
            BrowserWindow.fromId(memory.get(WindowID.Main))?.show()
        })
        return this.tray
    }


    public static flashing() {
        if (!this.exists()) return
        if (process.platform !== "darwin") {
            if (this.isFlashing) return;
            this.intervalId = +setInterval(() => {
                if (!this.tray || this.tray.isDestroyed()) {
                    clearInterval(this.intervalId)
                    return
                }
                this.flag ? this.tray.setImage(this.iconEmptyImage) : this.tray.setImage(this.iconImage)
                this.flag = !this.flag
                // 当应用聚焦时，托盘停止闪烁
                if(BrowserWindow.getFocusedWindow()){
                    this.stopFlashing()
                }

            }, this.intervalTime)
            this.isFlashing = true
        } else {
            this.messageCount++
            app.dock.setBadge(this.messageCount + '')  // 设置小红点
        }
    }

    public static stopFlashing() {
        if (!this.exists()) return
        if (process.platform !== "darwin") {
            clearInterval(this.intervalId)
            this.flag = true
            this.isFlashing = false
            if (this.tray?.isDestroyed() === false) {
                this.tray.setImage(this.iconImage)
            }
        } else {
            this.messageCount = 0
            app.dock.setBadge('')
        }
    }

    public static getIsFlashing() {
        return this.isFlashing
    }
}
