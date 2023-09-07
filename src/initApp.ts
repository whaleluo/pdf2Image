import {
    app,
    BrowserWindow,
    dialog,
    globalShortcut,
    Menu,
    MenuItemConstructorOptions,
    Tray,
    webContents
} from 'electron';
import {logoImage, memory} from "./util";
import path from "path";
import {WindowID} from "./enums";
import ZoomView from "./zoomView";
import Accelerator = Electron.Accelerator;

/**
 * other userAgent update methods has risk
 * that has iframe page and use history.pushState, will be effected
 * eg:session.defaultSession.setUserAgent, webContents.setUserAgent, webContents.session.setUserAgent
 *    and each WebContents can use webContents.setUserAgent to override the session-wide user agent.
 * @param appendParams
 */
export function initUserAgent(appendParams = 'appendParams') {
    app.userAgentFallback = app.userAgentFallback + ' ' + appendParams
}

export function initGlobalShortcut() {
    const CommandOrControl_F12: Accelerator = <Accelerator>"CommandOrControl+F12"
    const CommandOrControl_Eq: Accelerator = <Accelerator>"CommandOrControl+="
    const CommandOrControl_Sub: Accelerator = <Accelerator>"CommandOrControl+-"

    const Escape: Accelerator = <Accelerator>"Escape"

    app.on('browser-window-focus', () => {
        globalShortcut.register(CommandOrControl_F12, () => {
            console.log(CommandOrControl_F12)
            webContents.getFocusedWebContents()?.openDevTools({mode: "detach"})
        })
        globalShortcut.register(Escape, () => {
            const win = BrowserWindow.getFocusedWindow()
            if (win?.isDestroyed() === false) {
                if (win.isFullScreen()) {
                    win.setFullScreen(false)
                } else if (win.isMinimizable()) {
                    win.minimize()
                }
            }
        })
        globalShortcut.register(CommandOrControl_Eq, () => {
            const wc = webContents.getFocusedWebContents()
            ZoomView.getInstance().emit(wc, 'ADD')
        })
        globalShortcut.register(CommandOrControl_Sub, () => {
            const wc = webContents.getFocusedWebContents()
            ZoomView.getInstance().emit(wc, 'SUBTRACT')
        })


    })
    app.on("browser-window-blur", () => {
        globalShortcut.unregisterAll()
    })
}

/**
 * session.defaultSession is not recommended
 */
export function initSession() {
    app.on('session-created', (session) => {
        console.log('[session-created]', session.getUserAgent())
        // add preload to all webContents that includes webviewTag
        // and just before normal preload scripts run.
        // The same preload will not be added repeatedly
        session.setPreloads([path.resolve(__dirname, 'preload.js')])
    })
}

