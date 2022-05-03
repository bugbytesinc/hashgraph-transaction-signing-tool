const { app, BrowserWindow } = require("electron");
const path = require("path");

app.on("ready", () => {
    createWindow();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function createWindow() {
    const main = new BrowserWindow({
        icon: 'public/sign-logo.png',
        show: false,
        minWidth: 300,
        minHeight: 320,
        webPreferences: {
            nodeIntegration: false,
            sandbox: true,
            enableRemoteModule: false
        }
    });
    main.removeMenu();
    main.loadFile(path.join(__dirname, "public/index.html"));
    main.once('ready-to-show', () => {
        main.show();
        main.focus();
    });
}

