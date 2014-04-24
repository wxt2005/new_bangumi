var weekDay = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
var now = new Date();
var day = now.getDay();
var navButtons = document.getElementById("nav").getElementsByTagName("li");
var bangumis = document.getElementById("bangumi_list").getElementsByTagName("tr");

var selectButton = function(num) {
    for (var i = 0; i < navButtons.length; i++) {
        if (i === num - 1) {
            navButtons[i].setAttribute("class", "selected");
        } else {
            navButtons[i].setAttribute("class", "");
        }
    }
    colorTable();
};

var hideOtherBangumi = function(weekDayNum) {
    for (var i = 0; i < bangumis.length; i++) {
        var bangumiInfos = bangumis[i].getElementsByTagName("td");
        if (bangumiInfos[2].innerHTML.indexOf("N/A") === -1
            && bangumiInfos[2].innerHTML.indexOf(weekDay[weekDayNum - 1]) === -1) {
            bangumis[i].setAttribute("class", "hide");
        } else if (bangumiInfos[2].innerHTML.indexOf("N/A") !== -1
            && bangumiInfos[1].innerHTML.indexOf(weekDay[weekDayNum - 1]) === -1) {
            bangumis[i].setAttribute("class", "hide");
        } else {
            bangumis[i].setAttribute("class", "");
        }
    }
};

var bindButton = function() {
    for (var i = 0; i< navButtons.length - 1; i++) {
        (function(){
            var p = i;
            navButtons[i].onclick = function() {
                hideOtherBangumi(p + 1);
                selectButton(p + 1);
            };
        })();
    }
    navButtons[navButtons.length - 1].onclick = function() {
        for (var i = 0; i < bangumis.length; i++) {
            bangumis[i].setAttribute("class", "");
        }
        selectButton(navButtons.length)
    };
};

var colorTable = function() {
    var color = true;
    for (var i = 0; i < bangumis.length; i++) {
        if (color === false && bangumis[i].getAttribute("class") !== "hide") {
            bangumis[i].setAttribute("class", "color");
            color = true;
        } else if (color === true && bangumis[i].getAttribute("class") !== "hide"){
            color = false;
        }
    }
};

window.onload = function(){
    hideOtherBangumi(day);
    selectButton(day);
    bindButton();
}
