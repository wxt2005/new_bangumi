'use strict';
/* global console */
/* global document */
/* global window */
/* global location */
/* jshint jquery:true */
/* jshint -W097 */

$(function() {
    // 删除noscipt标签
    $('noscript').remove();

    var i = 0, j = 0, k = 0;
    var l = 0, m = 0, n = 0;
    var dateNow = 0, weekDayNow = 0, yearNow = 0, monthNow = 0;
    var yearRead = 0, monthRead = 0;
    var timer = null;
    var weekDayCN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var weekDayJP = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];

    // 支持的站点列表
    var sites = {
        list: [
            {name: 'A站', domain: 'acfun', show: true},
            {name: 'B站', domain: 'bilibili', show: true},
            {name: '搜狐', domain: 'sohu', show: true},
            {name: '优酷', domain: 'youku', show: true},
            {name: '腾讯', domain: 'qq', show: true},
            {name: '爱奇艺', domain: 'iqiyi', show: true},
            {name: '乐视', domain: 'letv', show: true},
            {name: 'PPTV', domain: 'pptv', show: true},
            {name: '土豆', domain: 'tudou', show: true},
            {name: '迅雷', domain: 'movie', show: true}
        ],
        turnAll: function(bool) {
            var result = [];
            for (k = 0, n = this.list.length; k < n; k++) {
                if (this.list[k].show !== bool) {
                    this.list[k].show = bool;
                    result.push(this.list[k].domain);
                }
            }
            return result;
        },
        show: function(item, flag) {
            for (k = 0, n = this.list.length; k < n; k++) {
                if (this.list[k].name === item || this.list[k].domain === item) {
                    if (flag !== undefined) {
                        this.list[k].show = flag;
                    }
                    return this.list[k].show;
                }
            }
            return undefined;
        }
    };

    var $tbody = $('#bangumiList');
    var $shadow = $('#shadow');
    var $switcher = $('#switcher');
    var $orderJP = $('table th:eq(1) p');
    var $orderCN = $('table th:eq(2) p');
    var $search = $('#search input');
    var $topNav = $('#topnav');
    var $topNavMenus = $topNav.find('.menu');
    var $topNavMenuButtons = $topNavMenus.children('a');
    var $hourSelecter = $('#hourSelecter');

    var archive = null,
        bgmData = null;

    var status = {
        reverse: true,
        ordered: 'CN',
        switchInit: 7,
        switchLog: 7,
        weekDay: -1,
        nextTime: 24,
        title: '',
        lastModified: '',
        showAll: false,
        history: false,
        newTab: false,
        jpTime: false,
        jpTimeZone: 8,
        jpTitle: false,
        showNew: false
    };

    /**
     * 将字符串还原为布尔值
     * @method revertBoolean
     * @param {string} a 还原前字符串
     * @return 还原后布尔值
     */
    function revertBoolean(a) {
        switch (a) {
            case 'true':
                return true;
            case 'false':
                return false;
            default:
                return !!a;
        }
    }

    /**
     * 格式化周天
     * @method formatWeekDay
     * @param {number} index 周天序号
     * @param {string} country 国家代号 'cn' or 'jp'
     * @return {string} 格式化后的周天
     */
    function formatWeekDay(index, country) {
        switch (country.toLowerCase()) {
            case 'cn':
                return weekDayCN[index];
            case 'jp':
                return weekDayJP[index];
            default:
                return weekDayCN[index];
        }
    }

    /**
     * 格式化时间
     * @method formatTime
     * @param {string} time 时间字符串 '1200'
     * @return {string} 格式化后的时间 '12:00'
     */
    function formatTime(time) {
        if (time === -1) {
            return '(未知)';
        } else {
            return time ? time.slice(0, 2) + ':' + time.slice(2) : '(预计)';
        }
    }

    /**
     * 月份转换为季度
     * @method monthToSeason
     * @param {number} month 月份
     * @return {number} 季度 '1月 4月 7月 10月'
     */
    function monthToSeason(month) {
        switch (true) {
            case (month < 4):
                return 1;
            case (month < 7):
                return 4;
            case (month < 10):
                return 7;
            case (month <= 12):
                return 10;
            default:
                throw new Error('failed convrting to season');
        }
    }

    /**
     * 检查站点过滤选项是否选中
     * @method checkSiteOptions
     */
    function checkSiteOptions() {
        var count = 0;
        var $siteOptions = $topNav.find('.sites :checkbox');
        for (i = 0, l = $siteOptions.length; i < l; i++) {
            if (sites.show($siteOptions.get(i).id)) {
                $siteOptions.eq(i).attr('checked', true)
                    .prev().find('span').addClass('ON');
                count++;
            } else {
                $siteOptions.eq(i).attr('checked', false)
                    .prev().find('span').removeClass('ON');
            }
        }
        // 如果所有选项都被选中，则按钮显示为"全不选"，否则显示为"全选"
        if (count === $siteOptions.length) {
            $('#selectAll').text('全不选');
        } else {
            $('#selectAll').text('全选');
        }
    }

    /**
     * 获取链接中的主域名
     * @method getDomain
     * @param {string} url 网址
     * @return {string} 主域名或者空字符串
     * @TODO 正确获取迅雷看看的域名，现在只用movie来代替
     */
    function getDomain(url) {
        var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;
        if (url !== '#') {
            return url.match(re)[1].toLowerCase();
        } else {
            return '';
        }
    }

    /**
     * 获取番组数据json的路径
     * @method getPath
     * @param {number} year 年份
     * @param {number} month 月份
     * @param {array} archive archive数据数列
     * @return {string} 番组数据json文件的路径
     */
    function getPath(year, month, archive) {
        yearRead = year;
        monthRead = monthToSeason(month);
        for (i = 0, l = archive.length; i < l; i++) {
            if (archive[i].year === year) {
                var months = archive[i].months;
                for (j = 0, m = months.length; j < m; j++ ) {
                    if (monthRead === months[j].month && months[j].json) {
                        return months[j].json;
                    }
                }
                // 如果没有找到符合条件的json路径
                // 如果已经是一月，则查找上一年的十月
                if (monthRead === 1) {
                    return getPath(year - 1, 10, archive);
                // 否则查找上一季度
                } else {
                    return getPath(year, month - 3, archive);
                }
            }
        }
        // 如果年份不符，查找上一年同月
        return getPath(year - 1, month, archive);
    }

    /**
     * 链接排序(用于sort方法)
     * @method sortLink
     * @param {string} a 上一个链接
     * @param {string} b 当前比较链接
     * @return {number} 1 0 -1
     */
    function sortLink(a, b) {
        a = formatLink(getDomain(a));
        b = formatLink(getDomain(b));
        // 将文字长的链接排后面
        if (a.length === b.length) {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            } else {
                return 0;
            }
        } else {
            return a.length - b.length;
        }
    }

    /**
     * 格式化链接
     * @method formatLink
     * @param {string} domain 主域名
     * @return {string} 链接站点的名称
     * @TODO 正确识别迅雷域名，需和getDomain一起改进
     */
    function formatLink(domain) {
        switch (domain) {
            case 'youku':
                return '优酷';
            case 'sohu':
                return '搜狐';
            case 'qq':
                return '腾讯';
            case 'iqiyi':
                return '爱奇艺';
            case 'letv':
                return '乐视';
            case 'pptv':
                return 'PPTV';
            case 'tudou':
                return '土豆';
            case 'bilibili':
                return 'B站';
            case 'acfun':
                return 'A站';
            case 'movie':
                return '迅雷';
            default:
                return '未知';
        }
    }

    /**
     * 将HTML插入表格
     * @method showTable
     * @param {string} html 要插入的HTML代码
     */
    function showTable(html) {
        $tbody.empty();
        $tbody.append(html);
        $tbody.find('.links li:last-child').addClass('last');
        addCommentListener();
    }

    /**
     * 生成排序按钮的处理函数
     * @method orderHandler
     * @param {string} country 国家代码 'cn' 'jp'
     * @return {function} 排序按钮的处理函数
     */
    function orderHandler(country) {
        return function(event, reverse, init) {
            $(this).parents('tr').find('p').removeClass('ordered');
            $(this).addClass('ordered');
            if (reverse !== undefined) {
                sortData(bgmData, reverse, country);
            } else {
                sortData(bgmData, !status.reverse, country);
            }
            showTable(dataToHTML(bgmData));
            if (!init) {
                tableFilter();
            }
        };
    }

    /**
     * 构建站点过滤菜单
     * @method buildSites
     */
    function buildSites() {
        var html = '';
        var $node = null;
        for (i = 0, l = sites.list.length; i < l; i++) {
            html += '<li><label for="' + sites.list[i].domain + '">' +
                sites.list[i].name + '<span class="toggle"></span></label>' +
                '<input type="checkbox" name="' + sites.list[i].domain + '" id="' +
                sites.list[i].domain + '"></li>';
        }
        $node = $(html);
        // 单选框事件
        $node.find(':checkbox').change(function() {
            sites.show(this.id, this.checked);
            checkSiteOptions();
            showTable(dataToHTML(bgmData));
            // 让下一次排序为JP
            status.ordered = "CN";
            // 使用记录的switch值
            $switcher.trigger('click', [status.switchLog, true]);
            $.cookie(this.id, this.checked, {expires: 365});
        });
        $topNav.find('.sites').prepend($node);
    }

    /**
     * 排序番组数据
     * @method sortData
     * @param {array} data 番组数据
     * @param {boolean} reverse 是否逆序
     * @param {string} country 国家标记 'cn' 'jp'
     */
    function sortData(data, reverse, country) {
        var weekDay = '', time = '';
        var flag = (reverse ? -1 : 1);
        var aTime = 0,
            bTime = 0;
        // 记录
        status.reverse = reverse;
        status.ordered = country;
        if (country) {
            weekDay = 'weekDay' + country.toUpperCase();
            time = 'time' + country.toUpperCase();
        } else {
            weekDay = 'weekDayCN';
            time = 'timeCN';
        }
        data.sort(function(a, b) {
            // 周天相等时，比较时间
            if(a[weekDay] === b[weekDay]) {
                aTime = (a[time] === '' ? -1 : +a[time]);
                bTime = (b[time] === '' ? -1 : +b[time]);
                // 防止同时间的项目随机排序
                if (aTime === bTime) {
                    return flag * (a.officalSite - b.officalSite);
                } else {
                    return flag * (aTime - bTime);
                }
            } else {
                return flag * (a[weekDay] - b[weekDay]);
            }
        });
    }

    /**
     * 番组数据转换为HTML代码
     * @method dataToHTML
     * @param {array} data 番组数据
     * @return {string} HTML代码
     */
    function dataToHTML(data) {
        var html = '',
            linkHtml = '';
        for (i = 0, l = data.length; i < l; i++) {
            html += '<tr><td><a href="' + data[i].officalSite + '" title="' +
                (status.jpTitle ? data[i].titleCN : data[i].titleJP) +
                (data[i].newBgm ? '" class="new">' : '">') +
                (status.jpTitle ? data[i].titleJP : data[i].titleCN) + '</a></td><td>' +
                (data[i].comment ? '<div class="comment">' +
                '<div class="tooltip">' + data[i].comment + '</div></div>' : '') +
                '</td><td><span class="weekDay">' +
                formatWeekDay(data[i].weekDayJP, (status.jpTime ? 'jp' : 'cn')) +
                '</span><span class="time">' + formatTime(data[i].timeJP) +
                '</span></td><td><span class="weekDay">' +
                formatWeekDay(data[i].weekDayCN, 'cn') + '</span><span class="time">' +
                formatTime(data[i].timeCN) + '</span></td>';
            if (data[i].onAirSite.length) {
                linkHtml = '';
                // 将链接排序
                data[i].onAirSite.sort(sortLink);
                html += '<td><ul class="links">';
                for (j = 0, m = data[i].onAirSite.length; j < m; j++) {
                    // 是否显示该站点
                    if (sites.show(getDomain(data[i].onAirSite[j]))) {
                        // 最后一个链接添加last类，用于CSS
                        if (j === m - 1) {
                            linkHtml +=  '<li>';
                        } else {
                            linkHtml += '<li>';
                        }
                        linkHtml += '<a href="' + data[i].onAirSite[j] + '" target="_self">' +
                            formatLink(getDomain(data[i].onAirSite[j])) + '</a></li>';
                    }
                }
                // 如果站点全部被过滤，显示'过滤'
                if (linkHtml === '') {
                    linkHtml += '<li class="empty">过滤</li>';
                }
                html += linkHtml + '</ul></td></tr>';
            } else {
                // 如果没有链接，则显示为'暂无'
                html += '<td><ul class="links"><li class="empty">暂无</li></ul></td></tr>';
            }
        }
        return html;
    }

    /**
     * 构建历史数据菜单
     * @method buildArchive
     * @param {array} archive archive数据
     */
    function buildArchive(archive) {
        var html = '';
        var $node = null;
        for(i = 0, l = archive.length; i < l; i++) {
            var months = archive[i].months;
            html += '<li><a href="#">' + archive[i].year + '年</a><ul class="submenu month">';
            for (j = 0, m = months.length; j < m; j++) {
                html += '<li><a href="#" data-json="' + months[j].json + '">' + months[j].month + '月</a></li>';
            }
            html += '</ul></li>';
        }
        // 生成节点
        $node = $(html);
        $node.each(function() {
            $(this).hover(function() {
                $(this).find('ul').show();
            }, function() {
                $(this).find('ul').hide();
            }).find('ul').hide();
        });
        $node.find('ul a').click(function() {
            var path = $(this).data('json');
            status.history = true;
            getBgmJSON(path);
            yearRead = +('20' + path.match(/(\d{2})(\d{2})/)[1]);
            monthRead = +(path.match(/(\d{2})(\d{2})/)[2]);
            $(this).parents('.submenu').hide();
            return false;
        });

        $topNav.find('li ul.year').append($node);
    }

    /**
     * 用于开关表格中行的显示
     * @method tableFilter
     */
    function tableFilter() {
        var $items = $tbody.find('tr');
        var count = 0;
        $items.detach();
        for (i = 0, l = $items.length; i < l; i++) {
            // 如果选中仅显示新番，则不再显示新番标志
            if (status.showNew && $items.eq(i).find('.new').length) {
                $items.eq(i).find('.new').addClass('hideMark');
            } else {
                $items.eq(i).find('.new').removeClass('hideMark');
            }
            if (decideShow($items.eq(i))) {
                $items.eq(i).show();
                count++;
            } else {
                $items.eq(i).hide();
            }
        }
        $items.appendTo($tbody);
        if (count === 0) {
            $('<tr><td colspan="5">无结果</td></tr>').appendTo($tbody);
        }
    }

    /**
     * 为comment按钮绑定事件
     * @method addCommentListener
     */
    function addCommentListener() {
        $tbody.find('.comment').click(function() {
            var $tooltip = $(this).find('div');
            if ($(this).position().top <= $tooltip.innerHeight() * 2) {
                $tooltip.addClass('opposite');
            }
            $tooltip.toggle();
        }).hover(function() {
            var $tooltip = $(this).find('div');
            if ($(this).position().top <= $tooltip.innerHeight() * 2) {
                $tooltip.addClass('opposite').show();
            } else {
                $tooltip.show();
            }
        }, function() {
            $(this).find('div').hide();
        });
    }

    /**
     * 改变表格中所有链接的target
     * @method changeTarget
     * @param {string} target 链接目标
     */
    function changeTarget(target) {
        if (target) {
            $tbody.find('a').attr('target', target);
        } else {
            $tbody.find('a').attr('target', '_self');
        }
    }

    /**
     * 检查小时选择器的按钮状态
     * @method checkHourSelecter
     */
    function checkHourSelecter() {
        $hourSelecter.find('span').removeClass('disable');
        if (status.nextTime === 24) {
            $hourSelecter.find('.right').addClass('disable');
        } else if (status.nextTime === 20) {
            $hourSelecter.find('.left').addClass('disable');
        }
        $hourSelecter.find('p').text(status.nextTime + '点');
    }

    /**
     * 传入表格行，返回是否输出
     * @method decideShow
     * @param {jquery object} item 表格的行
     * @return {boolean} 是否显示该行
     */
    function decideShow(item) {
        var showFlag = false;
        // 星期几
        var itemWeekDay = item.find('td:eq(3) .weekDay').text();
        // 时间
        var itemTime = +(item.find('td:eq(3) .time').text().slice(0,2));
        // 如果时间非法，则记为0
        if (!itemTime) {
            itemTime = 0;
        }
        // 全部显示
        if (status.weekDay === -1 ) {
            showFlag = true;
        // 该行数据的周天等于查询的周天且时间早于转天时间，或该行周天早查询的周天一日且时间晚于等于转天时间，则显示
        } else if ((itemWeekDay === weekDayCN[status.weekDay] && itemTime < status.nextTime) ||
                        (itemWeekDay ===  weekDayCN[(status.weekDay === 0 ? 6 : status.weekDay - 1)] &&
                        itemTime >= status.nextTime)) {
            showFlag = true;
        }
        // 如果仅显示新番开关打开，该行的首个单元格内链接的class不为new，则隐藏
        if (status.showNew && !(item.find('td:eq(0) a').is('.new'))) {
            showFlag = false;
        }
        // 如果存在标题查询字符串，则检测首个单元格内链接的文字或者title是否匹配，否则隐藏
        if (status.title) {
            // 转义符防止问号等特殊符号出错
            var re = new RegExp('\\' + status.title, 'i');
            var titleLink = item.find('td:eq(0) a');
            if (!re.test(titleLink.text()) && !re.test(titleLink.attr('title'))) {
                showFlag = false;
            }
        }
        return showFlag;
    }

    /**
     * 用于在switcher中显示今天
     * @method switcherToday
     * @param {number} index switcher的序号
     */
    function switcherToday(index) {
        var $switchToday = $switcher.find('li:eq(' + index + ')');
        var old = $switchToday.text();
        $switchToday.text('今天');
        $switchToday.hover(function() {
            $(this).text(old);
        }, function() {
            $(this).text('今天');
        });
    }

    /**
     * 检查个选项初始状态
     * @method checkOptions
     */
    function checkOptions() {
        // 只显示新番
        if ($.cookie('showNew') !== undefined) {
            status.showNew = $.cookie('showNew', revertBoolean);
        }
        if (status.showNew) {
            $topNav.find('#showNew').attr('checked', true)
                .prev().find('span').addClass('ON');
        }

        // 显示全部
        if ($.cookie('showAll') !== undefined) {
            status.showAll = $.cookie('showAll', revertBoolean);
        }
        if (status.showAll) {
            $topNav.find('#showAll').attr('checked', true)
                .prev().find('span').addClass('ON');
        }

        // 打开新窗口
        if ($.cookie('newTab') !== undefined) {
            status.newTab = $.cookie('newTab', revertBoolean);
        }
        if (status.newTab) {
            $topNav.find('#newTab').attr('checked', true)
                .prev().find('span').addClass('ON');
        }

        // 还原日本时区
        if ($.cookie('jpTime') !== undefined) {
            status.jpTime = $.cookie('jpTime', revertBoolean);
        }
        if (status.jpTime) {
            $topNav.find('#jpTime').attr('checked', true)
                .prev().find('span').addClass('ON');
        }

        // 日文标题
        if ($.cookie('jpTitle') !== undefined) {
            status.jpTitle = $.cookie('jpTitle', revertBoolean);
        }
        if (status.jpTitle) {
            $topNav.find('#jpTitle').attr('checked', true)
                .prev().find('span').addClass('ON');
        }

        // 转到次日
        if ($.cookie('nextTime') !== undefined) {
            status.nextTime = $.cookie('nextTime', Number);
        }
        checkHourSelecter();

        // 站点列表
        for (i = 0, l = sites.list.length; i < l; i++) {
            if ($.cookie(sites.list[i].domain) !== undefined) {
                sites.list[i].show = $.cookie(sites.list[i].domain, revertBoolean);
            }
        }

    }

    /**
     * 清除所有设置以及cookies
     * @method resetOptions
     */
    function resetOptions() {
        var keys = document.cookie.match(/[^ =;]+(?=\=)/g);
        if (keys) {
            for (i = 0, l = keys.length; i < l; i++) {
                $.removeCookie(keys[i]);
            }
        }
        /*$('#showNew, #showAll, #newTab, #jpTime, #jpTitle').each(function() {
            $(this).attr('checked', false)
                .prev().find('span').removeClass('ON');
        });
        status.nextTime = 24;
        status.showNew = false;
        status.showAll = false;
        status.jpTime = false;
        status.jpTitle = false;
        status.newTab = false;
        status.title = '';
        $search.blur().val('');
        changeTimeZone('jp', 8);
        sites.turnAll(true);
        checkSiteOptions();
        showTable(dataToHTML(bgmData));
        if (status.history) {
            $switcher.trigger('click', [7, true]);
        } else {
            $switcher.trigger('click', [status.switchInit, true]);
        }
        changeTarget('_self');
        checkHourSelecter();*/
        location.reload(true);
    }

    /**
     * 修改时区
     * @method changeTimeZone
     * @param {string} country 需要修改时区的国家的代码 'cn' 'jp'
     * @param {number} utc 时区 GMT '+8' '-8'
     */
    function changeTimeZone(country, utc) {
        // 和原本时区之间的差值
        var offset = utc - status[country.toLowerCase() + 'TimeZone'];
        var timeStr = 'time' + country.toUpperCase();
        var weekDayStr = 'weekDay' + country.toUpperCase();
        var time, weekDay;
        for (i = 0, l = bgmData.length; i < l; i++) {
            time = +bgmData[i][timeStr].slice(0, 2);
            weekDay = +bgmData[i][weekDayStr];
            time = time + offset;
            // 时间往回倒一天
            if (time < 0) {
                time += 24;
                weekDay--;
            // 时间往前进一天
            } else if (time >= 24) {
                time -= 24;
                weekDay++;
            }
            // 补前导0
            if (time < 10) {
                time = '0' + time;
            }
            // 周天往前一天
            if (weekDay < 0) {
                weekDay += 7;
            // 周天往后一天
            } else if (weekDay > 6) {
                weekDay -= 7;
            }
            bgmData[i][timeStr] = time + bgmData[i][timeStr].slice(2);
            bgmData[i][weekDayStr] = weekDay + '';
        }
        // 记录现在时区
        status[country.toLowerCase() + 'TimeZone'] = utc;
    }

    /**
     * 读取番组数据
     * @method getBgmJSON
     * @param {string} path JSON文件的路径
     */
    function getBgmJSON(path) {
        $.ajax({
            url: path,
            success: function(data, stat, xhr) {
                bgmData = data;
                // 检查各选项状态
                checkOptions();
                // 如果为显示历史数据，则将jpTimeZone回归到GMT+8
                if (status.history) {
                    status.jpTimeZone = 8;
                }
                // 如果打开还原日本时区选项，则改变日本时区
                if (status.jpTime) {
                    changeTimeZone('jp', 9);
                }
                // 模拟点击switcher按钮，声明为初始化
                // 如果为显示历史数据，则临时关闭自动切换功能
                if (status.history || status.showAll) {
                    $switcher.trigger('click', [7, true, true]);
                } else {
                    $switcher.trigger('click', [status.switchInit, true, true]);
                }

                // 过滤表格
                tableFilter();

                // 如果选项打开，设置链接为_blank
                if(status.newTab) {
                    changeTarget('_blank');
                }
                // 构建站点过滤菜单
                buildSites();
                // 检查站点过滤选项开关
                checkSiteOptions();
                // 获取数据文件最后修改时间
                if (xhr.getResponseHeader('Last-Modified')) {
                    var tempDate = new Date(xhr.getResponseHeader('Last-Modified'));
                    status.lastModified = '数据更新日期: ' + tempDate.getFullYear() + '年' +
                        (tempDate.getMonth() + 1) + '月' + tempDate.getDate() + '日';
                }
                // 更新标题
                $('#header h1').text(yearRead + '年' + monthRead + '月番组');
                // 更新番组数目
                $('#header .total').text('当季共有' + data.length + '部番组');
                // 更新最后修改时间
                $('#header .lastModified').text(status.lastModified);

                // 隐藏遮罩
                $shadow.hide();
            },
            error: function(xhr, stat, error) {
                // 在表格中添加显示错误信息的行
                $tbody.append('<tr><td colspan="4">读取 ' + path + ' 出错，错误代码：' +
                    xhr.status + ' ' + error + '</td></tr>');
            }
        });
    }

    // ajax读取archive
    $.ajax({
        url: 'json/archive.json',
        success: function(data, stat, xhr) {
            // 获取当前服务器时间。如服务器时间不可用，使用本地时间
            dateNow = (xhr.getResponseHeader('Date') ? new Date(xhr.getResponseHeader('Date')) : new Date());
            yearNow = dateNow.getFullYear();
            monthNow = dateNow.getMonth() + 1;
            weekDayNow = dateNow.getDay();
            // 将获取的星期几转换为switcher的序号，存入变量
            status.switchInit = (weekDayNow === 0 ? 6 : weekDayNow - 1);
            switcherToday(status.switchInit);
            archive = data;
            // 获取番组json路径，读取
            getBgmJSON(getPath(yearNow, monthNow, data));
            // 初始化历史数据菜单
            buildArchive(data);
        },
        error: function(xhr, stat, error) {
            // 在表格中添加显示错误信息的行
            $tbody.append('<tr><td colspan="4">读取 json/archive.json 出错，错误代码：' +
                xhr.status + ' ' + error + '</td></tr>');
        }
    });

    // 选择器点击事件
    $switcher.click(function(event, index, direct, noFilter) {
            var $target = $(event.target);
            // 防止触到li以外的区域触发事件
            if (event.target !== this || direct) {
                // 将所有选择器按钮的class清空
                $switcher.find('li').removeClass('selected');
                // 使用undefined判断，防止误判数字0
                if (index !== undefined) {
                    $switcher.find('li:eq(' + index + ')').addClass('selected');
                } else {
                    // 如果index参数不存在，使用event目标在ul中的序列代替
                    index = $target.index();
                    $target.addClass('selected');
                }
                // 记录index
                status.switchLog = index;
                // '周日'-->'weekDay:0'
                if (index === 6) {
                    status.weekDay = 0;
                // '全部'-->'weekDay:-1'
                } else if (index === 7) {
                    status.weekDay = -1;
                } else {
                    status.weekDay = index + 1;
                }
                // 如果选择全部，则用日本时间排序，否则用中国事件排序
                if (index === 7 && (status.ordered !== 'JP' || status.reverse !== false)) {
                    // 模拟点击排序按钮(日本时间)，声明为初始化，防止重复调用tableFilter
                    $orderJP.trigger('click', [false, true]);
                } else if (status.ordered !== 'CN' || status.reverse !== false) {
                    $orderCN.trigger('click', [false, true]);
                }
                // 如果没有声明noFilter，则过滤表格
                if (!noFilter) {
                    tableFilter();
                }
            }
    });

    // 排序按钮绑定点击事件
    $orderCN.click(orderHandler('CN'));
    $orderJP.click(orderHandler('JP'));

    // 导航栏主按钮绑定hover事件
