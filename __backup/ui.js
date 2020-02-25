const History = require('./history');
const Bookmark = require('./bookmark');
const Mousetrap = require('mousetrap');
const { remote, ipcRenderer } = require('electron');
const mainProcess = remote.require('./main.js');
const currentWindow = remote.getCurrentWindow();

const parser = new DOMParser();
const HIGHEST_ZOOM_FACTOR = 5.0;
const LOWEST_ZOOM_FACTOR = 0.25;
let bookmarks = [];
let histories = [];
const urlInput = document.getElementById('input-field');

//mainProcess.readHistories(currentWindow);

let tabsCounter = 0;
let $currentWebView;

$loader = $(`<div class="spinner container text-center"><div class="loading-spinner"></div></div>`);
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

Mousetrap.bind(['ctrl+shift+b', 'command+shift+b'], () => {

})

//test loader
//$('#parent_div').append($loader);

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
    })

}

function setBeforeLoadListener() {
    $currentWebView.on('did-start-loading', () => {
        $parentTabPane.prepend($loader);
        $currentWebView.hide();
    })
    $currentWebView.on('did-stop-loading', () => {
        $parentTabPane.find('.spinner').remove();
        $currentWebView.show();
    })
}

function loadHistory(){
    mainProcess.readHistories(currentWindow);
}

function loadBookmarks(){
    mainProcess.readBookmarks(currentWindow);
}

function clearBrowsingData(){
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
        //createZoomModal(newZoomFactor);
    })
}

function zoomOut() {
    $currentWebView = $('.tab-content').find('div.active > webview');
    $currentWebView[0].getZoomFactor((currentZoomFactor) => {
        let newZoomFactor = getNextPresetZoom(currentZoomFactor).low;
        $currentWebView[0].setZoomFactor(newZoomFactor);
        //createZoomModal(newZoomFactor);
    })
}

function setInitContentHeight(){
    let height = $('#parent_div').height() - $('.nav').height() - $('#dumb-placeholder').height();
    $('webview').height(height - 2);
}

function setNewContentHeight(){
    let height = $('#parent_div').height() - $('.nav').height() - $('#dumb-placeholder').height() - $('#find-pane').height();
    $('webview').height(height - 2);
}

/*function createZoomModal(zoomFactor){
    function createModal(zoomFactor){
        $('#zoom-modal').find('modal-header').text(`Zoom: ${zoomFactor}`)
    }
    setTimeout(createModal(zoomFactor),1000);
}*/

const createBookmark = () => {
    $currentWebView = $('.tab-content').find('div.active > webview');
    thisURL = $currentWebView.attr("src");
    fetch(thisURL)
        .then(response => response.text())
        .then(parseResponse)
        .then(findTitle)
        .then(title => bookmarks.unshift(new Bookmark(title, thisURL)));

}

const createNewTabWrapper = () => {
    createNewTab(tabsCounter);
    setInitContentHeight();
    tabsCounter++;
    $currentWebView = $('.tab-content').find('div.active > webview');
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

const assignTabCloserAction = () => {
    $('.tab-closer').on('click', function (e) {
        let id = $(this).parent().attr('href');
        $(this).parent().parent().remove()
        $(`.tab-content > .tab-pane${id}`).remove()
    })
}

const renderBookmarks = (bookmarks) => {
    $topDiv = $('<div></div>');
    $parentBookmarkList = $(`<ul id="bookmark-list" class="container list-group"></ul>`);
    for (let bookmark of bookmarks) {
        $childBookmark = $(`<li class="justify list-group-item bookmark-item row"><span class="col-md-3">${bookmark.date}</span><span class="col-md-3">${bookmark.name}</span><span class="col-md-6 url">${bookmark.url}</span></li>`);
        $parentBookmarkList.append($childBookmark);
    }
    $topDiv.append($parentBookmarkList);
    return $topDiv;
}

const renderHistories = (histories) => {
    $topDiv = $('<div></div>');
    $parentHistoryList = $(`<ul id="history-list" class="container-fluid list-group"></ul>`);
    for (let history of histories) {
        $childHistory = $(`<li class="justify list-group-item history-item row"><span class="col-md-3">${history.date}</span><span class="col-md-3">${history.name}</span><span class="col-md-6 url">${history.url}</span></li>`);
        $parentHistoryList.append($childHistory);
    }
    $topDiv.append($parentHistoryList);
    return $topDiv;
}
const parseResponse = (text) => {
    return parser.parseFromString(text, 'text/html');
}

const findTitle = (nodes) => {
    return nodes.querySelector('title').innerText;
}

const createNewTab = (tabsCounter) => {
    $newTab = $(`<li><a href="#tab${tabsCounter}" role="tab" data-toggle="tab">New Tab <span class="pull-right tab-closer" style="margin-left:5px;"><i class="fa fa-times"></span></a></li>`);
    $newTabPane = $(`<div class="tab-pane" id="tab${tabsCounter}"><webview id="webview${tabsCounter}" src='https://abu.edu.ng' style='width:inherit;'></webview><div>`);

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

    $newTabPane = $(`<div class="tab-pane" id="tab${tabsCounter}"><webview id="webview${tabsCounter}" src='${urlLink}' style='width:inherit;'></webview><div>`);
    $parentTabList.find('li').removeClass('active');
    $parentTabPane.find('div').removeClass('active');

    $newTab.addClass('active');
    $newTabPane.addClass('active');

    $parentTabPane.find('#no-tab-message').remove();
    $parentTabList.append($newTab);
    $parentTabPane.append($newTabPane);

    assignTabCloserAction();

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
        let url = $(this).find('.pull-right').text();
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

ipcRenderer.on('history-loaded', (event, content) => {
    histories = JSON.parse(content);
})


$(document).ready(function () {
    loadHistory();
    loadBookmarks();

    urlInput.addEventListener("focus",function(e){
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

    $('#delete-all-data').on('click',()=>{
        clearBrowsingData();
    })

})