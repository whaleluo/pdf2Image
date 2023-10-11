import {BrowserView, BrowserWindow, ipcMain, webContents, WebContents} from "electron";
import path from "path";
import FindInPageOptions = Electron.FindInPageOptions;

export class FindView {
    public static marginRight = 20
    public static marginTop = 20
    private static width = 227
    private static height = 37
    private static browserView: BrowserView | null = null
    private static findWebContentId: number | null = null
    private static findText = ''

    public static get id() {
        return FindView.browserView?.webContents.id
    }

    public static get findWindow(): null | BrowserWindow {
        return FindView.findWebContents ? BrowserWindow.fromWebContents(FindView.findWebContents) : null
    }

    public static get findWebContents(): null | WebContents {
        return FindView.findWebContentId ? (webContents.fromId(FindView.findWebContentId) ?? null) : null
    }

    public static emit = () => {
        if (!this.browserView) this.createView()
        let focusContent = webContents.getFocusedWebContents()
        if (!focusContent) return;
        if (focusContent?.id === this.id) {
            // use lastWebContentId
            focusContent = this.findWebContents
        }
        if (!focusContent) return;
        const focusWin = BrowserWindow.fromWebContents(focusContent)
        if (!focusWin) return;
        if (this.isShowInWindow(<BrowserView>this.browserView, focusWin) && this.findWebContents === focusContent) {
            return;
        }
        // clear latest listener
        this.clearListener()
        // add new listener
        focusContent.addListener('found-in-page', (event, result) => {
            const {matches, activeMatchOrdinal} = result
            this.browserView?.webContents.send('found-in-page', {matches, activeMatchOrdinal})
        })
        focusWin.addListener('resize', this.resizeViewBounds)
        focusWin.addListener('closed', this.closeFindView)

        this.findWebContentId = focusContent.id

        focusWin.addBrowserView(<Electron.BrowserView>this.browserView)
        this.resizeViewBounds()
        this.browserView?.webContents.focus()

        if (this.findText) {
            this.findWebContents?.findInPage(this.findText, {findNext: true, forward: true})
        }
    }

    public static closeFindView() {
        // focusWin.addListener('closed', this.closeFindView)
        // console.log(this)
        // this will be pointed BrowserWindow in listeners
        // 所以最好用箭头表达式
        console.log('[FindView] closeFindView')
        FindView.clearListener()
        if (FindView.findWindow?.isDestroyed() === false) {
            if (FindView.browserView) FindView.findWindow.removeBrowserView(FindView.browserView)
        }
        // @ts-ignore
        FindView.browserView?.webContents.destroy()
    }

    public static isShowInWindow = (view: BrowserView, win: BrowserWindow) => {
        const views = win.getBrowserViews()
        return views.some(v => v === view)
    }

    private static createView = () => {
        this.browserView = new BrowserView({
            webPreferences: {
                nodeIntegration: true, webSecurity: false, sandbox: false, contextIsolation: false
            }
        })
        this.browserView.webContents.on('destroyed', () => {
            ipcMain.removeHandler('find-in-page')
            ipcMain.removeHandler('stop-find-in-page')
            ipcMain.removeHandler('close-find-view')
            this.findText = ""
            this.browserView = null
        })
        this.browserView.webContents.loadURL(path.join(__dirname, `../resources/findView.html`))

        ipcMain.handle('find-in-page', (event, {text, options}: { text: string, options: FindInPageOptions }) => {
            this.findText = text
            this.findInPage(text, options)
        })
        ipcMain.handle('stop-find-in-page', () => {
            this.stopFindInPage()
        })
        ipcMain.handle('close-find-view', () => {
            this.closeFindView()
        })
    }

    private static resizeViewBounds = () => {
        if (!this.findWindow || this.findWindow.isDestroyed() === true) return
        this.browserView?.setBounds({
            x: this.findWindow.getBounds().width - FindView.width - FindView.marginRight,
            y: FindView.marginTop,
            width: FindView.width,
            height: FindView.height
        })
    }

    private static clearListener = () => {
        if (this.findWindow?.isDestroyed() === false) {
            this.findWindow.removeListener('resize', this.resizeViewBounds)
            this.findWindow.removeListener('closed', this.closeFindView)
        }
        if (this.findWebContents?.isDestroyed() === false) {
            this.findWebContents?.stopFindInPage('clearSelection')
            this.findWebContents?.removeAllListeners('find-in-page')
        }
    }

    private static findInPage = (text: string, options: FindInPageOptions) => {
        if (Object.prototype.toString.call(text) != '[object String]') return
        if (text.length === 0) {
            this.stopFindInPage()
            return;
        }
        this.findWebContents?.findInPage(text, options)
    }

    private static stopFindInPage = () => {
        this.findWebContents?.stopFindInPage('clearSelection')
    }

}