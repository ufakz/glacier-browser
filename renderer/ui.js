const History = require('./history');
const Bookmark = require('./bookmark');
const Mousetrap = require('mousetrap');
const { remote, ipcRenderer } = require('electron');
const mainProcess = remote.require('./main.js');
const currentWindow = remote.getCurrentWindow();
const loader = require('./loader.js')

const parser = new DOMParser();
const HIGHEST_ZOOM_FACTOR = 5.0;
const LOWEST_ZOOM_FACTOR = 0.25;
let bookmarks = [];
let histories = [];
let PREFS = mainProcess.PREFS;
const urlInput = document.getElementById('input-field');


let tabsCounter = 0;
let $currentWebView;

$loader = $(`<div class="loading-spinner"></div>`);
$parentTabList = $('.nav-tabs');
$parentTabPane = $('.tab-content');


//Shortcut bindings
Mousetrap.bind(['ctrl+t', 'command+t'], () => {
    createNewTabWrapper();
})

Mousetrap.bind(['ctrl+b', 'command+b'], () => {
    createBookmarksTabWrapper();
})

Mousetrap.bind(['ctrl+h', 'command+h'], () => {
    createHistoryTabWrapper();
})

Mousetrap.bind(['ctrl+i', 'command+i'], () => {
    createPrefsabWrapper();
})

function search(key){
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
}


function refreshInputURL(url) {
    urlInput.value = url;
}

function setOnLoadListener() {
    $currentWebView.on('did-finish-load', () => {
        let url = $currentWebView[0].getURL();
        let pageTitle = $currentWebView[0].getTitle();
        refreshInputURL(url)
        let tabHeaderReplacer = `${pageTitle.slice(0, 20)} <span class="pull-right tab-closer" style="margin-left:10px;"><i class="fa fa-times"></span>`;
        $('.nav-tabs').find('li.active > a').html(tabHeaderReplacer);
        histories.unshift(new History(pageTitle, url));

        assignTabCloserAction();
        reloadHistories();
    })

}

function setBeforeLoadListener() {
    $currentWebView.on('did-start-loading', () => {
        $parentTabPane.prepend($loader);
    })
    $currentWebView.on('did-stop-loading', () => {
        $parentTabPane.find('.loading-spinner').remove();
    })
}

function loadHistory() {
    mainProcess.readHistories(currentWindow);
}

function loadBookmarks() {
    mainProcess.readBookmarks(currentWindow);
}

function reloadHistories(){
    mainProcess.writeHistories(JSON.stringify(histories));
    loadHistory();
}

function reloadBookmarks(){
    mainProcess.writeBookmarks(JSON.stringify(bookmarks));
    loadBookmarks();
}

function clearBrowsingData() {
    mainProcess.clearData();
}

function getNextPresetZoom(zoomFactor) {
    const preset = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2,
        2.5, 3, 4, 5];
    var low = 0;
    var high = preset.length - 1;
    var mid;
    while (high - low > 1) {
        mid = Math.floor((high + low) / 2);
        if (preset[mid] < zoomFactor) {
            low = mid;
        } else if (preset[mid] > zoomFactor) {
            high = mid;
        } else {
            return { low: preset[mid - 1], high: preset[mid + 1] };
        }
    }
    return { low: preset[low], high: preset[high] };
}


function zoomIn() {
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].getZoomFactor((currentZoomFactor) => {
        let newZoomFactor = getNextPresetZoom(currentZoomFactor).high;
        $currentWebView[0].setZoomFactor(newZoomFactor);
    })
}

function zoomOut() {
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].getZoomFactor((currentZoomFactor) => {
        let newZoomFactor = getNextPresetZoom(currentZoomFactor).low;
        $currentWebView[0].setZoomFactor(newZoomFactor);
    })
}

function setInitContentHeight() {
    let height = $('#parent_div').height() - $('.nav').height() - $('#dumb-placeholder').height();
    $('webview').height(height - 4);
}

function setNewContentHeight() {
    let height = $('#parent_div').height() - $('.nav').height() - $('#dumb-placeholder').height() - $('#find-pane').height();
    $('webview').height(height - 4);
}

const createBookmark = () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    thisURL = $currentWebView.attr("src");
    fetch(thisURL)
        .then(response => response.text())
        .then(parseResponse)
        .then(findTitle)
        .then(title => bookmarks.unshift(new Bookmark(title, thisURL)))
        .then(reloadBookmarks);
    
    

}

const createNewTabWrapper = () => {
    createNewTab(tabsCounter);
    setInitContentHeight();
    tabsCounter++;
    $currentWebView = $('.tab-content').find('div.active > webview');
    navigateToURL(PREFS.home_page)
    setBeforeLoadListener();
    setOnLoadListener()
}

const createBookmarksTabWrapper = () => {
    createBookmarksTab();
    tabsCounter++;
    $currentWebView = $('.tab-content').find('div.active > webview');
}

