import {BrowserWindow, BrowserWindowConstructorOptions, ipcMain, screen, shell, WebContents,webContents} from "electron";
import {EventEmitter} from "events";
import * as querystring from "querystring";
import * as url from "url";
import path from "path";

export interface INotificationConstructorOptions {
    /**
     * A title for the notification, which will be displayed at the top of the
     * notification window when it is shown.
     */
    title?: string;
    /**
     * A subtitle for the notification, which will be displayed below the title.
     *
     */
    subtitle?: string;
    /**
     * The body text of the notification, which will be displayed below the title or
     * subtitle.
     */
    body?: string;
    /**
     * Whether or not to suppress the OS notification noise when showing the
     * notification.
     */
    silent?: boolean;
    /**
     * An icon to use in the notification.
     */
    icon?: string;
    /**
     * Whether or not to add an inline reply option to the notification.
     *
     */
    hasReply?: boolean;
    /**
     * click callback params
     */
    session?: string
    /**
     * custom css
     */
    style?: string

}


export type INotificationEvent = 'created' | 'click'

/***
 * Usage
 * ipcRenderer.invoke('new-notification',{title:'标题',subTitle:'子标题',body:'消息主体内容',icon:'C:\\Users\\whale\\Pictures\\aaa.png',style:'body{background:red}'})
 */
export class NotificationWindow extends EventEmitter {
    private static eventMap: Map<INotificationEvent, ((...args: any[]) => void)[]> = new Map()
    private static width = 370
    private static height = 80
    private static marginRight = 19
    private static marginBottom = 19
    private static timeout = 5000
    private static pageUrl = path.join(__dirname, `../resources/notificationWindow.html`)
    private static callbackWebContentsId: number
    private static queue: NotificationWindow[] = []
    private static queueLimitSize = 2
    public static open = false
    static {
        ipcMain.handle('click-from-notification-page', (e) => {
            console.log('[NotificationWindow] click-from-notification-page')
            const notify = NotificationWindow.fromWebContents(e.sender)
            try {
                webContents.fromId(this.callbackWebContentsId)?.send('notification-click',(notify?.options))
            }catch (e) {
                console.error('[NotificationWindow]', e)
            }
            notify?.emit('click', notify?.options)
            NotificationWindow.emit('click',notify?.options)
            notify?.window?.close()

        })
        ipcMain.handle('new-notification', (e, options) => {
            if(!NotificationWindow.open) return
            if (!(options instanceof Object)) {
                return 'params error'
            }
            if (!NotificationWindow.callbackWebContentsId) {
                NotificationWindow.callbackWebContentsId = e.sender.id
            }

            new NotificationWindow(options).addListener('click', (params) => {
                console.log('[NotificationWindow] a new NotificationWindow click',params)
            })
        })
    }
    private window: null | BrowserWindow = null
    private closeTimeoutID = -1
    private readonly options: INotificationConstructorOptions


    constructor(options: INotificationConstructorOptions) {
        super();
        this.options = options
        if (this.options.icon) {
            this.options.icon = NotificationWindow.pathToUrl(this.options.icon)
        }
        this.createWindow()
        this.closeTimeoutID = +setTimeout(() => {
            this.window?.close()
        }, NotificationWindow.timeout)
        NotificationWindow.queue.push(this)
    }

    public static addListener(eventName: INotificationEvent, listener: (...args: any[]) => void) {
        const listeners = this.eventMap.get(eventName)
        if (listeners) {
            listeners.push(listener);
        } else {
            this.eventMap.set(eventName, [listener])
        }
    }

    public static removeListener(eventName: INotificationEvent, listener: (...args: any[]) => void) {
        const listeners = this.eventMap.get(eventName)
        if (listeners) {
            const index = listeners.indexOf(listener)
            if (index > 0) {
                listeners.splice(index, 1)
            }
        }
        return this
    }

    public static emit(eventName: INotificationEvent, ...args: any[]): boolean {
        const listeners = this.eventMap.get(eventName)
        if (!listeners) return false
        listeners.forEach(listener => listener(args))
        return true
    }

    public static notify(options: INotificationConstructorOptions) {
        return new NotificationWindow(options)
    }

    public static getAllNotificationWindow = () => {
        return NotificationWindow.queue
    }

    public static fromWindow = (window: BrowserWindow) => {
        let targetNotification: null | NotificationWindow = null
        if (window?.isDestroyed() === false) {
            const target = NotificationWindow.queue.find(item => item.window === window)
            targetNotification = target ? target : null
        }
        return targetNotification
    }

    public static fromWebContents = (webContents: WebContents) => {
        const window = BrowserWindow.fromWebContents(webContents)
        let targetNotification: null | NotificationWindow = null
        if (window?.webContents.isDestroyed() === false) {
            targetNotification = NotificationWindow.fromWindow(window)
        }
        return targetNotification
    }

    public static getDisplay() {
        const display = screen.getPrimaryDisplay()
        const width = display.workArea.x + display.workAreaSize.width
        const height = display.workArea.y + display.workAreaSize.height
        return {width, height}
    }

    public static pathToUrl(path: string) {
        return url.pathToFileURL(path.replace(/^file:[\/]+/i, '')).href
    }

    public addListener(eventName: INotificationEvent, listener: (...args: any[]) => void): this {
        super.addListener(eventName, listener)
        return this
    }

    public removeListener(eventName: INotificationEvent, listener: (...args: any[]) => void): this {
        super.removeListener(eventName, listener)
        return this
    }

    public removeAllListeners(eventName: INotificationEvent): this {
        super.removeAllListeners(eventName)
        return this
    }

    private async createWindow() {
        let win: BrowserWindow | null = null
        if (NotificationWindow.queue.length === NotificationWindow.queueLimitSize) {
            const first = NotificationWindow.queue.shift()
            if (first) {
                clearTimeout(first.closeTimeoutID)
                win = first.window
                win?.removeAllListeners('ready-to-show')
                // @ts-ignore
                win?.webContents?.removeAllListeners('did-finish-load')
                win?.removeAllListeners('close')
                win?.removeAllListeners('closed')
                win?.setAlwaysOnTop(true)
            }
        }
        if (win === null) {
            const options: BrowserWindowConstructorOptions = {
                width: NotificationWindow.width,
                height: NotificationWindow.height,
                skipTaskbar: true,
                minimizable: false,
                maximizable: false,
                fullscreenable: false,
                simpleFullscreen: false,
                resizable: false,
                alwaysOnTop: true,
                frame: false,
                show: false,
                x: NotificationWindow.getDisplay().width - NotificationWindow.width - NotificationWindow.marginRight,
                y: NotificationWindow.getDisplay().height - NotificationWindow.height - NotificationWindow.marginBottom,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    webSecurity: false
                }
            }
            win = new BrowserWindow(options)
        }
        win.loadURL(`${NotificationWindow.pageUrl}?${querystring.stringify({...this.options})}`)
        win.once('ready-to-show', () => {
            win?.showInactive()
        })
        win.webContents.once('did-finish-load', () => {
            if (!this.options.silent) {
                shell.beep()
            }
            this.emit('created')
        })
        win.once('close', () => {
            clearTimeout(this.closeTimeoutID)
            if (!win) return;
            const curThis = NotificationWindow.fromWindow(win)
            if (!curThis) return
            const index = NotificationWindow.queue.indexOf(curThis)
            NotificationWindow.queue.splice(index, 1)
        })
        win.once('closed', () => {
            this.window = null
        })
        this.window = win
    }
}