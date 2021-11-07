'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
     useContentSize: true,
    // frame: false,
    width: 800,
    height: 600,
    minWidth: 357,
    minHeight: 812,
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

  // console.log(protocol.registerBufferProtocol('zip', function (request, callback) {
  //   console.log(request.url)
  //   var url = request.url.substr(7);
  //   var idx = url.toLowerCase.indexOf('.zip/')
  //   var eName = ''
  //   var zUrl = ''
  //   if (idx > 0) {
  //     zUrl = url.substr(0, idx + 4)
  //     eName = url.substr(idx + 4)
  //   }


  //   var Zip = require('adm-zip');
  //   var zip = new Zip(zUrl);

  //   callback({

  //     data: zip.readFile(eName)
  //   })
  // }, function (error) {
  //   if (error)
  //     console.error('Failed to register protocol')
  // }))

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
    var url = decodeURI(request.url.substr(6));
    var idx = url.toLowerCase().indexOf('.zip/')
    var eName = ''
    var zUrl = ''

    if (url.toLowerCase().startsWith('./') ||
      url.toLowerCase().startsWith('../')
    ) {
      zUrl = url.substr(0, idx + 4)
      eName = url.substr(idx + 5)
    } else if (url.toLowerCase().startsWith('/')) {
      zUrl = url.substr(1, idx + 4)
      eName = url.substr(idx + 5)
    } else {
      zUrl = url.substr(1, idx + 4)
      eName = url.substr(idx + 5)
    }

    console.log(zUrl)
    console.log(eName)

    var Zip = require('adm-zip');
    var zip = new Zip(zUrl);

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
    var fs = require('fs')
    const path = require('path')
    let dbFile = path.join('./library.db')

    var data = fs.readFileSync(dbFile, 'utf-8')
    let books = JSON.parse(data);


    event.reply('readdb-reply', books)
  } catch (err) {
    console.log(err)
  }
})

ipcMain.on('writedb', (event, arg) => {

  try {
    var fs = require('fs')
    const path = require('path')
    let dbFile = path.join('./library.db')
    var booksInfo = JSON.stringify(arg)
    fs.writeFileSync(dbFile, booksInfo)

    event.reply('writedb-reply', true)
  } catch (err) {
    console.log(err)
    event.reply('writedb-reply', false)

  }
})

ipcMain.on('addBooks', (event, arg) => {
   var fs = require('fs')
  const path = require('path')
  var books=[]

  for(var index in arg){
    let book={}
    book.path=arg[index]
    let bookInfo = fs.lstatSync(path.join(book.path))
    
    console.log(bookInfo)
    if(bookInfo.isDirectory()){

      book.title=path.basename(book.path)
      book.src=fs.readdirSync(book.path)[0]
      console.log('dir:'+book)

    }else if(book.path.toLowerCase().endsWith('.zip')){
      
      book.title=path.basename(book.path,'.zip')

      var Zip = require('adm-zip');
      console.log(arg)
      var zip = new Zip(arg);
      var zipEntries = zip.getEntries();
      for (var zipEindex in zipEntries) {
        var zipEntry = zipEntries[zipEindex]
        console.log(zipEntry)
        if (zipEntry.isDirectory == false) {
          book.src='zip:///' + arg + '/' + zipEntry.entryName.toString()
        }
  
      }
     
      console.log('zip:'+book)
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

ipcMain.on('readfs', (event, arg) => {


  var fullPathFiles = []

  if (arg.toLowerCase().endsWith('.zip')) {
    var Zip = require('adm-zip');
    console.log(arg)
    var zip = new Zip(arg);
    var zipEntries = zip.getEntries();




    for (var index in zipEntries) {
      var zipEntry = zipEntries[index]
      console.log(zipEntry)
      if (zipEntry.isDirectory == false) {
        fullPathFiles.push('zip:///' + arg + '/' + zipEntry.entryName.toString())
      }

    }
  }

  else {

    var fs = require('fs')
    const path = require('path')
    let pwd = path.join(arg)
    var files = fs.readdirSync(pwd)



    for (var file in files) {
      fullPathFiles.push(arg + '/' + files[file]);
    }


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