const createHistoryTabWrapper = () => {
    createHistoryTab();
    tabsCounter++;
    $currentWebView = $('.tab-content').find('div.active > webview');
}

const createPrefsTabWrapper = () => {
    createPrefsTab();
    tabsCounter++;
    $currentWebView = $('.tab-content').find('div.active > webview');
}

const assignTabCloserAction = () => {
    $('.tab-closer').on('click', function (e) {
        let id = $(this).parent().attr('href');
        $(this).parent().parent().remove()
        $(`.tab-content > .tab-pane${id}`).remove()
    })
}

const renderBookmarks = (bookmarks) => {
    $topDiv = $('<div></div>');
    $parentBookmarkList = $(`<ul id="bookmark-list" class="container-fluid list-group"></ul>`);
    for (let bookmark of bookmarks) {
        $childBookmark = $(`<li class="list-group-item bookmark-item row"><span class="col-md-3">${bookmark.date}</span><span class="col-md-3">${bookmark.name}</span><span class="url col-md-5">${bookmark.url}</span></li>`);
        $parentBookmarkList.append($childBookmark);
    }
    $topDiv.append($parentBookmarkList);
    return $topDiv;
}

const renderHistories = (histories) => {
    $topDiv = $('<div></div>');
    $parentHistoryList = $(`<ul id="history-list" class="container-fluid list-group"></ul>`);
    for (let history of histories) {
        $childHistory = $(`<li class="list-group-item history-item row"><span class="col-md-2">${history.date}</span><span class="col-md-3">${history.name}</span><span class="url col-md-3">${history.url}</span></li>`);
        $parentHistoryList.append($childHistory);
    }
    $topDiv.append($parentHistoryList);
    return $topDiv;
}

const renderPrefs = (PREFS) =>{
    $topTopDiv = $('<div class="container lead"></div>');
    $topDiv = $('<div class="container lead"></div>');
    $themeContent = $(`<div class="form-group">Theme : <select id="theme-chooser" class="form-control"><option value="light">Light</option><option value="dark">Dark</option></select></div>`);
    $homePageContent = $(`<div class="form-group"> Default Home Page: <input type="text" class="form-control" id="home-page-chooser" value="${PREFS.home_page}"></div>`);
    $searchEngineContent = $(`<div class="form-group"> Preferred Search Engine : <select id="search-engine-chooser" class="form-control"><option value="google">Google</option><option value="duckduckgo">DuckDuckGo</option><option value="bing">Bing</option></select></div>`);
    $clearContent = $(`<p class="text-info" id="delete-all-data" style="cursor:pointer">Clear Browsing Data...</p>`);
    $saveButton = $(`<button class="btn btn-info" id="save-prefs-button">Save Settings</button>`)
    $topDiv.append($themeContent);
    $topDiv.append($homePageContent);
    $topDiv.append($searchEngineContent);
    $topDiv.append($saveButton);
    $topDiv.append($clearContent);
    $topTopDiv.append($topDiv);

    return $topTopDiv;
}
const parseResponse = (text) => {
    return parser.parseFromString(text, 'text/html');
}

const findTitle = (nodes) => {
    return nodes.querySelector('title').innerText;
}

const createNewTab = (tabsCounter) => {
    $newTab = $(`<li><a href="#tab${tabsCounter}" role="tab" data-toggle="tab">New Tab <span class="pull-right tab-closer" style="margin-left:5px;"><i class="fa fa-times"></span></a></li>`);
    $newTabPane = $(`<div class="tab-pane" id="tab${tabsCounter}"><webview id="webview${tabsCounter}" src='' style='width:inherit;'></webview><div>`);

    $parentTabList.find('li').removeClass('active');
    $parentTabPane.find('div').removeClass('active');

    $newTab.addClass('active');
    $newTabPane.addClass('active');

    $parentTabPane.find('#no-tab-message').remove();
    $parentTabList.append($newTab);
    $parentTabPane.append($newTabPane);

    assignTabCloserAction();

}

const createNewLabelledTab = (tabsCounter, urlLink) => {
    $newTab = $(`<li><a href="#tab${tabsCounter}" role="tab" data-toggle="tab">New Tab <span class="pull-right tab-closer" style="margin-left:5px;"><i class="fa fa-times"></span></a></li>`);

    $newTabPane = $(`<div class="tab-pane" id="tab${tabsCounter}"><webview id="webview${tabsCounter}" src='' style='width:inherit;'></webview><div>`);
    $parentTabList.find('li').removeClass('active');
    $parentTabPane.find('div').removeClass('active');

    $newTab.addClass('active');
    $newTabPane.addClass('active');

    $parentTabPane.find('#no-tab-message').remove();
    $parentTabList.append($newTab);
    $parentTabPane.append($newTabPane);

    assignTabCloserAction();
    navigateToURL(urlLink);
}

