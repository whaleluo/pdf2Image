//build/hooks/afterPack.js
//参考 https://www.electron.build/configuration/configuration#afterpack
const fs = require("fs");
const path = require("path");
exports.default = async function(context) {
    const fs = require('fs')
    const path = require('path')
    const localeDir = path.join(context.appOutDir, 'locales')
    console.log(localeDir)
    fs.readdir(localeDir, function(err, files) {
        if (!(files && files.length)) return
        for (let i = 0, len = files.length; i < len; i++) {
            const match = files[i].match(/zh-CN\.pak/) //只保留中文
            if (match === null) {
                fs.unlinkSync(path.join(localeDir,files[i]))
            }
        }
    })
    const unpackHome = context.appOutDir
    fs.readdir(unpackHome, function(err, files) {
        if (!(files && files.length)) return
        for (let i = 0, len = files.length; i < len; i++) {
            const match = files[i].match(/(LICENSE.electron|LICENSES.chromium)/) //只保留中文
            if (match !== null) {
                fs.unlinkSync(path.join(unpackHome,files[i]))
            }
        }
    })
}