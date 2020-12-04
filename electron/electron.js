// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const isDEv = process.argv.includes("--dev");
const server = process.argv.includes("--server");
Menu.setApplicationMenu(null);
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    // minimizable:false,
    // maximizable:false,
    // frame: false,
    // titleBarStyle:"default",
    webPreferences: {
      nodeIntegration: true, // is default value after Electron v5
      contextIsolation: false, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      enableRemoteModule: true,
      devTools: true,
    },
    title: "Lab - 2",
  });

  // and load the index.html of the app.
  if (isDEv) {
    if(server){
      mainWindow.loadURL("http://localhost:4201");
    }else{
      mainWindow.loadURL("http://localhost:4200");
    }
    mainWindow.webContents.openDevTools();
  } else {
    if(server){
      mainWindow.loadFile(path.join(__dirname, "servergui/index.html"));
    }else{
      mainWindow.loadFile(path.join(__dirname, "www/index.html"));
    }
  }
}
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