const createBookmarksTab = () => {
    $newTab = $(`<li><a href="#tab${tabsCounter}" role="tab" data-toggle="tab">Bookmarks <span class="pull-right tab-closer" style="margin-left:5px;"><i class="fa fa-times"></span></a></li>`);
    $bookmarksContent = renderBookmarks(bookmarks);
    $newTabPane = $(`<div class="tab-pane" id="tab${tabsCounter}">${$bookmarksContent.html()}</div>`);

    $parentTabList.find('li').removeClass('active');
    $parentTabPane.find('div').removeClass('active');

    $newTab.addClass('active');
    $newTabPane.addClass('active');

    $parentTabPane.find('#no-tab-message').remove();
    $parentTabList.append($newTab);
    $parentTabPane.append($newTabPane);

    $newTabPane.find('li.bookmark-item').on('click', function (e) {
        //Find a way to reference the url link from the list item
        let url = $(this).find('.url').text();
        createNewLabelledTab(tabsCounter, url);
        setInitContentHeight();
        tabsCounter++;
        $currentWebView = $('.tab-content').find('div.active > webview');
        setOnLoadListener();
    })

    assignTabCloserAction();

}

const createHistoryTab = () => {
    $newTab = $(`<li><a href="#tab${tabsCounter}" role="tab" data-toggle="tab">History <span class="pull-right tab-closer" style="margin-left:5px;"><i class="fa fa-times"></span></a></li>`);
    $historyContent = renderHistories(histories);
    $newTabPane = $(`<div class="tab-pane" id="tab${tabsCounter}">${$historyContent.html()}</div>`);

    $parentTabList.find('li').removeClass('active');
    $parentTabPane.find('div').removeClass('active');

    $newTab.addClass('active');
    $newTabPane.addClass('active');

    $parentTabPane.find('#no-tab-message').remove();
    $parentTabList.append($newTab);
    $parentTabPane.append($newTabPane);

    $newTabPane.find('li.history-item').on('click', function (e) {
        //Find a way to reference the url link from the list item
        let url = $(this).find('.url').text();
        createNewLabelledTab(tabsCounter, url);
        setInitContentHeight();
        tabsCounter++;
        $currentWebView = $('.tab-content').find('div.active > webview');
        setOnLoadListener();
    })

    assignTabCloserAction();
}

const createPrefsTab = () => {
    $newTab = $(`<li><a href="#tab${tabsCounter}" role="tab" data-toggle="tab">Preferences <span class="pull-right tab-closer" style="margin-left:5px;"><i class="fa fa-times"></span></a></li>`);
    $prefsContent = renderPrefs(PREFS);
    $newTabPane = $(`<div class="tab-pane" id="tab${tabsCounter}">${$prefsContent.html()}</div>`);

    $parentTabList.find('li').removeClass('active');
    $parentTabPane.find('div').removeClass('active');

    $newTab.addClass('active');
    $newTabPane.addClass('active');

    $parentTabPane.find('#no-tab-message').remove();
    $parentTabList.append($newTab);
    $parentTabPane.append($newTabPane);

    
    $newTabPane.find('#save-prefs-button').on('click',function (e) {
        PREFS.theme = $(this).parent().find('#theme-chooser').val();
        PREFS.home_page = $(this).parent().find('#home-page-chooser').val();
        PREFS.search_engine = $(this).parent().find('#search-engine-chooser').val();
        mainProcess.writePrefs(JSON.stringify(PREFS));
    })
    $newTabPane.find('#delete-all-data').on('click',function (e) {
        mainProcess.clearBrowsingData(currentWindow);
    })

    assignTabCloserAction();
}

ipcRenderer.on('history-loaded', (event, content) => {
    histories = JSON.parse(content);
})

ipcRenderer.on('bookmarks-loaded', (event, content) => {
    bookmarks = JSON.parse(content);
})



$(document).ready(function () {
    loadHistory();
    loadBookmarks();

    setTimeout(()=>{
        ipcRenderer.send('app-init')
    },5000)

    urlInput.addEventListener("focus", function (e) {
        e.target.select();
    })

    $('[data-toggle="tooltip"]').tooltip();
    //Handles clicking the new tab button
    $('#new-tab-button').on('click', () => {
        createNewTabWrapper()
    })

    $('#bookmark-but').on('click', () => {
        createBookmark();
    })

    $('#open-bookmarks-tab').on('click', () => {
        createBookmarksTabWrapper()
    })

    $('#open-history-tab').on('click', () => {
        createHistoryTabWrapper()
    })

    $('#zoom-in').on('click', () => {
        zoomIn();
    })

    $('#zoom-out').on('click', () => {
        zoomOut();
    })

    $('#prefs').on('click',()=>{
        createPrefsTabWrapper();
    })


})