var weekDayList = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
var now = new Date();
var day = now.getDay();
var navBar = document.getElementById("nav")
var navButtons = navBar.getElementsByTagName("li");
var bangumis = document.getElementById("bangumi_list").getElementsByTagName("tr");

//highlight selected button
var selectButton = function(buttonNum) {
    for (var i = 0; i < navButtons.length; i++) {
        if (i === buttonNum) {
            navButtons[i].setAttribute("class", "selected");
        } else {
            navButtons[i].setAttribute("class", "");
        }
    }
    colorTable();
};

//hide unnecessary bangumis
var hideOtherBangumi = function(weekDay) {
    if (weekDay === 8) {
        for (var i = 0; i < bangumis.length; i++) {
            bangumis[i].setAttribute("class", "");
        }
    } else {
        for (var i = 0; i < bangumis.length; i++) {
            var bangumiInfos = bangumis[i].getElementsByTagName("td"),
                timeJp = bangumiInfos[1].innerHTML,
                timeCn = bangumiInfos[2].innerHTML;
            if (timeCn.indexOf("N/A") < 0 && timeCn.indexOf(weekDayList[weekDay]) < 0) {
                bangumis[i].setAttribute("class", "hide");
            } else if (timeCn.indexOf("N/A") > 0 && timeJp.indexOf(weekDayList[weekDay]) < 0) {
                bangumis[i].setAttribute("class", "hide");
            } else {
                bangumis[i].setAttribute("class", "");
            }
        }
    }
};

//bind event to buttons
var bindButton = function() {
    navBar.onclick = function(ev) {
        var ev = ev || window.event,
            target = ev.target || ev.srcElement;
        for (var i = 0; i < navButtons.length; i++) {
            if (navButtons[i] === target) {
                hideOtherBangumi((function(i){ return i !== 6 ? j = i + 1 : j = 0})(i)); //button number to weekday
                selectButton(i);
            }
        }
    }
};

//color table rows
var colorTable = function() {
    var colored = true;
    for (var i = 0; i < bangumis.length; i++) {
        if (colored === false && bangumis[i].getAttribute("class") !== "hide") {
            bangumis[i].setAttribute("class", "color");
            colored = true;
        } else if (colored === true && bangumis[i].getAttribute("class") !== "hide"){
            colored = false;
        }
    }
};

window.onload = function(){
    hideOtherBangumi(day);
    selectButton((function(i){ return i !== 0 ? j = i - 1 : j = 6})(day)); //week day to button number
    bindButton();
}
