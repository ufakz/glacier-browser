//Import dependencies
const fs = require('fs');
const { remote, ipcRenderer } = require('electron');
const Mousetrap = require('mousetrap');
const mainProcess = remote.require('./main.js');
const currentWindow = remote.getCurrentWindow();
//let $currentWebView = $('.tab-content').find('div.active > webview');

//Cache required DOM elements
$backButton = $('#back-button');
$forwardButton = $('#forward-button');
$submitButton = $('#submit-button');
$reloadButton = $('#reload-button');
$openFileButton = $('.open-file-button');
const urlInput = document.getElementById('input-field');
$homeButton = $('#home-button');
$newWindowButton = $('#new-window-button');
$closeWinButton = $("#close-window-button");
$quitAppButton = $('#exit-button');
$printButton = $('#print-button');
$darkMode = $('#toggle-dark-mode');
$openDevTools = $('#open-dev-tools');
$findInPage = $('#find-in-page');
$startFind = $('#start-find-button');
$findNext = $('#find-next')
$findPrevious = $('#find-previous');

let currentSrc;
let currentContent;
var KEY;
//Shortcut bindings
Mousetrap.bind(['ctrl+shift+q', 'command+shift+q'], () => {
    mainProcess.quitApp();
})

Mousetrap.bind(['ctrl+q', 'command+q'], () => {
    mainProcess.closeWindow(currentWindow);
})

Mousetrap.bind(['ctrl+n', 'command+n'], () => {
    mainProcess.createWindow();
})

Mousetrap.bind(['ctrl+o', 'command+o'], () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    mainProcess.getFileFromUser(currentWindow);
})

Mousetrap.bind(['ctrl+d', 'command+d'], () => {
    openDevTools();
})

Mousetrap.bind(['ctrl+f', 'command+f'], () => {
    openFindPane();
})

Mousetrap.bind(['ctrl+p', 'command+p'], () => {
    printPage();
})


function filterURL(url){
    var pattern = /[.]+/;
    if(url.match(pattern) == null){
        search(url);
    }else{
        navigateToURL(url);
    }
}

/*function search(key){
    $currentWebView.attr({src: `http://${PREFS.search_engine}.com?q=${key}`});
}

function confirmStatus(status,url){
    switch (status) {
        case 200:
            $currentWebView.attr({src: url});
            break;
        case 300:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error300.html`});
            break;
        case 301:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error301.html`});
            break;
        case 302:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error302.html`});
            break;
        case 304:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error304.html`});
            break;
        case 307:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error307.html`});
            break;
        case 400:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error400.html`});
            break;
        case 401:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error401.html`});
            break;
        case 403:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error403.html`});
            break;
        case 404:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error404.html`});
            break;
        case 410:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error410.html`});
            break;
        case 500:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error500.html`});
            break;
        case 501:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error501.html`});
            break;       
        case 503:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error503.html`});
            break;
        case 550:
            $currentWebView.attr({src: `${__dirname}/../error_assets/error550.html`});
            break;       
        default:
            break
        
    }
}

function testURl(url){
    if(navigator.onLine){
        fetch(url)
        .then(response => confirmStatus(response.status,url))
    } else {
        $currentWebView.attr({src:`${__dirname}/../error_assets/offline_err.html`})
    }
    
}

function navigateToURL(url) {
    let httpsPrefix = url.slice(0, 8).toLowerCase();
    let httpPrefix = url.slice(0, 7).toLowerCase();
    if (httpsPrefix === "https://") {
       testURl(url);
    } else if (httpPrefix === "http://") {
        testURl(url);
    } else {
        testURl(`http://${url}`);
    }
}*/


function assignTabCloserAction() {
    $('.tab-closer').on('click', function (e) {
        let id = $(this).parent().attr('href');
        $(this).parent().parent().remove()
        $(`.tab-content > .tab-pane${id}`).remove()
    })
}

function openDevTools() {
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].openDevTools();
}

function printPage(){
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].print({ printBackground: true })
}

function openFindPane() {
    $findPane = $('#find-pane');
    $findPane.find('#close-find-pane').on('click', function (e) {
        $(this).parent().parent().hide();
        stopFindInPage();
        setInitContentHeight();
    })
    $findPane.show();
    setNewContentHeight();
}

function findInPage() {
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].findInPage(KEY, {});
}

function findNextOccurance() {
    $currentWebView[0].findInPage(KEY, {
        forward: true,
        findNext: true
    })
}

function findPreviousOccurance() {
    $currentWebView[0].findInPage(KEY, {
        forward: false,
        findNext: true
    })
}

function stopFindInPage() {
    $currentWebView[0].stopFindInPage("clearSelection");
}

$homeButton.on('click', () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    navigateToURL(PREFS.home_page);
    setBeforeLoadListener();
    setOnLoadListener()
});

$backButton.on('click', () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].goBack();
    setBeforeLoadListener();
    setOnLoadListener()
});

$forwardButton.on('click', () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].goForward();
    setBeforeLoadListener();
    setOnLoadListener()
});

$reloadButton.on('click', () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].reload();
    setBeforeLoadListener();
    setOnLoadListener()
})

$submitButton.on('click', () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    filterURL(urlInput.value);
    setBeforeLoadListener();
    setOnLoadListener()
});

$openFileButton.on('click', () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    mainProcess.getFileFromUser(currentWindow);
})

$newWindowButton.on('click', () => {
    mainProcess.createWindow();
})

$openDevTools.on('click', () => {
    openDevTools();
})

$darkMode.on('click',()=>{
    mainProcess.DARK_MODE = !mainProcess.DARK_MODE;
})

$findInPage.on('click', () => {
    openFindPane();
})

$startFind.on('click', () => {
    KEY = $('#find-key').val();
    findInPage(KEY);
})

$findNext.on('click', () => {
    findNextOccurance();
})

$findPrevious.on('click', () => {
    findPreviousOccurance();
})

$printButton.on('click', () => {
    printPage();
})

/*
$printPDFButton.on('click', () => {
    $currentWebView[0].printToPDF({}, function (err, data) {
        if (err) console.log(err);
        let filePath = `${remote.app.getPath('documents')}/${$currentWebView[0].getTitle().replace(/\s+/g, '')}.pdf`;
        fs.writeFile(filePath, data, (error) => {
            if (error) console.log(error);
            console.log("Saved successfully");
        })
    })
})
*/

$closeWinButton.on('click', () => {
    mainProcess.closeWindow(currentWindow);
})

$quitAppButton.on('click', () => {
    mainProcess.quitApp()
})

ipcRenderer.on('file-opened', (event, file, content) => {
    currentContent = content;
    $currentWebView.attr({ src: file });
    setBeforeLoadListener();
    setOnLoadListener()
    currentSrc = file;
})
