'use strict';
/* global $ */
/* global console */
/* jshint -W097 */

$(function() {
    var i = 0, j = 0;
    var weekDayCN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var weekDayJP = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];

    var $tbody = $('#bangumi_list');
    var $switcher = $('#switcher');

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
    function convertWeekDay(index) {
        return index >= 6 ? 0 : index + 1;
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

    $.getJSON('json/bangumi-1407.json', function(data) {
        var tbodyHTML = '';
        for (i = 0; i < data.length; i++) {
            tbodyHTML += '<tr><td><a href="' + data[i].officalSite + '" title="' +
            data[i].titleJP + (data[i].newBgm ? '" class="new">' : '">') + data[i].titleCN +
            '</a></td><td><span class="weekDay">' + formatWeekDay(data[i].weekDayJP, 'cn') +
            '</span><span class="time">' + formatTime(data[i].timeJP) + '</span></td><td><span class="weekDay">' +
            formatWeekDay(data[i].weekDayCN, 'cn') + '</span><span class="time">' +
            formatTime(data[i].timeCN) + '</span></td>';
            if (data[i].onAirSite.length) {
                tbodyHTML += '<td><ul class="link-list">';
                for (j = 0; j < data[i].onAirSite.length; j++) {
                    if (j === data[i].onAirSite.length - 1) {
                        tbodyHTML +=  '<li class="lastLink">';
                    } else {
                        tbodyHTML += '<li>';
                    }
                    tbodyHTML += '<a href="' + data[i].onAirSite[j] + '" target="_self">' +
                    formatLink(data[i].onAirSite[j]) + '</a></li>';
                }
                tbodyHTML += '</ul></td></tr>';
            } else {
                tbodyHTML += '<td class="empty">暂无</td></tr>';
            }
        }
        //将HTML插入表格
        $tbody.append(tbodyHTML);
        //初始化选择器
        $switcher.trigger('click', [1]);
    });

    //选择器点击事件
    $switcher.click(function(event, index) {
            var $target = $(event.target);
            //将所有选择器按钮的class清空
            $(this).children().removeClass('selected');
            if (index) {
                //给指定的按钮添加class
                $(this).find('li:eq(' + index + ')').addClass('selected');
            } else {
                //如果index参数不存在，使用event目标在ul中的序列代替
                index = $target.index();
                //给指定的按钮添加class
                $target.addClass('selected');
            }
            if (index === 7) {
                //点击全部时，显示所有条t目
                $tbody.children().show();
            } else {
                //将所有条目隐藏，然后显示符合的条目
                $tbody.find('tr').hide()
                .find('td:eq(2)').filter(':contains("' + weekDayCN[convertWeekDay(index)] + '")')
                .parent().show();
            }
    });
});