export function initWebContentsConfig() {
    app.on('browser-window-created', (event, window) => {
        console.log('[browser-window-created]')
        if (process.platform === 'darwin') {
            window.on('focus', () => {
                //修复mac上含有browserView上，需要点击两次才能聚焦到鼠标所在browserView.webContents
                window.getBrowserViews().find(v => v.webContents.getURL().startsWith('http'))?.webContents.focus()
            })
            window.on('leave-full-screen', () => {
                // 修复mac上交通位置自定义，离开全屏时交通灯错位问题
                window.setTrafficLightPosition(window.getTrafficLightPosition())
            })
        }
    })
    app.on('web-contents-created', (event, webContents) => {
        const types = ['window', 'browserView', 'webview']
        const type = webContents.getType()
        if (!types.includes(type)) return
        console.log('[web-contents-created]', type, webContents.getURL(), webContents.id, webContents.getTitle())
        webContents.setWindowOpenHandler(details => {
            console.log('setWindowOpenHandler', details)
            return {
                action: 'allow',
                outlivesOpener: false,
                overrideBrowserWindowOptions: {
                    frame: true,
                    icon: logoImage,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        webviewTag: true,
                    }
                }
            }
        })
        webContents.on('zoom-changed', (event, zoomDirection) => {
            console.log(zoomDirection)
            ZoomView.getInstance().emit(webContents, zoomDirection === 'out' ? 'SUBTRACT' : 'ADD')
        })
        webContents.on('dom-ready', () => {
            webContents.executeJavaScript(`console.log("dom-ready from webContents")`, true)
        })
        webContents.on('will-navigate', () => {
            console.log('[will-navigate]', webContents.getURL())
        })
        webContents.on('did-navigate', (event) => {
            console.log('[did-navigete]', webContents.getURL())
        })
        webContents.on('will-redirect', () => {
            console.log('[will-redirect]', webContents.getURL())
        })
        webContents.on('did-start-navigation', (event, url, isInPlace, isMainFrame) => {
            console.log('[did-start-navigation]', url, isInPlace, isMainFrame)
        })
        webContents.once('did-navigate-in-page', (event, url, isMainFrame) => {
            console.log('[did-navigate-in-page]', url)
            webContents.mainFrame.frames.forEach(f => {
                console.log(f.url)
            })
        })
        webContents.on('did-frame-navigate', (event, url) => {
            console.log('[did-frame-navigate]', url)
        })
        webContents.on('did-start-loading', () => {
            console.log('[did-start-loading]', webContents.getURL())
        })
        webContents.on("did-finish-load", () => {
            console.log('[did-finish-load]', webContents.getURL())
        })
        webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            console.log('[did-fail-load]', errorCode, errorDescription, validatedURL)
        })
        /**
         * Note that on macOS, having focus means the WebContents is the first responder of window,
         * so switching focus between windows would not trigger the focus and blur events of WebContents,
         * as the first responder of each window is not changed.
         * The focus and blur events of WebContents should only be used to detect focus change between different WebContents and BrowserView in the same window.
         */
        webContents.on('focus', () => {
            console.log('[focus]', webContents.getURL())
        })
    })
}

export function initMenu() {
    let template: MenuItemConstructorOptions[] | null = null
    if (process.platform === 'darwin') {
        template = [
            {
                label: "Application",
                submenu: [
                    {label: 'Quit', accelerator: <Accelerator>'Command+Q', role: 'quit'}
                ]
            }, {
                label: 'Edit', // fix can not Copy and Paste and Undo on Mac
                submenu: [
                    {
                        label: 'Copy', accelerator: <Accelerator>'CmdOrCtrl+C', role: 'copy'
                    },
                    {
                        label: 'Paste', accelerator: <Accelerator>('CmdOrCtrl+V'), role: 'paste'
                    }, {
                        label: 'Copy', accelerator: <Accelerator>'CmdOrCtrl+C', role: 'copy'
                    },
                    {
                        label: 'Undo', accelerator: <Accelerator>('CmdOrCtrl+Z'), role: 'undo'
                    }
                ]
            }
        ]
    }
    Menu.setApplicationMenu(template && Menu.buildFromTemplate(template))
}

export function initTray() {
    let tray: Tray | null = null
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
    tray = new Tray(icon.resize({width: 16, height: 16}))
    tray.setToolTip(app.name)
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
        BrowserWindow.fromId(memory.get(WindowID.Main))?.show()
    })
    return tray
}

export function initErrorHadle(handleBack: (errMsg: string) => any = (errMsg) => {
    dialog.showErrorBox('', errMsg)
}) {
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        event.preventDefault()
        console.log('certificate-error', url, error)
        callback(true)
    })
    app.on('render-process-gone', (event, webContents, details) => {
        console.log('render-process-gone', webContents.getURL(), details.reason)
        handleBack.call(null, details.reason)
    })
    app.on('child-process-gone', (event, details) => {
        console.log('child-process-gone', details.reason)
        handleBack.call(null, details.reason)
    })
    // 同步异常
    process.on('uncaughtException', (error, origin) => {
        console.log('uncaughtException', error.message)
        handleBack.call(null, error.message)
    })
    // 异步异常
    process.on('unhandledRejection', (reason) => {
        console.log('unhandledRejection', reason)
        handleBack.call(null, reason + '')
    })
}