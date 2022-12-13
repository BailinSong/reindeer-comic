'use strict'

import {app, BrowserWindow, ipcMain, Menu, protocol} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS_DEVTOOLS} from 'electron-devtools-installer'
import fs from 'fs'
import path from 'path'
import os from 'os'
import StreamZip from 'node-stream-zip'
import NeDB from 'nedb'
import { orderBy } from 'natural-orderby';



const isDevelopment = process.env.NODE_ENV !== 'production'

//const dbFilePath = ((isDevelopment) ? './library.db' : ((process.platform === 'darwin') ? '~/Library/Containers/ooo.reindeer.comic/Data/library.db' : './library.db'))
// const cachePath = ((process.platform === 'darwin') ? os.homedir() + '/Library/Containers/ooo.reindeer.comic/Data/cache' : './cache')
const dbFilePath = ((process.platform === 'darwin') ? os.homedir() + '/Library/Containers/ooo.reindeer.comic/Data/library.db' : './library.db')
const ndbFilePath = ((process.platform === 'darwin') ? (os.homedir() + '/Library/Containers/ooo.reindeer.comic/Data/library.ndb'):( os.homedir() +'/AppData/Local/reindeer-comic/Data/library.ndb'))

const bookDB = new NeDB({
    filename: ndbFilePath,
    autoload: true,
})

// eslint-disable-next-line no-unused-vars
bookDB.ensureIndex({fieldName: 'path', unique: true}, function (err) {
});
bookDB.ensureIndex({fieldName: 'title'}, function () {
});


// mkdirsSync(cachePath)
mkdirsSync(path.dirname(ndbFilePath))

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {secure: true, standard: true}},
])


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

    Menu.setApplicationMenu(null)

    const win = new BrowserWindow({
        useContentSize: true,
        // frame: false,
        width: 800,
        height: 600,
        minWidth: 357,
        minHeight: 400,
        background: '#3a3a3a',
        backgroundColor:'#3a3a3a',

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

            console.log(request.url)
            const pCallback = callback
            const url = decodeURI(request.url.substr(6));
            const idx = url.toLowerCase().lastIndexOf('.zip/');
            let eName;
            let zUrl;

            if (url.toLowerCase().startsWith('./') ||
                url.toLowerCase().startsWith('../')
            ) {
                zUrl = url.substr(0, idx + 4)
                eName = url.substr(idx + 5)
            } else if (url.toLowerCase().startsWith('//')) {
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


            var cacheFace = eName.split('?cache=')
            console.log(cacheFace)


            const zip = new StreamZip({file: zUrl});

            zip.on('error', e => {
                console.error(e)
            });

            zip.on('ready', () => {

                const data = zip.entryDataSync(cacheFace[0]);
                pCallback({
                    data: data
                })
                zip.close()
            });

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

ipcMain.on('readBooks', (event) => {


    if (fs.existsSync(dbFilePath)){

        console.info('has old db file')

        const data = fs.readFileSync(dbFilePath, 'utf-8');
        console.info(data)
        let books=JSON.parse(data).books;
        books.forEach((book)=>{
            bookDB.insert(book)
        })
        fs.unlinkSync(dbFilePath)
    }


    bookDB.find({}, (err, docs) => {
        if (!err) {
            event.reply('readBooks-reply', docs)
        } else {
            console.error(err)
        }
    })
})

ipcMain.on('deleteBook', (event,book) => {
    bookDB.remove({_id:book._id}, (err, doc) => {
        if (!err) {
            console.info('delete book ',doc)
            event.reply('deleteBook-reply')
        } else {
            console.error(err)
        }
    })
})


ipcMain.on('updateBook', (event, arg) => {
    bookDB.update({_id:arg._id},arg,(err,doc)=>{
        if(!err){
            console.info(doc)
            event.reply('updateBook-reply', true)
        }
        else{
            console.error(err)
            event.reply('updateBook-reply', false)
        }
    })
})

ipcMain.on('addBooks', (event, arg) => {


    arg.forEach(element => {
        let book = {}

        book.path = element.replace(/\\/g, '/')

        bookDB.findOne({path: book.path}, (err, doc) => {

            if (!err) {
                if (doc === null) {
                    console.log('add book: ' + book.path)
                    book.addDate = Date.now()
                    fs.lstat(book.path, (err, info) => {

                        let bookInfo = info

                        if (bookInfo.isDirectory()) {

                            book.title = path.basename(book.path)

                            let dirImages = getImageListByDir(book.path);

                            if (dirImages.length < 1) return
                            book.src = dirImages[0]
                            // event.sender.send('addBooks-reply', book)

                            bookDB.insert(book, (err, newBook) => {
                                if (!err) {
                                    event.sender.send('addBooks-reply', newBook)
                                }
                            })

                        } else if (book.path.toLowerCase().endsWith('.zip')) {

                            book.title = path.basename(book.path, '.zip')

                            getImageListByZip(book.path, (zipImages) => {
                                if (zipImages.length < 1) return
                                book.src = zipImages[0]
                                // event.sender.send('addBooks-reply', book)
                                bookDB.insert(book, (err, newBook) => {
                                    if (!err) {
                                        event.sender.send('addBooks-reply', newBook)
                                    }
                                })
                            });
                        }
                    })
                }
                else{
                    console.warn('duplicate book',book.path)
                }
            } else {
                console.error(err)
            }
        })
    });

})


function getImageListByZip(arg, callback) {
    const bookPath = arg.replace(/\\/g, '/')
    const pCallback = callback
    console.log('ImageListByZip:' + bookPath)
    let protocol = ''
    let imageList = []

    const zip = new StreamZip({file: bookPath});

    zip.on('ready', () => {
        // console.log('Entries read: ' + zip.entriesCount);
        for (const entry of Object.values(zip.entries())) {
            if (isImage(entry.name)) {

                if (entry.isDirectory === false) {
                    protocol = "zip://"
                    if (!arg.startsWith('/')) {
                        protocol = protocol + '/'
                    }
                    imageList.push(protocol + bookPath + '/' + entry.name)
                }
            }
        }
        // Do not forget to close the file once you're done
        zip.close();
        pCallback(orderImage(imageList))

    });


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
    // console.info(imageList)
    return imageList
}

ipcMain.on('readfs', (event, arg) => {

    const pEvent = event;
    let fullPathFiles;

    if (arg.toLowerCase().endsWith('.zip')) {
        // var Zip = require('adm-zip');


        getImageListByZip(arg, (fullPasths) => {
            pEvent.reply('readfs-reply', fullPasths)
        });

    } else {

        fullPathFiles = getImageListByDir(arg);
        pEvent.reply('readfs-reply', fullPathFiles)
    }


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


    return orderBy(imagePathList);
}



/*function nature(a, b) {
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
            tempB = ' ' + tempB
        }
    } else if (tempB.length > tempA.length) {

        for (let i = 0; i < tempB.length - tempA.length; i++) {
            tempA = ' ' + tempA
        }
    }

    if (tempA > tempB) {
        console.info(a+":"+tempA +" > "+ b+":"+tempB)
        return 1
    } else if (tempA < tempB) {
        console.info(a+":"+tempA +" < "+ b+":"+tempB)
        return -1
    } else {
        console.info(a+":"+tempA +" = "+ b+":"+tempB)
        if(a.length>tempB.length){
            return 1;
        }else if(a.length<tempB.length){
            return -1
        }
        return 0
    }

}*/

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
