'use strict';

//用于获取链接的域名
function getDomain(url) {
    var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;
    if (url !== '#') {
        return url.match(re)[1].toLowerCase();
    } else {
        return 'empty';
    }
}

angular.module('BangumiList', ['ieFix', 'ipCookie'])
.controller('ListController', ['$scope', '$http', 'ipCookie', function($scope, $http, ipCookie) {
    var dateNow, weekDayNow, yearNow, monthNow;
    var i = 0, l = 0;

    //选择器的tab列表
    $scope.switcherList = [
        {name: '周一', index: 1, order: 'cn'},
        {name: '周二', index: 2, order: 'cn'},
        {name: '周三', index: 3, order: 'cn'},
        {name: '周四', index: 4, order: 'cn'},
        {name: '周五', index: 5, order: 'cn'},
        {name: '周六', index: 6, order: 'cn'},
        {name: '周日', index: 0, order: 'cn'},
        {name: '全部', index: -1, order: 'jp'}
    ];

    //支持的站点列表
    $scope.siteList = [
        {name: 'A站', domain: 'acfun'}, 
        {name: 'B站', domain: 'bilibili'}, 
        {name: '搜狐', domain: 'sohu'}, 
        {name: '优酷', domain: 'youku'}, 
        {name: '腾讯', domain: 'qq'},
        {name: '爱奇艺', domain: 'iqiyi'},
        {name: '乐视', domain: 'letv'},
        {name: 'PPTV', domain: 'pptv'},
        {name: '土豆', domain: 'tudou'},
        {name: '迅雷', domain: 'movie'}
    ];

    //查询用
    $scope.query = {
        'nextTime': 24,
        'weekDayCN': -1,
        'titleCN': '',
        'showNew': false
    };

    //APP设置
    $scope.setting = {
        'nextTimeMax': 24,   
        'nextTimeMin': 20,
        'linkTarget': '_self',
        'showAll': false,
        'newTab': false
    };

    //APP状态
    $scope.status = {
        'nextTime': '',
        'error': false,
        'errorMsg': '',
        'reversed': true,
        'ordered': 'cn',
        'status.lastModifieded': '',
        'selectAll': true,
        'shadow': false,
        'showAll': false,
        'menu': {
            'archive': false,
            'display': false,
            'sites': false
        }
    };

    //切换a标签的target
    $scope.changeTarget = function() {
        if($scope.setting.newTab) {
            $scope.status.linkTarget = '_blank';
        } else {
            $scope.status.linkTarget = '_self';
        }
        ipCookie('newTab', $scope.setting.newTab, {expires: 365});
    };

    //清除所有cookies
    $scope.clearCookie = function() {
        var keys = document.cookie.match(/[^ =;]+(?=\=)/g);
        if (keys) {
            for (i = 0, l = keys.length; i < l; i++) {
                ipCookie.remove(keys[i]);
            }
            $scope.query.nextTime = 24;
            $scope.checkNextTime();
            $scope.query.showNew = false;
            $scope.setting.showAll = false;
            for(i = 0, l = $scope.siteList.length; i < l; i++) {
                $scope.siteList[i].show = true;
            }
            $scope.checkSiteList();
            $scope.setting.newTab = false;
            $scope.changeTarget();
        }
    };

    //播放地址的控制器
    $scope.linkHandler = function(site, event) {
        if(site === "#") {
            if(event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }
    };

    //搜索框清空后恢复原有状态
    $scope.resumeSearch = function() {
        $scope.query.titleCN = '';
        if (!$scope.setting.showAll && !$scope.status.showAll) {
            $scope.query.weekDayCN = weekDayNow;
        }
    };

    //搜索栏的控制器
    $scope.searchHandler = function(event) {
        if ($scope.query.weekDayCN !== -1) {
            $scope.query.weekDayCN = -1;
        }
        if(event.keyCode === 27 || (event.keyCode === 8 && event.target.value.length <= 1)) {
            $scope.resumeSearch();
        }
    };

    //星期选择器的控制器
    $scope.switcherHandler = function(index, order) {
        $scope.query.titleCN = '';
        $scope.query.weekDayCN = index;
        $scope.order($scope.bangumis, order, false);
        if(index === -1) {
            $scope.status.showAll = true;
        } else {
            $scope.status.showAll = false;
        }
    };

    //过滤番组数据
    $scope.bgmFilter = function(item) {
        var flag = false;
        if ($scope.query.weekDayCN === -1 ) {
            flag = true;
        } else if ((item.weekDayCN === $scope.query.weekDayCN && 
                    +item.timeCN.slice(0, 2) < $scope.query.nextTime) || 
                        ((item.weekDayCN === 6 ? 0 : item.weekDayCN + 1) === $scope.query.weekDayCN && 
                         +item.timeCN.slice(0,2) >= $scope.query.nextTime)) {
            flag = true;
        } 
        if ($scope.query.showNew && item.newBgm === false) {
            flag = false;
        }
        if ($scope.query.titleCN) {
            var re = new RegExp($scope.query.titleCN, 'i');
            if (!re.test(item.titleCN)) {
                flag = false;
            }
        }
        return flag;
    };

    //小时选择按钮的控制器
    $scope.hourSelectHandler = function(flag) {
        if (flag === '+') {
            //$scope.query.nextTime = ($scope.query.nextTime === $scope.setting.nextTimeMax ? $scope.setting.nextTimeMax : $scope.query.nextTime + 1);
            if ($scope.query.nextTime >= $scope.setting.nextTimeMax) {
                $scope.query.nextTime = $scope.setting.nextTimeMax;
            } else {
                $scope.query.nextTime = $scope.query.nextTime + 1;
            }
            $scope.checkNextTime();
        } else if (flag === '-') {
            //$scope.query.nextTime = ($scope.query.nextTime === $scope.setting.nextTimeMin ? $scope.setting.nextTimeMin : $scope.query.nextTime - 1);
            if ($scope.query.nextTime <= $scope.setting.nextTimeMin) {
                $scope.query.nextTime = $scope.setting.nextTimeMin;
            } else {
                $scope.query.nextTime = $scope.query.nextTime - 1;
            }
            $scope.checkNextTime();
        }
        ipCookie('nextTime', $scope.query.nextTime, {expires:365});
    };

    //检查控制器的时间是否超过上下限
    $scope.checkNextTime = function() {
        if ($scope.query.nextTime === $scope.setting.nextTimeMax) {
            $scope.status.nextTime = 'max';
        } else if ($scope.query.nextTime === $scope.setting.nextTimeMin) { 
            $scope.status.nextTime = 'min';
        } else {
            $scope.status.nextTime = '';
        }
    };

    //从cookie中获取站点是否显示
    $scope.getSiteCookie = function() {
        return $scope.siteList.map(function(site) {
            var value = ipCookie(site.domain);
            if (value !== undefined) {
                site.show = value;
            } else {
                site.show = true;
            }
            return site; 
        });
    };

    //站点开关的控制器
    $scope.siteHandler = function(domain, show) {
        ipCookie(domain, show, {expires: 365});
        $scope.checkSiteList();
    };

    //只显示新番按钮的控制器
    $scope.newOnlyHandler = function() {
        ipCookie('showNew', $scope.query.showNew, {expires: 365});
    };

    //直接显示全部按钮的控制器
    $scope.showAllHandler = function() {
        $scope.status.showAll = $scope.setting.showAll;
        if ($scope.setting.showAll) {
            $scope.query.weekDayCN = -1;
            $scope.order($scope.bangumis, 'jp', false);
        } else {
            $scope.query.weekDayCN = weekDayNow;
            $scope.order($scope.bangumis, 'cn', false);
        }
        ipCookie('showAll', $scope.setting.showAll, {expires: 365});
    };

    //归档按钮的控制器
    $scope.archiveHandler = function(year, month) {
        $scope.readBgm($scope.getJsonPath(year, month, $scope.archive), 'jp', false);
        $scope.query.weekDayCN = -1;
        $scope.setting.showAll = true;
    };

    //页面遮罩的控制器
    $scope.status.shadowHandler = function() {
        $scope.status.menu.archive = false;
        $scope.status.menu.display = false;
        $scope.status.menu.display = false;
        $scope.status.shadow = false;
    };

    //顶部菜单按钮的控制器
    $scope.topMenuHandler = function(menuName, flag) {
        for (var item in $scope.status.menu) {
            item = false;
        }
        $scope.status.menu[menuName] = !$scope.status.menu[menuName];
        if(!flag) {
            $scope.status.shadow = !$scope.status.shadow;
        }
    };

    //检查是否所有站点都被勾选，判断是否显示全选按钮
    $scope.checkSiteList = function() {
        $scope.status.selectAll = false;
        for(i = 0, l = $scope.siteList.length; i < l; i++) {
            if($scope.siteList[i].show === false) {
                $scope.status.selectAll = true;
                break;
            }
        }
    };

    //全选按钮的控制器
    $scope.selectAllHandler = function(flag) {
        for(i = 0, l = $scope.siteList.length; i < l; i++) {
            $scope.siteList[i].show = flag; 
            ipCookie($scope.siteList[i].domain,$scope.siteList[i].show,{expires:365});
        }
        $scope.status.selectAll = !$scope.status.selectAll;
    };

    //排序番组数据
    $scope.order = function(items, target, reverseFlag) {
        var weekDay = 'weekDay' + target.toUpperCase(),
        time = 'time' + target.toUpperCase();

        $scope.status.reversed = !reverseFlag;
        $scope.status.ordered = target;
        reverseFlag = reverseFlag ? -1 : 1;

        return items.sort(function(a, b) {
            if (a[weekDay] === b[weekDay]) {
                if (a[time] === '') {
                    return reverseFlag * -1;
                } else if (b[time] === '') {
                    return reverseFlag * 1;
                } else {
                    return reverseFlag * (a[time] - b[time]);
                }
            } else {
                return reverseFlag * (a[weekDay] - b[weekDay]);
            }
        });
    };

    //将当前月份转换为季度
    $scope.monthToSeason = function(month) {
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
    };

    //通过年份和月份得到数据文件的路径
    $scope.getJsonPath = function(year, month, archive) {
        for (var file in archive) {
            if (archive[file].year == year) {
                var months = archive[file].months;
                $scope.yearRead = archive[file].year;
                $scope.monthRead = $scope.monthToSeason(month); 
                for (i = 0, l = months.length; i < l; i++ ) {
                    if ($scope.monthRead === months[i].month && months[i].json) {
                        return months[i].json;
                    }
                }
                if ($scope.monthRead === 1) {
                    return $scope.getJsonPath(year - 1, 10, archive);
                } else {
                    return $scope.getJsonPath(year, month - 3, archive);
                }
            }
        }
        return $scope.getJsonPath(year - 1, month, archive);
    };

    //用于获取番组数据
    $scope.readBgm = function(filePath, order, reverse) {
        $http.get(filePath)
        .success(function(data, status, headers) {
            $scope.bangumis = $scope.order(data, order, reverse);
            $scope.query.titleCN = '';
            //获取数据文件最后修改时间
            if (headers('Last-Modified')) {
                var tempDate = new Date(headers('Last-Modified'));
                $scope.status.lastModifieded = '数据更新日期: ' + tempDate.getFullYear() + '年' + 
                    (tempDate.getMonth() + 1) + '月' + tempDate.getDate() + '日';
            }
        })
        .error(function(data, status) {
            $scope.status.error = true;
            $scope.status.errorMsg = '读取 ' + filePath + ' 出错. 错误代码: ' + status + '. 请点击上方的“提交问题”按钮.';
        });
    };

    //获得归档内容，并初始化页面
    $http.get('json/archive.json')
    .success(function(data, status, headers) {
        //如果无法获取服务器时间，则使用本地时间
        dateNow = headers('Date') ? new Date(headers('Date')) : new Date();
        weekDayNow = dateNow.getDay();
        yearNow = dateNow.getFullYear();
        monthNow = dateNow.getMonth() + 1;
        $scope.query.weekDayCN = weekDayNow;

        for (var file in data) {
            data[file].show = data[file].year == yearNow ? true : false;
        }
        $scope.archive = data;

        $scope.setting.showAll = ipCookie('showAll') || false;
        if ($scope.setting.showAll) {
            $scope.readBgm($scope.getJsonPath(yearNow, monthNow, data), 'jp', false);
            $scope.query.weekDayCN = -1;
        } else {
            $scope.readBgm($scope.getJsonPath(yearNow, monthNow, data), $scope.status.ordered, !$scope.status.reversed);
        }
        
        $scope.siteList = $scope.getSiteCookie();
        $scope.checkSiteList();

        $scope.query.showNew = ipCookie('showNew') || false;

        $scope.query.nextTime = ipCookie('nextTime') || 24;
        $scope.checkNextTime();

        $scope.setting.newTab = ipCookie('newTab') || false;
        $scope.changeTarget();
    })
    .error(function(data, status) {
        $scope.status.error = true;
        $scope.status.errorMsg = '读取 archive.json 出错. 错误代码: ' + status + '. 请点击上方的“提交问题”按钮.';
    });
}])

/*
//nav bar template
.directive('navBar', function() {
return {
restrict: 'E',
templateUrl: 'nav.html'
};
})

//table template
.directive('itemList', function() {
return {
restrict: 'E',
templateUrl: 'list.html'
};
})

//side bar template
.directive('sideBar', function() {
return {
restrict: 'E',
templateUrl: 'sidebar.html'
};
})

//used to filter bangumi data
.filter('bgmFilter', '$scope', function($scope) {
return function(item) {
if (item.weekDayCN === $scope.query.weekDayCN) {
return true;
} else {
return false;
}
};
})*/


//显示全选还是全不选
.filter('selectAllButton', function() {
    return function(flag) {
        return flag ? '全选' : '全不选';
    };
})

//格式化星期名称
.filter('weekday', function() {
    var weekDayList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return function(weekDayNum) {
        return weekDayList[weekDayNum];
    };
})

//格式化播放时间
.filter('time', function() {
    return function(originTime) {
        return originTime ? originTime.slice(0,2) + ':' + originTime.slice(2) : '(预计)';
    };
})

//将数字月份转化为中文月份
.filter('monthCN', function() {
    return function(originMonth) {
        switch (+originMonth) {
            case 1:
                return '一月';
            case 4:
                return '四月';
            case 7:
                return '七月';
            case 10:
                return '十月';
            default:
                throw new Error('failed to convert month');
        }
    };
})

//将站点网址转化为站点名称
.filter('onair', function() {
    return function(link) {
        switch (getDomain(link)) {
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
    };
})

//过滤并排列站点列表
.filter('linkFilter', function() {
    return function(array, siteList) {
        var nArray = [];
        nArray = array.filter(function(item) {
            for (var i = 0, l = siteList.length; i < l; i++) {
                if (siteList[i].domain === getDomain(item)) {
                    return siteList[i].show;
                }
            }
            return false;
        });
        if (nArray.length !== 0) {
            return nArray.sort(function(a, b) {
                a = getDomain(a);
                b = getDomain(b);
                if (a < b) {
                    return -1;
                } else if (a > b) {
                    return 1;
                } else {
                    return 0;
                }
            });
        } else {
            return ['#'];
        }
    };
});