/*    $topNav.find('.menu').hover(function() {
        window.clearTimeout(timer);
        $topNav.find('ul').hide();
        $(this).children('ul').show();
        $shadow.show();
    }, function() {
        if (Function.prototype.bind) {
            window.clearTimeout(timer);
            timer = window.setTimeout(function() {
                $(this).children('ul').hide();
                $shadow.hide();
            }.bind(this), 300);
        } else {
            $(this).children('ul').hide();
            $shadow.hide();
        }
    }).children('a').click(function(event) {
        // 单击链接时隐藏菜单
        if (event.target === this) {
            $(this).next().toggle();
            $shadow.toggle();
        }
        return false;
    }).find('ul').hide();*/

    $topNavMenuButtons.click(function(event) {
        if ($(this).parent().hasClass('active')) {
            $topNavMenus.removeClass('active');
            $shadow.hide();
        } else {
            $topNavMenus.removeClass('active');
            $(this).parent().addClass('active');
            $shadow.show();
        }
        return false;
    });

    // 搜索框绑定keyup事件
    $search.keyup(function(event) {
        // 模拟按下switcher第七个按钮来显示所有番组
        $switcher.trigger('click', [7, true, true]);
        // 显示清除按钮
        $(this).next().show();
        status.title = $(this).val();
        tableFilter();
        // 按下ESC键
        if(event.keyCode === 27) {
            $(this).blur().val('');
            status.title = '';
            // 模拟点击switcher，传入保存的switch序号
            if (status.showAll || status.history) {
                $switcher.trigger('click', [7, true]);
            } else {
                $switcher.trigger('click', [status.switchInit, true]);
            }
            // 隐藏清除按钮
            $(this).next().hide();
        // 回车清空搜索栏
        } else if (event.keyCode === 8 && event.target.value.length <= 0) {
            if (status.showAll || status.history) {
                $switcher.trigger('click', [7, true]);
            } else {
                $switcher.trigger('click', [status.switchInit, true]);
            }
            // 隐藏清除按钮
            $(this).next().hide();
        }
    })
        // 清除按钮点击事件
        .next().hide().click(function() {
            $search.blur().val('');
            status.title = '';
            $switcher.trigger('click', [status.switchInit, true]);
            // 隐藏清除按钮
            $(this).hide();
        });


    // 只显示新番按钮绑定事件
    $('#showNew').change(function() {
        if (this.checked) {
            $(this).prev().find('span').addClass('ON');
        } else {
            $(this).prev().find('span').removeClass('ON');
        }
        status.showNew = this.checked;
        $.cookie('showNew', this.checked, {expires: 365});
        tableFilter();
    });

    // 显示全部按钮绑定事件
    $('#showAll').change(function() {
        if (this.checked) {
            $(this).prev().find('span').addClass('ON');
        } else {
            $(this).prev().find('span').removeClass('ON');
        }
        status.showAll = this.checked;
        if (this.checked) {
            $switcher.trigger('click', [7, true]);
        } else {
            $switcher.trigger('click', [status.switchInit, true]);
        }
        $.cookie('showAll', this.checked, {expires: 365});
        tableFilter();
    });

    // 打开新链接按钮绑定事件
    $('#newTab').change(function() {
        if (this.checked) {
            $(this).prev().find('span').addClass('ON');
        } else {
            $(this).prev().find('span').removeClass('ON');
        }
        status.newTab = this.checked;
        $.cookie('newTab', this.checked, {expires: 365});
        changeTarget((status.newTab ? '_blank' : '_self'));
    });

    // 还原日本时区绑定按钮
    $('#jpTime').change(function() {
        if (this.checked) {
            $(this).prev().find('span').addClass('ON');
        } else {
            $(this).prev().find('span').removeClass('ON');
        }
        status.jpTime = this.checked;
        $.cookie('jpTime', this.checked, {expires: 365});
        if (status.jpTime) {
            changeTimeZone('jp', 9);
        } else {
            changeTimeZone('jp', 8);
        }
        showTable(dataToHTML(bgmData));
        tableFilter();
    });

    // 日本标题按钮绑定事件
    $('#jpTitle').change(function() {
        if (this.checked) {
            $(this).prev().find('span').addClass('ON');
        } else {
            $(this).prev().find('span').removeClass('ON');
        }
        status.jpTitle = this.checked;
        $.cookie('jpTitle', this.checked, {expires: 365});
        showTable(dataToHTML(bgmData));
        tableFilter();
    });

    // 转到次日按钮绑定事件
    $hourSelecter.find('span').click(function(event) {
        if (event.target.className === "right" && status.nextTime < 24) {
            status.nextTime++;
            tableFilter();
        } else if (event.target.className === "left" && status.nextTime > 20) {
            status.nextTime--;
            tableFilter();
        }
        checkHourSelecter();
        $.cookie('nextTime', status.nextTime, {expires: 365});
    });

    // 清除所有设置按钮绑定事件
    $('#reset').click(resetOptions);

    // 站点过滤全选按钮绑定事件
    $('#selectAll').click(function() {
        var changed = null;
        if ($(this).text() === '全选') {
            changed = sites.turnAll(true);
        } else if ($(this).text() === '全不选') {
            changed = sites.turnAll(false);
        }
        showTable(dataToHTML(bgmData));
        $switcher.trigger('click', [status.switchLog, true]);
        checkSiteOptions();
        for (i = 0, l = changed.length; i < l; i++) {
            $.cookie(changed[i], sites.show(changed[i]), {expires: 365});
        }
    });

    // 遮罩绑定事件
    $shadow.click(function(event) {
        $(this).hide();
        $topNavMenus.removeClass('active');
    });

    // 分享按钮绑定事件
    $topNav.find('.share a').click(function() {
        window.open(this.href,'','height=420, width=550, scrollbars=yes');
        return false;
    });
});
