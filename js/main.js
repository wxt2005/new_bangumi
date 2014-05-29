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
            navButtons[i].className = "selected";
        } else {
            navButtons[i].className = "";
        }
    }
    colorTable();
};

//hide unnecessary bangumis
var hideOtherBangumi = function(weekDay) {
    if (weekDay === 8) {
        for (var i = 0; i < bangumis.length; i++) {
            bangumis[i].className = "";
        }
    } else {
        for (var i = 0; i < bangumis.length; i++) {
            var bangumiInfos = bangumis[i].getElementsByTagName("td"),
                timeJp = bangumiInfos[1].innerHTML,
                timeCn = bangumiInfos[2].innerHTML;
            if (timeCn.indexOf("N/A") === -1 && timeCn.indexOf(weekDayList[weekDay]) === -1) {
                bangumis[i].className = "hide";
            } else if (timeCn.indexOf("N/A") !== -1 && timeJp.indexOf(weekDayList[weekDay]) === -1) {
                bangumis[i].className = "hide";
            } else {
                bangumis[i].className = "";
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
        if (colored === false && bangumis[i].className !== "hide") {
            bangumis[i].className = "color";
            colored = true;
        } else if (colored === true && bangumis[i].className !== "hide"){
            colored = false;
        }
    }
};

//fix IE bug
var disableIeSpan = function(){
    if(navigator.appName === "Microsoft Internet Explorer" && +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 9) {
        for (var i = 0, l = bangumis.length; i < l; i++) {
             var span = bangumis[i].getElementsByTagName("span")[0];
             span.style.cssText = "display:none";
        }
    }
};

window.onload = function(){
    disableIeSpan();
    hideOtherBangumi(day);
    selectButton((function(i){ return i !== 0 ? j = i - 1 : j = 6})(day)); //week day to button number
    bindButton();
}
