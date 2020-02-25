const fs = require('fs');
if(!fs.existsSync('resources')){
    fs.mkdirSync('resources');
}

if(!fs.existsSync('resources/history.json') && 
    !fs.existsSync('resources/bookmarks.json') && 
    !fs.existsSync('resources/prefs.json')){
    fs.writeFileSync('resources/history.json','');
    fs.writeFileSync('resources/bookmarks.json','');
    fs.writeFileSync('resources/prefs.json','');

}