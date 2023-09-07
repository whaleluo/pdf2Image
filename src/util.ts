import {app, dialog, MessageBoxOptions, nativeImage} from "electron";
import {autoUpdater} from "electron-updater";
import path from "path";
import {dataKey} from "./enums";

export function handleUrlFromWeb(action: 'firstInstance' | 'secondInstance', argv: string[]) {
    // scheme is xx:[///]*
    const targetUrl = argv.find(item => item.startsWith('pdftoimg:?'))
    if (!targetUrl) return;
    let url = null
    try {
        url = new URL(targetUrl)
    } catch (e) {
        console.log('handleUrlFromWeb', e)
        return;
    }
    const {searchParams} = url
    memory.set(dataKey.StarUrlParams, searchParams)
    console.log('handleUrlFromWeb', searchParams)

}

// 处理不规则URL
export function handleCustomUrlFromWeb(action: 'firstInstance' | 'secondInstance', argv: string[]) {
    const reg = /(?<=pdftoimg:[\/]*\?)\S*/g
    let params
    for (let i = 0; i < argv.length; i++) {
        const match = argv[i].match(reg)?.[0]
        if (match) {
            params = match
            break
        }
    }
    if (!params) return;
    memory.set(dataKey.StarUrlParams, params)
    console.log('handleUrlFromWeb', params)

}

export async function checkingUpdae() {
    if (!app.isPackaged) {
        autoUpdater.forceDevUpdateConfig = true
    }
    autoUpdater.autoDownload = false;
    autoUpdater.on('error', (error) => {
        if (error.message.startsWith('net')) {
            // net::ERR_PROXY_CONNECTION_FAILED
            console.log('update net error')
            return
        }
        dialogShow({
            title: '软件升级错误',
            message: error.message
        })
    });
    // 检测是否需要更新
    autoUpdater.on('checking-for-update', () => {
        console.log('checking-for-update')
    });
    autoUpdater.on('update-available', () => {
        // 检测到可以更新时
        // 这里我们可以做一个提示，让用户自己选择是否进行更新
        dialogShow({
            type: 'info',
            title: '应用有新的更新',
            message: '发现新版本，是否现在更新？',
            buttons: ['是', '否']
        }).then(({response}) => {
            console.log(response)
            if (response === 0) {
                // 下载更新
                autoUpdater.downloadUpdate();
            }
        });
        // 也可以默认直接更新，二选一即可
        // autoUpdater.downloadUpdate();
    });
    // 检测到不需要更新时
    autoUpdater.on('update-not-available', () => {
        // todo 这里可以做静默处理，不给渲染进程发通知，或者通知渲染进程当前已是最新版本，不需要更新
    });
    // 更新下载进度
    autoUpdater.on('download-progress', (progress) => {
        // todo 直接把当前的下载进度发送给渲染进程即可，有渲染层自己选择如何做展示
        // {
        //     total: 60931461,
        //         delta: 1318146,
        //     transferred: 60931461,
        //     percent: 100,
        //     bytesPerSecond: 736341
        // }
    });
    // 当需要更新的内容下载完成后
    autoUpdater.on('update-downloaded', () => {
        // 给用户一个提示，然后重启应用；或者直接重启也可以，只是这样会显得很突兀
        dialogShow({
            title: '安装更新',
            message: '更新下载完毕，应用将重启并进行安装',
            buttons: ['是', '否']
        }).then(({response}) => {
            if (response === 0) {
                // 退出并安装应用
                setImmediate(() => autoUpdater.quitAndInstall());
            }
        });
    });
    // 我们需要主动触发一次更新检查
    await autoUpdater.checkForUpdates();
}

export const logoName = process.platform === 'win32' ? 'favicon.ico' : 'favicon_256x256.png'
export const logoImage = nativeImage.createFromPath(path.join(__dirname, `../resources/img/${logoName}`))

export function dialogShow(msgOpt: MessageBoxOptions) {
    return dialog.showMessageBox(Object.assign(msgOpt, {icon: logoImage}))
}

export const memory = (function () {
    const memoryData = new Map()
    return {
        get: (key: string) => {
            return memoryData.get(key)
        },
        set: (key: string, value: any) => {
            memoryData.set(key, value)
        },
        delete: (key: string) => {
            memoryData.delete(key)
        }
    }
})()