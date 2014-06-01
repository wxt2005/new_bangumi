var now = new Date();
var day = now.getDay();
var result = {};

//highlight selected button
var selectButton = function(buttonNum) {
    var navBar = document.getElementById("nav");
    var navButtons = navBar.getElementsByTagName("li");
    for (var i = 0, l = navButtons.length; i < l; i++) {
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
    var bangumis = document.getElementById("bangumi_list").getElementsByTagName("tr");
    var weekDayList = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    if (weekDay === 8) {
        for (var i = 0, l = bangumis.length; i < l; i++) {
            bangumis[i].className = "";
        }
    } else {
        for (var i = 0, l = bangumis.length; i < l; i++) {
            var bangumiInfos = bangumis[i].getElementsByTagName("td"),
                timeJp = bangumiInfos[1].textContent ||  bangumiInfos[1].innerText,
                timeCn = bangumiInfos[2].textContent ||  bangumiInfos[2].innerText ;
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
    var navBar = document.getElementById("nav");
    var navButtons = navBar.getElementsByTagName("li");
    navBar.onclick = function(event) {
        var event = event || window.event,
            target = event.target || event.srcElement;
        for (var i = 0, l = navButtons.length; i < l; i++) {
            if (navButtons[i] === target) {
                //button number to weekday
                hideOtherBangumi((function(i){ return i !== 6 ? j = i + 1 : j = 0})(i)); 
                selectButton(i);
            }
        }
    }
};

//color table rows
var colorTable = function() {
    var bangumis = document.getElementById("bangumi_list").getElementsByTagName("tr");
    var colored = true;
    for (var i = 0, l = bangumis.length; i < l; i++) {
        if (colored === false && bangumis[i].className !== "hide") {
            bangumis[i].className = "color";
            colored = true;
        } else if (colored === true && bangumis[i].className !== "hide"){
            colored = false;
        }
    }
};

//fix IE bug
var disableIeSpan = function() {
    var bangumis = document.getElementById("bangumi_list").getElementsByTagName("tr");
    if(navigator.appName === "Microsoft Internet Explorer" && +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 9) {
        for (var i = 0, l = bangumis.length; i < l; i++) {
            var span = bangumis[i].getElementsByTagName("span")[0];
            span.style.cssText = "display:none";
        }
    }
};

var changeTable = function(string) {
     if(navigator.appName === "Microsoft Internet Explorer" && +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 10) {
        var oldTbody = document.getElementsByTagName("tbody")[0];
        var temp = oldTbody.ownerDocument.createElement("div");
        temp.innerHTML = "<table><tbody id=\"bangumi_list\">" + string + "</tbody></table>";
        oldTbody.parentNode.replaceChild(temp.firstChild.firstChild, oldTbody);
     } else {
        document.getElementById("bangumi_list").innerHTML = string; 
     }
};

//support IE 6 xhr object
var createXHR = function() {
    if (typeof XMLHttpRequest !== "undefined") {
        return new XMLHttpRequest();
    } else if (typeof ActiveXObject !== "undefined") {
        if (typeof arguments.callee.activeXString !== "string") {
            var versions = ["MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0",
                "MSXML2.XMLHttp"];
                for (var i=0, l = versions.length; i < l; i++) {
                    try {
                        new ActiveXObject(versions[i]);
                        arguments.callee.activeXString = versions[i];
                        break;
                    } catch (ex) {
                        //skip
                    }
                }
        }
        return new ActiveXObject(arguments.callee.activeXString);
    } else {
        throw new Error("No XHR object available.");
    }
};

var getJson = function() {
    var xhr = createXHR(); 
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                result = JSON.parse(xhr.responseText);
                changeTable(buildTable());
                disableIeSpan();
                hideOtherBangumi(day);
                //week day to button number
                selectButton((function(i){ return i !== 0 ? j = i - 1 : j = 6})(day));
                bindButton();
            } else {
                console.log("wrong");
            }
        }
    };
    xhr.open("get", "json/bangumi.json", true);
    xhr.send(null);
};

var buildTable = function() {
    var htmlString = "";
    for (var bangumi in result) {
        htmlString += "\<tr\>" + "\<td\>" + "\<a href=\"" + result[bangumi]["officalSite"] + "\"\>" + bangumi + "\<span\>" + result[bangumi]["originName"] + "\<\/span\>\<\/a\>\<\/td\>\<td\>" + result[bangumi]["timeJP"] + "\<\/td\>\<td\>" + result[bangumi]["timeCN"] + "\<\/td\>\<td\>" +  "\<\/td\>\<\/tr\>"; 
    }
    result = undefined;
    return htmlString;
};

window.onload = function() {
    getJson();
};
