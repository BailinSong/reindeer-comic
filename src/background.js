'use strict'

import {app, BrowserWindow, ipcMain, protocol,nativeTheme} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS_DEVTOOLS} from 'electron-devtools-installer'
import Zip from 'adm-zip'
import fs from 'fs'
import path from 'path'

const isDevelopment = process.env.NODE_ENV !== 'production'

const dbFilePath = ((isDevelopment) ? './library.db' : ((process.platform === 'darwin') ? '～/Library/Containers/ooo.reindeer.comic/Data/library.db' : './library.db'))


// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {secure: true, standard: true}},
])

let db ={
    confic:{},
    books:[]
}

async function createWindow() {

    // //判断是否为OSX
    // if(process.platform=="darwin"){
    //     console.log('is Mac :'+nativeTheme.shouldUseDarkColors);
    //     this.$vuetify.theme.dark = true
    //     //当桌面主题更新时
    //     nativeTheme.on('updated',()=>{
    //         console.log('i am changed')
    //         if(nativeTheme.shouldUseDarkColors){
    //             console.log("i am dark.")
    //             this.$vuetify.theme.dark = true
    //
    //         }else{
    //             console.log("i am light.")
    //             this.$vuetify.theme.dark = false
    //
    //         }
    //     })
    // }else{
    //     console.log('not Mac');
    // }



    // Create the browser window.
    const win = new BrowserWindow({
        useContentSize: true,
        // frame: false,
        width: 800,
        height: 600,
        minWidth: 357,
        minHeight: 400,
        background:'#3a3a3a',

        webPreferences: {

            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
            webSecurity: false,
            nativeWindowOpen: true
        }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')

        // Load the index.html when not in development
        win.loadURL('app://./index.html')
    }

}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {

        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.whenReady().then(() => {
    protocol.registerBufferProtocol('zip', (request, callback) => {

            const url = decodeURI(request.url.substr(6));
            const idx = url.toLowerCase().indexOf('.zip/');
            let eName;
            let zUrl;

            if (url.toLowerCase().startsWith('./') ||
                url.toLowerCase().startsWith('../')
            ) {
                zUrl = url.substr(0, idx + 4)
                eName = url.substr(idx + 5)
            } else if (url.toLowerCase().startsWith('/')) {
                if (process.platform === 'win32') {
                    zUrl = url.substr(1, idx + 4)
                } else {
                    zUrl = url.substr(0, idx + 4)
                }

                eName = url.substr(idx + 5)
            } else {
                zUrl = url.substr(1, idx + 4)
                eName = url.substr(idx + 5)
            }

            // var Zip = require('adm-zip');
            const zip = new Zip(zUrl);

            callback({
                data: zip.readFile(eName)
            })
        }, function (error) {
            if (error)
                console.error('Failed to register protocol')
        }
    )
})
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }

    createWindow()
})

ipcMain.on('readdb', (event) => {
    try {

        const dbFile = path.join(dbFilePath);

        if (!fs.existsSync(dbFile)) {
            fs.writeFileSync(dbFile, '{}', {'flag': 'a'})
        }

        const data = fs.readFileSync(dbFile, 'utf-8');


        db = JSON.parse(data);


        db.books.sort((A, B) => {
            return nature(A.title, B.title)
        })

        event.reply('readdb-reply', db.books)
    } catch (err) {
        console.log(err)
    }
})

ipcMain.on('writedb', (event, arg) => {

    try {

        db.books=arg;

        const dbFile = path.join(dbFilePath)

        fs.writeFileSync(dbFile, JSON.stringify(db))

        event.reply('writedb-reply', true)
    } catch (err) {
        console.log(err)
        event.reply('writedb-reply', false)

    }
})

