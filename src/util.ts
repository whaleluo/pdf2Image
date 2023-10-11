import {app, dialog, MessageBoxOptions, nativeImage} from "electron";
import path from "path";
import {dataKey} from "./enums";
import * as http from "http";
import * as https from "https";
import * as url from "url";
import * as fs from "fs";

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

export const logoName = process.platform === 'win32' ? 'favicon.ico' : 'favicon_256x256.png'
export const logoImage = nativeImage.createFromPath(path.join(__dirname, `../resources/img/${logoName}`))

export function dialogShow(msgOpt: MessageBoxOptions) {
    return dialog.showMessageBox(Object.assign(msgOpt, {icon: logoImage}))
}

/**
 * Mime 嗅探
 * Determine whether the URL is a download resource
 * @param urlString
 */
export function isDownloadLink(urlString: string) {
    return new Promise(resolve => {
        if (typeof urlString !== "string" || !urlString.startsWith('http')) return resolve('Invalid URL')
        const request = urlString.startsWith('https') ? https : http
        const parsedUrl = url.parse(urlString)
        request.request({
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.path,
            method: 'HEAD',
            timeout: 2000
        }, (res) => {
            const headers = res.headers
            const contentType = headers['content-type']
            const contentDisposition = headers['content-disposition']
            // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types
            // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Disposition
            console.log(urlString, contentType, contentDisposition)
            if (contentType === "application/octet-stream" || contentDisposition?.includes('attachment')) {
                return resolve(true)
            } else {
                return resolve(false)
            }
        }).end()

    })

}

export const download = ({urlString = "", fileName = ""}) => {
    return new Promise(resolve => {
        if (typeof urlString !== "string" || !urlString.startsWith('http')) return resolve('Invalid URL')
        const request = urlString.startsWith('https') ? https : http
        const resDir = path.join(app.getPath('userData'), 'user_resources')
        if (!fs.existsSync(resDir)) {
            fs.mkdirSync(resDir, {recursive: true})
        }

        const filePath = path.join(resDir, fileName ? fileName : path.basename(urlString))
        const fileStream = fs.createWriteStream(filePath)
        fileStream.on('finish', () => {
            fileStream.close()
            return resolve({path: filePath})
        })
        request.get(urlString, (res) => {
            res.pipe(fileStream)
        }).on('error', (err) => {
            return resolve({err})
        }).end()

    })
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
