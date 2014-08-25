'use strict';
/* global $ */
/* global console */
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

    var archive = null,
        bgmData = null;

    var status = {
        reverse: true,
        switch: 7,
        lastModified: ''
    };

    //不分辨大小写的:contains
    $.expr[":"].containsI = $.expr.createPseudo(function(arg) {
        return function( elem ) {
            return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });

    //格式化星期几
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

    //格式化时间
    function formatTime(time) {
        return time ? time.slice(0, 2) + ':' + time.slice(2) : '(预计)';
    }

    //转换两种星期顺序
    function convertWeekDay(index, flag) {
        if (flag) {
            return index >= 6 ? 0 : index + 1;
        } else {
            return index <= 0 ? 7 : index - 1;
        }
    }

    //将当前月份转换为季度
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

    //用于获取链接的域名
    function getDomain(url) {
        var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;
        if (url !== '#') {
            return url.match(re)[1].toLowerCase();
        } else {
            return 'empty';
        }
    }

    //通过年份和月份得到数据文件的路径
    function getPath(year, month, archive) {
        for (var file in archive) {
            if (archive[file].year == year) {
                var months = archive[file].months;
                yearRead = archive[file].year;
                monthRead = monthToSeason(month);
                for (i = 0; i < months.length; i++ ) {
                    if (monthRead === months[i].month && months[i].json) {
                        return months[i].json;
                    }
                }
                if (monthRead === 1) {
                    return getPath(year - 1, 10, archive);
                } else {
                    return getPath(year, month - 3, archive);
                }
            }
        }
        return getPath(year - 1, month, archive);
    }

    //排序链接
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

    //格式化链接
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
            case 'empty':
                return '暂无';
            default:
                return '未知';
        }
    }

    //将trArray中的HTML插入表格
    function showTable(HTML) {
        if ($tbody.find('tr').length) {
            $tbody.find('tr').remove();
        }
        $tbody.append(HTML);
        $switcher.trigger('click', [status.switch]);
    }

    //控制排序按钮
    function orderHandler(country) {
        return function() {
            $(this).parents('tr').find('p').removeClass('ordered');
            $(this).addClass('ordered');
            sortData(bgmData, !status.reverse, country);
            showTable(dataToHTML(bgmData));
        };
    }


    //data数列排序
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
            if(a[weekDay] === b[weekDay]) {
                return flag * ((a[time] === '' ? -1 : +a[time]) -
                    (b[time] === '' ? -1 : +b[time]));
            } else {
                return flag * (a[weekDay] - b[weekDay]);
            }
        });
    }

    //将data数列转换为HTML
    function dataToHTML(data) {
        var trHTML = '';
        for (i = 0; i < data.length; i++) {
            trHTML += '<tr><td><a href="' + data[i].officalSite + '" title="' +
                data[i].titleJP + (data[i].newBgm ? '" class="new">' : '">') +
                data[i].titleCN + '</a></td><td><span class="weekDay">' +
                formatWeekDay(data[i].weekDayJP, 'cn') + '</span><span class="time">' +
                formatTime(data[i].timeJP) + '</span></td><td><span class="weekDay">' +
                formatWeekDay(data[i].weekDayCN, 'cn') + '</span><span class="time">' +
                formatTime(data[i].timeCN) + '</span></td>';
            if (data[i].onAirSite.length) {

                //将链接排序
                data[i].onAirSite.sort(sortLink);

                trHTML += '<td><ul class="link-list">';
                for (j = 0; j < data[i].onAirSite.length; j++) {
                    if (j === data[i].onAirSite.length - 1) {
                        trHTML +=  '<li class="lastLink">';
                    } else {
                        trHTML += '<li>';
                    }
                    trHTML += '<a href="' + data[i].onAirSite[j] + '" target="_self">' +
                    formatLink(data[i].onAirSite[j]) + '</a></li>';
                }
                trHTML += '</ul></td></tr>';
            } else {
                trHTML += '<td class="empty">暂无</td></tr>';
            }
        }
        return trHTML;
    }

    //读取bangumi的json
    function getBgmJSON(path) {
        $.ajax({
            url: path,
            success: function(data, stat, xhr) {
                bgmData = data;
                //初始化选择器
                $orderCN.trigger('click');
                //获取数据文件最后修改时间
                if (xhr.getResponseHeader('Last-Modified')) {
                    var tempDate = new Date(xhr.getResponseHeader('Last-Modified'));
                    status.lastModified = '数据更新日期: ' + tempDate.getFullYear() + '年' +
                        (tempDate.getMonth() + 1) + '月' + tempDate.getDate() + '日';
                }
                //更新标题
                $('#header h1').text(yearRead + '年' + monthRead + '月番组');
                //更新番组数目
                $('#header .total').text('当季共有' + data.length + '部番组');
                //更新最后修改时间
                $('#header .lastModified').text(status.lastModified);
            },
            error: function(xhr, stat, error) {
                $tbody.append('<tr><td colspan="4">读取 ' + path + ' 出错，错误代码：' +
                xhr.status + ' ' + error + '</td></tr>');
            }
        });
    }

    //读取archive
    $.ajax({
        url: 'json/archive.json',
        success: function(data, stat, xhr) {
            dateNow = xhr.getResponseHeader('Date') ? new Date(xhr.getResponseHeader('Date')) : new Date();
            yearNow = dateNow.getFullYear();
            monthNow = dateNow.getMonth() + 1;
            weekDayNow = dateNow.getDay();

            status.switch = convertWeekDay(weekDayNow, false);

            archive = data;

            getBgmJSON(getPath(yearNow, monthNow, data));
        },
        error: function(xhr, stat, error) {
            $tbody.append('<tr><td colspan="4">读取 json/archive.json 出错，错误代码：' +
            xhr.status + ' ' + error + '</td></tr>');
        }
    });

    //选择器点击事件
    $switcher.click(function(event, index, flag) {
            console.log(index);
            var $target = $(event.target);
            //将所有选择器按钮的class清空
            $switcher.children().removeClass('selected');
            if (index !== undefined) {
                //给指定的按钮添加class
                $switcher.find('li:eq(' + index + ')').addClass('selected');
            } else {
                //如果index参数不存在，使用event目标在ul中的序列代替
                index = $target.index();
                //给指定的按钮添加class
                $target.addClass('selected');
            }
            if (!flag) {
                status.switch = index;
            }
            if (index === 7) {
                //点击全部时，显示所有条t目
                $tbody.children().show();
            } else {
                //将所有条目隐藏，然后显示符合的条目
                $tbody.find('tr').hide()
                    .find('td:eq(2)').filter(':contains("' + weekDayCN[convertWeekDay(index, true)] + '")')
                    .parent().show();
            }
    });

    $orderCN.click(orderHandler('CN'));
    $orderJP.click(orderHandler('JP'));

    //搜索框事件
    $search.keyup(function(event) {
        $switcher.trigger('click', [7, true]);
        $(this).next().show();
        $tbody.find('tr').hide()
            .find('td:eq(0)').filter(':containsI("' + $(this).val() + '")')
            .parent().show();
        if(event.keyCode === 27) {
            $(this).blur().val('');
            $switcher.trigger('click', [status.switch]);
            $(this).next().hide();
        } else if (event.keyCode === 8 && event.target.value.length <= 0) {
            $switcher.trigger('click', [status.switch]);
            $(this).next().hide();
        }
    })
        .next().hide().click(function() {
            $search.blur().val('');
            $switcher.trigger('click', [status.switch]);
            $(this).hide();
        });
});
