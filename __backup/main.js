const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const windows = new Set();
const DARK_MODE = exports.DARK_MODE = true;

const createWindow = exports.createWindow = () => {
    const browserOptions = { show: false, width: 1290, height: 768, autoHideMenuBar: true, minWidth: 800, minHeight: 600 }
    let newWindow = new BrowserWindow(browserOptions);

    if(DARK_MODE){
        newWindow.loadFile(`${__dirname}/index_classic.html`);
    }else{
        newWindow.loadFile(`${__dirname}/index_classic_font.html`);
    }

    newWindow.once('ready-to-show', () => {
        newWindow.show();
        newWindow.openDevTools();
    })

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        newWindow = null;
    })

    windows.add(newWindow);
    return newWindow;
}

app.setName("WebSurf");
app.on('ready', () => {
    createWindow();
})


const quitApp = exports.quitApp = () => {
    const options = {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 1,
        title: 'Exit WebSurf?',
        detail: 'Are you sure you want to close all windows and exit application?'
    }
    const response = dialog.showMessageBox(null, options, (response) => {
        if (response == 0) {
            app.quit();
        }
    })
}

const closeWindow = exports.closeWindow = (targetWindow) => {
    const options = {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 1,
        title: 'Exit WebSurf?',
        detail: 'Are you sure you want to close all tabs and exit ?'
    }
    const response = dialog.showMessageBox(targetWindow, options, (response) => {
        if (response == 0) {
            targetWindow.close();
        }
    })
}
const openDevTools = exports.openDevTools = (targetWindow) => {
    targetWindow.openDevTools();
}

const getFileFromUser = exports.getFileFromUser = (targetWindow) => {
    const files = dialog.showOpenDialog(targetWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'HTML Files', extensions: ['html', 'htm'] }
        ]
    });

    if (files) { openFile(targetWindow, files[0]); }
}

const openFile = (targetWindow, file) => {
    const content = fs.readFileSync(file).toString();
    targetWindow.webContents.send('file-opened', file, content)
}

const writeHistories = exports.writeHistories = (historyContent) => {
    fs.writeFileSync('history.json', historyContent, (err) => {
        console.log("History successfully created")
    })
}

const readHistories = exports.readHistories = (targetWindow) => {
    const content = fs.readFileSync('history.json').toString();
    targetWindow.webContents.send('history-loaded', content);
}

const writeBookmarks = exports.writeBookmarks = (bookmarksContent) => {
    fs.writeFileSync("bookmarks.json", bookmarksContent, err => {
        console.log("Bookmarks written successfully")
    })
}

const clearData = exports.clearData = () => {
    fs.writeFileSync("bookmarks.json","");
    fs.writeFileSync("history.json","");
}

const readBookmarks = exports.readBookmarks = (targetWindow) => {
    const content = fs.readFileSync('bookmarks.json').toString();
    targetWindow.webContents.send('bookmarks-loaded', content);
}
/*const saveFile = exports.saveFile = (content) => {
    const file = dialog.showSaveDialog(mainWindow, {
        title: 'Save Page',
        defaultPath: app.getPath('documents'),
        filters: [
            { name: 'HTML fIles', extensions: ['html', 'htm'] }
        ]
    });

    if (!file) return;

    fs.writeFileSync(file, content);
}*/