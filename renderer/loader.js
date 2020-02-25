function search(key) {
    $currentWebView.attr({ src: `http://${PREFS.search_engine}.com?q=${key}` });
}

function confirmStatus(status, url) {
    switch (status) {
        case 200:
            $currentWebView.attr({ src: url });
            break;
        case 300:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error300.html` });
            break;
        case 301:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error301.html` });
            break;
        case 302:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error302.html` });
            break;
        case 304:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error304.html` });
            break;
        case 307:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error307.html` });
            break;
        case 400:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error400.html` });
            break;
        case 401:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error401.html` });
            break;
        case 403:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error403.html` });
            break;
        case 404:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error404.html` });
            break;
        case 410:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error410.html` });
            break;
        case 500:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error500.html` });
            break;
        case 501:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error501.html` });
            break;
        case 503:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error503.html` });
            break;
        case 550:
            $currentWebView.attr({ src: `${__dirname}/../error_assets/error550.html` });
            break;
        default:
            break

    }
}

function testURl(url) {
    if (navigator.onLine) {
        fetch(url)
            .then(response => confirmStatus(response.status, url))
    } else {
        $currentWebView.attr({ src: `${__dirname}/../error_assets/offline_err.html` })
    }

}

const navigateToURL = exports.navigateToURL = (url) => {
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