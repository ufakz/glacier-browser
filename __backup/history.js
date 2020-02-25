class History {
    constructor(name, url) {
        var today = new Date();
        var time = today.toLocaleTimeString();
        var date = today.toDateString().slice(4);
        this.date = `${time} - ${date}`;
        this.name = name;
        this.url = url;
    }

    convertToString(date) {
        date.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    static getAllHistory() {
        console.log("All history loaded")
    }
}

module.exports = History;