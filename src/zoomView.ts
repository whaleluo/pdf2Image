import {BrowserView, BrowserWindow, ipcMain, webContents, WebContents} from 'electron'
import {clearTimeout} from "timers";
import path from "path";

class ZoomView {
    public static marginRight = 20
    public static marginTop = 20
    private static width = 227
    private static instance: ZoomView | null = null
    private static height = 37
    private static minFactor = 0.5
    private static maxFactor = 5
    private static stepFactor = 0.2
    private static resetFactor = 1
    private readonly browserView: BrowserView
    private findWebContentId: number | null = null
    private readonly resizeViewBounds: () => void
    private timoutId = 0

    private constructor() {
        this.browserView = new BrowserView({
            webPreferences: {
                nodeIntegration: true, webSecurity: false, sandbox: false, contextIsolation: false
            }
        })
        this.browserView.webContents.loadURL(path.join(__dirname, `../resources/zoomView.html`))
        this.browserView.webContents.on('zoom-changed', (event, zoomDirection) => {
            event.preventDefault()
            this.emit(this.findWebContents, zoomDirection === 'out' ? 'SUBTRACT' : 'ADD')
        })
        this.browserView.webContents.on('destroyed', () => {
            ZoomView.clearListener()
            ZoomView.instance = null
        })
        this.resizeViewBounds = () => {
            console.log('resize-view-bounds')
            if (!this.findWindow || this.findWindow.isDestroyed() === true) return
            this.browserView.setBounds({
                x: this.findWindow.getBounds().width - ZoomView.width - ZoomView.marginRight,
                y: ZoomView.marginTop,
                width: ZoomView.width,
                height: ZoomView.height
            })
        }
        this.initListener()

    }

    public get id() {
        return this.browserView.webContents.id
    }

    public get findWindow(): null | BrowserWindow {
        return this.findWebContents ? BrowserWindow.fromWebContents(this.findWebContents) : null
    }

    public get findWebContents(): null | WebContents {
        return this.findWebContentId ? (webContents.fromId(this.findWebContentId) ?? null) : null
    }

    public static getInstance() {
        if (!ZoomView.instance) {
            ZoomView.instance = new ZoomView()
        }
        return ZoomView.instance
    }

    private static clearListener() {
        ipcMain.removeHandler('zoom-action')
        ipcMain.removeHandler('zoom-factor')
        ipcMain.removeHandler('zoom-mouse-action')
    }

    public emit(focusContent: WebContents | null, action: ZoomAction) {
        if (!focusContent || focusContent.isDestroyed() === true) return;
        if (focusContent.id === this.id) {
            // use lastWebContentId
            if (!this.findWebContents) return
            focusContent = this.findWebContents
        }
        const focusWin = BrowserWindow.fromWebContents(focusContent)
        if (!focusWin) return;
        if (!this.isShowInWindow(this.browserView, focusWin) || this.findWebContents !== focusContent) {
            // clear last listener
            if (this.findWindow?.isDestroyed() === false) {
                this.findWindow.removeListener('resize', this.resizeViewBounds)
            }
            // add new listener
            focusWin.addListener('resize', this.resizeViewBounds)

            this.findWebContentId = focusContent.id
            focusWin.addBrowserView(this.browserView)
            this.resizeViewBounds()
        }
        this.updateZoomFactor(focusContent, action)
    }

    private initListener() {
        ipcMain.handle('zoom-factor', (event) => {
            if (event.sender === this.browserView.webContents) {
                return this.findWebContents?.zoomFactor
            }
            return event.sender.zoomFactor
        })
        ipcMain.handle('zoom-action', (event, action: ZoomAction) => {
            this.updateZoomFactor(this.findWebContents, action)
        })
        ipcMain.handle('zoom-mouse-action', (event, action: 'enter' | 'leave') => {
            if (action === 'enter') {
                this.debounceClose(false)
            } else if (action === "leave") {
                this.debounceClose()
            }
        })
    }

    private debounceClose(nextTick = true) {
        clearTimeout(this.timoutId)
        if (!nextTick) return
        this.timoutId = +setTimeout(() => this.close(), 3000)
    }

    private close() {
        if (this.findWindow?.isDestroyed() === false) {
            this.findWindow.removeBrowserView(this.browserView)
            this.findWindow.removeListener('resize', this.resizeViewBounds)
        }
        // @ts-ignore
        this.browserView.webContents.destroy()
    }

    private updateZoomFactor(webContent: WebContents | null, action: ZoomAction) {
        if (!webContent || webContent?.isDestroyed() === true) return;
        this.debounceClose()
        let currentZoom = webContent.getZoomFactor()
        if (action === 'ADD') {
            currentZoom + ZoomView.stepFactor > ZoomView.maxFactor ? currentZoom = ZoomView.maxFactor : currentZoom += ZoomView.stepFactor
        } else if (action === 'SUBTRACT') {
            currentZoom - ZoomView.stepFactor < ZoomView.minFactor ? currentZoom = ZoomView.minFactor : currentZoom -= ZoomView.stepFactor

        } else if (action === 'RESET') {
            currentZoom = ZoomView.resetFactor
        } else {
            return
        }
        webContent.setZoomFactor(currentZoom)
        this.sendZoomFactor(currentZoom)
    }

    private sendZoomFactor(zoomFactor: number) {
        this.browserView.webContents.send('zoom-changed', (zoomFactor * 100).toFixed(0) + '%')
    }

    private isShowInWindow(view: BrowserView, win: BrowserWindow) {
        const views = win.getBrowserViews()
        return views.some(v => v === view)
    }
}

type ZoomAction = ('ADD' | 'SUBTRACT' | 'RESET')
export default ZoomView