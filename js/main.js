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

//fix IE display bug
var disableIeSpan = function() {
    var bangumis = document.getElementById("bangumi_list").getElementsByTagName("tr");
    if(navigator.appName === "Microsoft Internet Explorer" && +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 9) {
        for (var i = 0, l = bangumis.length; i < l; i++) {
            var span = bangumis[i].getElementsByTagName("span")[0];
            span.style.cssText = "display:none";
        }
    }
};

//fix IE that can not write innerHTML of table element
var changeTable = function(string) {
     if(navigator.appName === "Microsoft Internet Explorer" && +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 10) {
        var oldTbody = document.getElementsByTagName("tbody")[0];
        var temp = oldTbody.ownerDocument.createElement("div");
        temp.innerHTML = "<table><tbody id='bangumi_list'>" + string + "</tbody></table>";
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

//use ajax to get json data then do things
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

//use json to build table dom
var buildTable = function() {
    var htmlString = "";
    for (var bangumi in result) {
        htmlString += "<tr>" + "<td>" + "<a href='" + result[bangumi]["officalSite"] + "'>" + bangumi + "<span>" + result[bangumi]["originName"] + "</span></a></td><td>" + result[bangumi]["timeJP"] + "</td><td>" + result[bangumi]["timeCN"] + "</td><td>"; 
        if (result[bangumi]["onAir"].length === 0) {
            htmlString += "N/A" + "</td></tr>";
        } else {
            for (var i = 0, l = result[bangumi]["onAir"].length; i < l; i++) {
                htmlString += "<a href='" + result[bangumi]["onAir"][i] + "'>";
                var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;
                switch (result[bangumi]["onAir"][i].match(re)[1].toLowerCase()) {
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
                    default:
                        htmlString += "未知";
                }
                htmlString +=  "</a> ";
                
                //add a return after even link
                if (i % 2 !== 0) {
                    htmlString += "<br>";
                }
            }
        }
    }

    //clear result obj
    result = undefined;
    return htmlString + "</td></tr>";
};

window.onload = function() {
    getJson();
};
