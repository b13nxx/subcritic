const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')

let mainWindow = []

function createMainWindow () {
  mainWindow = new BrowserWindow({ title: 'SubCritic', width: 800, height: 600, resizable: false, fullscreenable: false })

  mainWindow.setMenu(null)
  mainWindow.loadFile('./app.html')

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.on('OpenSaveDialog', (event, arg) => {
  event.sender.send('CloseSaveDialog', dialog.showSaveDialog({ title: arg.trim(), defaultPath: arg.trim(), filters: [{ name: 'SubCritic Report File', extensions: ['rpt'] }] }))
})

ipcMain.on('OpenLink', (event, arg) => {
  shell.openExternal(arg)
})

ipcMain.on('GetAppPath', (event, arg) => {
  event.returnValue = app.getAppPath()
})

app.on('ready', createMainWindow)

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
  if (mainWindow === null) {
    createMainWindow()
  }
})
