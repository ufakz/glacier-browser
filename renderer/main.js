const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const windows = new Set();
let splashWindow;
let thisWindow;


const createDirectories = () => {
    if(!fs.existsSync('store')){
        fs.mkdirSync('store');
    }
    
    if(!fs.existsSync('store/history.json') && 
        !fs.existsSync('store/bookmarks.json') && 
        !fs.existsSync('store/prefs.json')){
        fs.writeFileSync('store/history.json','[]');
        fs.writeFileSync('store/bookmarks.json','[]');
        fs.writeFileSync('store/prefs.json',`{"theme":"light","home_page":"abu.edu.ng","search_engine":"google"}`);
    
    }
}
createDirectories()
const readPrefs = exports.readPrefs = () => {
    const content = fs.readFileSync('store/prefs.json').toString();
    return content;
}

const PREFS = exports.PREFS = JSON.parse(readPrefs());
const THEME = PREFS.theme;

const createSplashWindow = () => {
    const splashWinOptions = { width: 320, height: 240, frame: false, resizable: false, backgroundColor: '#FFF', alwaysOnTop: true, show: false }
    splashWindow = new BrowserWindow(splashWinOptions);

    splashWindow.loadFile(`${__dirname}/splash/splash.html`);

    splashWindow.on('closed', () => {
        splashWindow = null;
    })

    splashWindow.once('ready-to-show', () => {
        splashWindow.show()
        thisWindow = createFirstWindow()
    })

}

ipcMain.on('app-init', event => {
    if(splashWindow){
        splashWindow.close()      
    }
    thisWindow.show()
})

const createFirstWindow = () => {
    const browserOptions = { show: false, width: 1290, height: 768, autoHideMenuBar: true, minWidth: 800, minHeight: 600 }
    let newWindow = new BrowserWindow(browserOptions);

    if(THEME == "dark"){
        newWindow.loadFile(`${__dirname}/index_dark.html`);
    }else{
        newWindow.loadFile(`${__dirname}/index.html`);
    }

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        newWindow = null;
    })

    windows.add(newWindow);
    return newWindow;
}

const createWindow = exports.createWindow = () => {
    const browserOptions = { show: false, width: 1290, height: 768, autoHideMenuBar: true, minWidth: 800, minHeight: 600 }
    let newWindow = new BrowserWindow(browserOptions);

    if(THEME == "dark"){
        newWindow.loadFile(`${__dirname}/index_dark.html`);
    }else{
        newWindow.loadFile(`${__dirname}/index.html`);
    }
    

    newWindow.once('ready-to-show', () => {
        newWindow.show();
    })

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        newWindow = null;
    })

    windows.add(newWindow);
    return newWindow;
}


app.setName("Glacier");
app.on('ready', () => {
    createSplashWindow();  
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
    fs.writeFileSync('store/history.json', historyContent, (err) => {
        console.log("History successfully created")
    })
}

const readHistories = exports.readHistories = (targetWindow) => {
    const content = fs.readFileSync('store/history.json').toString();
    targetWindow.webContents.send('history-loaded', content);
}

const writeBookmarks = exports.writeBookmarks = (bookmarksContent) => {
    fs.writeFileSync("store/bookmarks.json", bookmarksContent, err => {
        console.log("Bookmarks written successfully")
    })
}

const clearBrowsingData = exports.clearBrowsingData = (targetWindow) => {
    const options = {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 1,
        title: 'Clear browsing data?',
        detail: 'Are you sure you want to clear all browsing data ? This includes bookmarks and history'
    }
    const response = dialog.showMessageBox(targetWindow, options, (response) => {
        if (response == 0) {
            fs.writeFileSync("store/bookmarks.json", "");
            fs.writeFileSync("store/history.json", "");
        }
    })

}

const readBookmarks = exports.readBookmarks = (targetWindow) => {
    const content = fs.readFileSync('store/bookmarks.json').toString();
    targetWindow.webContents.send('bookmarks-loaded', content);
}


const writePrefs = exports.writePrefs = (prefsContent) => {
    fs.writeFileSync("store/prefs.json", prefsContent, err => {
        console.log("Preferences written successfully")
    })
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