ipcMain.on('addBooks', (event, arg) => {

    let books = [];

    for (let index in arg) {
        let book = {}
        let protocol = "file://";
        if (!arg[index].startsWith('/')) {
            protocol = protocol + '/'
        }
        book.path = arg[index]
        let bookInfo = fs.lstatSync(book.path)


        if (bookInfo.isDirectory()) {

            book.title = path.basename(book.path)
            let dirImages = getImageListByDir(book.path);

            if (dirImages.length < 1) return
            book.src = dirImages[0]


        } else if (book.path.toLowerCase().endsWith('.zip')) {

            book.title = path.basename(book.path, '.zip')

            let zipImage = getImageListByZip(arg[index]);

            if (zipImage.length < 1) return
            book.src = zipImage[0]


        }
        books.push(book);


    }
    event.reply('addBooks-reply', books)
    // {
    //   key:"1234-09878",
    //   path":"Z:/漫画/[ポンスケ] ちびっこエッチ [中国翻译].zip",
    //   src":"zip:///Z:/漫画/[ポンスケ] ちびっこエッチ [中国翻译].zip/001.png",
    //   title":"[ポンスケ] ちびっこエッチ [中国翻译]"
    // }

})

function getImageListByZip(arg) {
    console.log('ImageListByZip:' + arg)
    let protocol = ''
    let imageList = []
    let zip = new Zip(arg);

    let zipEntries = zip.getEntries();

    for (let index in zipEntries) {
        const zipEntry = zipEntries[index];
        if (isImage(zipEntry.entryName.toString())) {

            if (zipEntry.isDirectory === false) {
                protocol = "zip://"
                if (!arg.startsWith('/')) {
                    protocol = protocol + '/'
                }
                imageList.push(protocol + arg + '/' + zipEntry.entryName.toString())
            }
        }

    }
    imageList = orderImage(imageList)
    return imageList;
}

function getImageListByDir(arg) {
    console.log('ImageListByDir :' + arg)
    let protocol
    let imageList = []
    let pwd = path.join(arg)
    const files = fs.readdirSync(pwd);


    for (let file in files) {

        const filePath = files[file].toLowerCase();
        if (
            isImage(filePath)
        ) {
            protocol = "file://"
            if (!arg.startsWith('/')) {
                protocol = protocol + '/'
            }
            imageList.push(protocol + arg + '/' + files[file]);
        }
    }
    imageList = orderImage(imageList)

    return imageList
}

ipcMain.on('readfs', (event, arg) => {

    let fullPathFiles;

    if (arg.toLowerCase().endsWith('.zip')) {
        // var Zip = require('adm-zip');


        fullPathFiles = getImageListByZip(arg);

    } else {


        fullPathFiles = getImageListByDir(arg);


    }

    event.reply('readfs-reply', fullPathFiles)

})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {

                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {

            app.quit()

        })
    }
}

function isImage(filePath) {
    return (!(filePath.startsWith('_') || filePath.startsWith('.'))) && (filePath.endsWith('.png') ||
        filePath.endsWith('.jpg') ||
        filePath.endsWith('.gif') ||
        filePath.endsWith('.webp') ||
        filePath.endsWith('.apng') ||
        filePath.endsWith('.avif') ||
        filePath.endsWith('.jpeg'))
}

function orderImage(imagePathList) {
    imagePathList.sort(nature)
    return imagePathList
}

function nature(a, b) {
    let startIndex = -1;

    let tempA = a;
    let tempB = b;
    if (tempA.length >= tempB.length) {
        for (let i = 0; i < tempA.length; i++) {
            if (tempA[i] !== tempB[i]) {
                startIndex = i
                break;
            }
        }
    } else {
        for (let i = 0; i < tempB.length; i++) {
            if (tempB[i] !== tempA[i]) {
                startIndex = i
                break;
            }
        }
    }
    tempA = tempA.substr(startIndex, tempA.length - startIndex)
    tempB = tempB.substr(startIndex, tempB.length - startIndex)


    if (tempA.length > tempB.length) {
        for (let i = 0; i < tempA.length - tempB.length; i++) {
            tempB = '0' + tempB
        }
    } else if (tempB.length > tempA.length) {
        for (let i = 0; i < tempB.length - tempA.length; i++) {
            tempA = '0' + tempA
        }
    }

    if (tempA > tempB) {
        return 1
    } else if (tempA < tempB) {
        return -1
    } else {
        return 0
    }

}