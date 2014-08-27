'use strict';
/* global console */
/* jshint jquery:true */
/* jshint -W097 */

$(function() {
    var i = 0, j = 0;
    var dateNow, weekDayNow, yearNow, monthNow;
    var yearRead, monthRead;
    var weekDayCN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var weekDayJP = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];

    var $tbody = $('#bangumi_list');
    var $switcher = $('#switcher');
    var $orderJP = $('table th:eq(1) p');
    var $orderCN = $('table th:eq(2) p');
    var $search = $('#search input');
    var $topNav = $('#topnav');

    var archive = null,
        bgmData = null;

    var status = {
        reverse: true,
        switch: 7,
        lastModified: '',
        nextTime: 24,
        showAll: false,
        history: false,
        newTab: false,
        jpTime: false,
        jpTimeZone: 8
    };

    var query = {
        weekDay: -1,
        nextTime: 24,
        title: '',
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
        return time ? time.slice(0, 2) + ':' + time.slice(2) : '(预计)';
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
        for (i = 0; i < archive.length; i++) {
            if (archive[i].year === year) {
                var months = archive[i].months;
                for (j = 0; j < months.length; j++ ) {
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
        a = getDomain(a);
        b = getDomain(b);
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * 格式化链接
     * @method formatLink
     * @param {string} url 链接
     * @return {string} 链接站点的名称
     * @TODO 正确识别迅雷域名，需和getDomain一起改进
     */
    function formatLink(url) {
        switch (getDomain(url)) {
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
        $tbody.children('tr').remove();
        $tbody.append(html);
    }

    /**
     * 生成排序按钮的处理函数
     * @method orderHandler
     * @param {string} country 国家代码 'cn' 'jp'
     * @return {function} 排序按钮的处理函数
     */
    function orderHandler(country) {
        return function(event, init) {
            $(this).parents('tr').find('p').removeClass('ordered');
            $(this).addClass('ordered');
            sortData(bgmData, !status.reverse, country);
            showTable(dataToHTML(bgmData));
            if (!init) {
                tableFilter();
            }
        };
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
        status.reverse = reverse;
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
                return flag * ((a[time] === '' ? -1 : +a[time]) -
                    (b[time] === '' ? -1 : +b[time]));
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
        var html = '';
        for (i = 0; i < data.length; i++) {
            html += '<tr><td><a href="' + data[i].officalSite + '" title="' +
                data[i].titleJP + (data[i].newBgm ? '" class="new">' : '">') +
                data[i].titleCN + '</a></td><td><span class="weekDay">' +
                formatWeekDay(data[i].weekDayJP, (status.jpTime ? 'jp' : 'cn')) +
                '</span><span class="time">' + formatTime(data[i].timeJP) +
                '</span></td><td><span class="weekDay">' +
                formatWeekDay(data[i].weekDayCN, 'cn') + '</span><span class="time">' +
                formatTime(data[i].timeCN) + '</span></td>';
            if (data[i].onAirSite.length) {
                // 将链接排序
                data[i].onAirSite.sort(sortLink);
                html += '<td><ul class="link-list">';
                for (j = 0; j < data[i].onAirSite.length; j++) {
                    // 最后一个链接添加lastLink类，用于CSS
                    if (j === data[i].onAirSite.length - 1) {
                        html +=  '<li class="lastLink">';
                    } else {
                        html += '<li>';
                    }
                    html += '<a href="' + data[i].onAirSite[j] + '" target="_self">' +
                        formatLink(data[i].onAirSite[j]) + '</a></li>';
                }
                html += '</ul></td></tr>';
            } else {
                // 如果没有链接，则显示为'暂无'
                html += '<td class="empty">暂无</td></tr>';
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
        for(i = 0; i < archive.length; i++) {
            var months = archive[i].months;
            html += '<li><a href="#">' + archive[i].year + '年</a><ul class="submenu month">';
            for (j = 0; j < months.length; j++) {
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
            var path = $(this).attr('data-json');
            status.history = true;
            getBgmJSON(path);
            yearRead = +('20' + path.match(/(\d{2})(\d{2})/)[1]);
            monthRead = +(path.match(/(\d{2})(\d{2})/)[2]);
            return false;
        });

        $topNav.find('li ul.year').append($node);
    }

    /**
     * 用于开关表格中行的显示
     * @method tableFilter
     */
    function tableFilter() {
        var $items = $tbody.children('tr');
        $items.each(function() {
            if(decideShow($(this))) {
                $(this).show();
            } else {
                $(this).hide();
            }
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
     * 传入表格行，返回是否输出
     * @method decideShow
     * @param {jquery object} item 表格的行
     * @return {boolean} 是否显示该行
     */
    function decideShow(item) {
        var showFlag = false;
        // 星期几
        var itemWeekDay = item.find('td:eq(2) .weekDay').text();
        // 时间
        var itemTime = +(item.find('td:eq(2) .time').text().slice(0,2));
        // 如果时间非法，则记为0
        if (!itemTime) {
            itemTime = 0;
        }
        // 全部显示
        if (query.weekDay === -1 ) {
            showFlag = true;
        // 该行数据的周天等于查询的周天且时间早于转天时间，或该行周天早查询的周天一日且时间晚于等于转天时间，则显示
        } else if ((itemWeekDay === weekDayCN[query.weekDay] && itemTime < query.nextTime) ||
                        (itemWeekDay ===  weekDayCN[(query.weekDay === 0 ? 6 : query.weekDay - 1)] &&
                        itemTime >= query.nextTime)) {
            showFlag = true;
        }
        // 如果仅显示新番开关打开，该行的首个单元格内链接的class不为new，则隐藏
        if (query.showNew && !(item.find('td:eq(0) a').is('.new'))) {
            console.log(query.showNew, 'bgm filted');
            showFlag = false;
        }
        // 如果存在标题查询字符串，则检测首个单元格内的文字是否匹配，否则隐藏
        if (query.title) {
            var re = new RegExp(query.title, 'i');
            if (!re.test(item.find('td:eq(0)').text())) {
                showFlag = false;
            }
        }
        return showFlag;
    }

    /**
     * 检查个选项初始状态
     * @method checkOptions
     */
    function checkOptions() {
        // 只显示新番
        if ($.cookie('showNew') !== undefined) {
            query.showNew = $.cookie('showNew', revertBoolean);
        }
        if (query.showNew) {
            $topNav.find('#showNew').attr('checked', true)
                .prev().children('span').addClass('ON');
        }

        // 显示全部
        if ($.cookie('showAll') !== undefined) {
            status.showAll = $.cookie('showAll', revertBoolean);
        }
        if (status.showAll) {
            $topNav.find('#showAll').attr('checked', true)
                .prev().children('span').addClass('ON');
        }

        // 打开新窗口
        if ($.cookie('newTab') !== undefined) {
            status.newTab = $.cookie('newTab', revertBoolean);
        }
        if (status.newTab) {
            $topNav.find('#newTab').attr('checked', true)
                .prev().children('span').addClass('ON');
        }

        // 还原日本时区
        if ($.cookie('jpTime') !== undefined) {
            status.jpTime = $.cookie('jpTime', revertBoolean);
        }
        if (status.jpTime) {
            $topNav.find('#jpTime').attr('checked', true)
                .prev().children('span').addClass('ON');
        }
    }

    /**
     * 修改时区
     * @method changeTimeZone
     * @param {string} country 需要修改时区的国家的代码 'cn' 'jp'
     * @param {number} utc 时区 GMT '+8' '-8'
     */
    function changeTimeZone(country, utc) {
        console.log('change', country, utc);
        var offset = utc - status[country.toLowerCase() + 'TimeZone'];
        var timeStr = 'time' + country.toUpperCase();
        var weekDayStr = 'weekDay' + country.toUpperCase();
        var time, weekDay;
        for (i = 0; i < bgmData.length; i++) {
            time = +bgmData[i][timeStr].slice(0, 2);
            weekDay = +bgmData[i][weekDayStr];
            time = time + offset;
            if (time < 0) {
                time += 24;
                weekDay--;
            } else if (time >= 24) {
                time -= 24;
                weekDay++;
            }
            if (time < 10) {
                time = '0' + time;
            }
            if (weekDay < 0) {
                weekDay += 7;
            } else if (weekDay > 6) {
                weekDay -= 7;
            }
            bgmData[i][timeStr] = time + bgmData[i][timeStr].slice(2);
            bgmData[i][weekDayStr] = weekDay + '';
        }
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
                // 模拟点击排序按钮(中国时间)，声明为初始化
                $orderCN.trigger('click', [true]);
                // 模拟点击switcher按钮，声明为初始化
                // 如果为显示历史数据，则临时关闭自动切换功能
                if (status.history || status.showAll) {
                    $switcher.trigger('click', [7, true]);
                } else {
                    $switcher.trigger('click', [status.switch, true]);
                }

                // 过滤表格
                tableFilter();

                // 如果选项打开，设置链接为_blank
                if(status.newTab) {
                    changeTarget('_blank');
                }

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
            status.switch = (weekDayNow === 0 ? 7 : weekDayNow - 1);
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
    $switcher.click(function(event, index, init) {
            var $target = $(event.target);
            // 防止触到li以外的区域触发事件
            if (event.target !== this || init) {
                // 将所有选择器按钮的class清空
                $switcher.children().removeClass('selected');
                // 使用undefined判断，防止误判数字0
                if (index !== undefined) {
                    $switcher.find('li:eq(' + index + ')').addClass('selected');
                } else {
                    // 如果index参数不存在，使用event目标在ul中的序列代替
                    index = $target.index();
                    $target.addClass('selected');
                }
                // '周日'-->'weekDay:0'
                if (index === 6) {
                    query.weekDay = 0;
                // '全部'-->'weekDay:-1'
                } else if (index === 7) {
                    query.weekDay = -1;
                } else {
                    query.weekDay = index + 1;
                }
                if (index === 7) {
                    // 模拟点击排序按钮(日本时间)，声明为初始化，防止重复调用tableFilter
                    status.reverse = true;
                    $orderJP.trigger('click', [true]);
                } else {
                    status.reverse = true;
                    $orderCN.trigger('click', [true]);
                }
                // 如果不是初始化，过滤表格
                if (!init) {
                    tableFilter();
                }
            }
    });

    // 排序按钮绑定点击事件
    $orderCN.click(orderHandler('CN'));
    $orderJP.click(orderHandler('JP'));

    // 导航栏主按钮绑定hover事件
    $topNav.find('.menu').hover(function() {
        $(this).children('ul').show();
    }, function() {
        $(this).children('ul').hide();
    }).children('ul').hide();

    // 搜索框绑定keyup事件
    $search.keyup(function(event) {
        // 模拟按下switcher第七个按钮来显示所有番组
        $switcher.trigger('click', [7]);
        // 显示清除按钮
        $(this).next().show();
        query.title = $(this).val();
        tableFilter();
        // 按下ESC键
        if(event.keyCode === 27) {
            $(this).blur().val('');
            query.title = '';
            // 模拟点击switcher，传入保存的switch序号
            if (status.showAll || status.history) {
                $switcher.trigger('click', [7]);
            } else {
                $switcher.trigger('click', [status.switch]);
            }
            // 隐藏清除按钮
            $(this).next().hide();
        // 回车清空搜索栏
        } else if (event.keyCode === 8 && event.target.value.length <= 0) {
            if (status.showAll || status.history) {
                $switcher.trigger('click', [7]);
            } else {
                $switcher.trigger('click', [status.switch]);
            }
            // 隐藏清除按钮
            $(this).next().hide();
        }
    })
        // 清除按钮点击事件
        .next().hide().click(function() {
            $search.blur().val('');
            query.title = '';
            $switcher.trigger('click', [status.switch]);
            // 隐藏清除按钮
            $(this).hide();
        });


    // 只显示新番按钮绑定事件
    $('#showNew').change(function() {
        if (this.checked) {
            $(this).prev().children('span').addClass('ON');
        } else {
            $(this).prev().children('span').removeClass('ON');
        }
        query.showNew = this.checked;
        $.cookie('showNew', this.checked, {expires: 365});
        tableFilter();
    });

    // 显示全部按钮绑定事件
    $('#showAll').change(function() {
        if (this.checked) {
            $(this).prev().children('span').addClass('ON');
        } else {
            $(this).prev().children('span').removeClass('ON');
        }
        status.showAll = this.checked;
        if (this.checked) {
            $switcher.trigger('click', [7]);
        } else {
            $switcher.trigger('click', [status.switch]);
        }
        $.cookie('showAll', this.checked, {expires: 365});
        tableFilter();
    });

    // 打开新链接按钮绑定事件
    $('#newTab').change(function() {
        if (this.checked) {
            $(this).prev().children('span').addClass('ON');
        } else {
            $(this).prev().children('span').removeClass('ON');
        }
        status.newTab = this.checked;
        $.cookie('newTab', this.checked, {expires: 365});
        changeTarget((status.newTab ? '_blank' : '_self'));
    });

    // 还原日本时区绑定按钮
    $('#jpTime').change(function() {
        if (this.checked) {
            $(this).prev().children('span').addClass('ON');
        } else {
            $(this).prev().children('span').removeClass('ON');
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
});
