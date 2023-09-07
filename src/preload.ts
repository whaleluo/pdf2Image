import {contextBridge, ipcRenderer} from 'electron'

console.log(window.navigator.userAgent)
console.log(eval('1+1'))
window.addEventListener('focus', () => {
    // @ts-ignore
    console.log('focus', global.test)
})
window.addEventListener("online", (event) => {
    console.log("You are now connected to the network.");
});
window.ononline = (event) => {
    console.log("You are now connected to the network.");
};
window.addEventListener("open", (event) => {
    console.log("open", event);
});
contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel: string, data: any) => {
        ipcRenderer.send(channel, data)
    },
    sendSync: (channel: string, ...data: any) => {
        if (channel?.includes('-sync') && ipcRenderer.sendSync('main-listener-count-sync', channel) > 0) {
            return ipcRenderer.sendSync(channel, ...data)
        } else {
            console.warn(`warning: ${channel} may block main process, cancel run!`)
        }
    },
    /***
     * @param webContentsId send to a page not to main process
     * @param channel
     * @param args
     */
    sendTo(webContentsId: number, channel: string, ...args: any[]) {
        return ipcRenderer.sendTo(webContentsId, channel, ...args)
    },
    invoke: (channel: string, data: any) => {
        return ipcRenderer.invoke(channel, data)
    },
    on: (channel: string, func: any) => {
        ipcRenderer.on(channel, func)
    },
    removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel)
    },
    eventNames: () => {
        return ipcRenderer.eventNames()
    },
    listenerCount: (eventName: string) => {
        return ipcRenderer.listenerCount(eventName)
    }
})