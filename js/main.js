//highlight selected button
function selectButton(navButtons, buttonNum) {
    for (var i = 0, l = navButtons.length; i < l; i++) {
        if (i === buttonNum) {
            navButtons[i].className = "selected";
        } else {
            navButtons[i].className = "";
        }
    }
}

//color table rows
function colorTable(bangumis) {
    var colored = true;
    for (var i = 0, l = bangumis.length; i < l; i++) {
        if (bangumis[i].className !== "hide") {
            if (!colored) {
                bangumis[i].className = "color";
            }
            colored = !colored;
        }
    }
}

//hide useless bangumis
function hideOtherBangumi(bangumis, weekDay) {
    var weekDayList = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    if (weekDay === -1) {
        for (var i = 0, l = bangumis.length; i < l; i++) {
            bangumis[i].className = "";
        }
    } else {
        for (var i = 0, l = bangumis.length; i < l; i++) {
            var bangumiInfos = bangumis[i].getElementsByTagName("td"),
                timeJP = bangumiInfos[1].textContent || bangumiInfos[1].innerText,
                timeCN = bangumiInfos[2].textContent || bangumiInfos[2].innerText,
                weekDayCN = weekDayList[weekDay];
            if ((timeCN.indexOf("N/A") === -1 && timeCN.indexOf(weekDayCN) === -1) ||
                (timeCN.indexOf("N/A") !== -1 && timeJP.indexOf(weekDayCN) === -1)) {
                    bangumis[i].className = "hide";
                } else {
                    bangumis[i].className = "";
                }
        }
    }
    colorTable(bangumis);
}

//bind event to buttons
function bindButton(bangumis, navBar, navButtons) {
    navBar.onclick = function(event) {
        var event = event || window.event,
            target = event.target || event.srcElement,
            //for converting button index to weekday, -1 for show all
            buttonList = [1, 2, 3, 4, 5, 6, 0, -1];
        for (var i = 0, l = navButtons.length; i < l; i++) {
            if (navButtons[i] === target) {
                //button number to weekday
                hideOtherBangumi(bangumis, buttonList[i]); 
                selectButton(navButtons, i);
            }
        }
    };
}

//becaus IE below version 9 can not show relative span correctly, so hide them
function disableIeSpan(bangumis) {
    if(navigator.appName === "Microsoft Internet Explorer" && 
       +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 9) {
        for (var i = 0, l = bangumis.length; i < l; i++) {
            var span = bangumis[i].getElementsByTagName("span")[0];
            span.style.cssText = "display:none";
        }
    }
}

//fix IE that can not write innerHTML of table element
function showTable(string) {
    //IE below version 10 only
    if(navigator.appName === "Microsoft Internet Explorer" && 
       +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 10) {
            //get tbody element
        var oldTbody = document.getElementsByTagName("tbody")[0],
            //create a div on root document
            temp = oldTbody.ownerDocument.createElement("div");
        //use string to fill up temp div 
        temp.innerHTML = "<table><tbody id='bangumi_list'>" + string + "</tbody></table>";
        //use temp div>table>tbody to overwrite oldTbody
        oldTbody.parentNode.replaceChild(temp.firstChild.firstChild, oldTbody);
    } else {
        document.getElementById("bangumi_list").innerHTML = string; 
    }
    //return bangumis
    return document.getElementById("bangumi_list").getElementsByTagName("tr");
}

//support IE6 or IE7 XMLHttpRequest object
function createXHR() {
    if (typeof XMLHttpRequest !== "undefined") {
        return new XMLHttpRequest();
    } else if (typeof ActiveXObject !== "undefined") {
        return new ActiveXObject("Microsoft.XMLHTTP");
    } else {
        throw new Error("No XHR object available.");
    }
}

//use json to build table dom
function buildTable(result) {
    var htmlString = "";

    for (var bangumi in result) {
        var info = result[bangumi];
        htmlString += "<tr><td><a href='" + info["officalSite"] + "'>" + 
            bangumi + "<span>" + info["originName"] + "</span></a></td><td>" + 
            info["timeJP"] + "</td><td>" + info["timeCN"] + "</td><td>"; 

        if (info["onAir"].length === 0) {
            htmlString += "N/A";
        } else {
            for (var i = 0, l = info["onAir"].length; i < l; i++) {
                htmlString += "<a href='" + info["onAir"][i] + "'>";
                var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;

                switch (info["onAir"][i].match(re)[1].toLowerCase()) {
                    case "youku":
                        htmlString += "优酷";     
                        break;
                    case "sohu":
                        htmlString += "搜狐";
                        break;
                    case "qq":
                        htmlString += "腾讯";
                        break;
                    case "iqiyi":
                        htmlString += "爱奇艺";
                        break;
                    case "letv":
                        htmlString += "乐视";
                        break;
                    case "pptv":
                        htmlString += "PPTV";
                        break;
                    case "tudou":
                        htmlString += "土豆";
                        break;
                    case "bilibili":
                        htmlString += "B站";
                        break;
                    case "acfun":
                        htmlString += "A站";
                        break;
                    default:
                        htmlString += "未知";
                }
                htmlString += "</a> ";

                //add a return after even link
                if (i % 2 !== 0) {
                    htmlString += "<br>";
                }
            }
        }
    }
    return htmlString + "</td></tr>";
}

//use ajax to get json data then do things
function getJSON() {
    var xhr = createXHR(); 
    xhr.open("get", "json/bangumi.json", false);
    xhr.send(null);
    return xhr.responseText;
}

//convert weekDay to button number
function dayToNum(weekDay) {
    return weekDay !== 0 ? num = weekDay - 1 : num = 6;
}

function initPage() {
    var navBar = document.getElementById("nav");
    var navButtons = navBar.getElementsByTagName("li");
    var weekDay = new Date().getDay();
    var result = JSON.parse(getJSON());
    var bangumis = showTable(buildTable(result));
    disableIeSpan(bangumis);
    bindButton(bangumis, navBar, navButtons);
    hideOtherBangumi(bangumis, weekDay);
    selectButton(navButtons, dayToNum(weekDay));
}

window.onload = function() {
    initPage();
};
