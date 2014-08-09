'use strict';

function getDomain(url) {
    var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;
    return url.match(re)[1].toLowerCase();
}

angular.module('BangumiList', ['ieFix', 'ipCookie'])
.controller('ListController', ['$scope', '$http', 'ipCookie', function($scope, $http, ipCookie) {
    var dateNow, weekDayNow, yearNow, monthNow;

    $scope.ipCookie = ipCookie;
    $scope.reversed = true;
    $scope.ordered = 'cn';
    $scope.navList = [{name: '周一', index: 1, order: 'cn'}, {name: '周二', index: 2, order: 'cn'}, {name: '周三', index: 3, order: 'cn'}, {name: '周四', index: 4, order: 'cn'}, {name: '周五', index: 5, order: 'cn'}, {name: '周六', index: 6, order: 'cn'}, {name: '周日', index: 0, order: 'cn'}, {name: '全部', index: undefined, order: 'jp'}];
    $scope.siteList = [{name: 'A站', domain: 'acfun', show: true}, {name: 'B站', domain: 'bilibili', show: true}, {name: '搜狐', domain: 'sohu', show: true}, {name: '优酷', domain: 'youku', show: true}, {name: '腾讯', domain: 'qq', show: true}, {name: '爱奇艺', domain: 'iqiyi', show: true}, {name: '乐视', domain: 'letv', show: true}, {name: 'PPTV', domain: 'pptv', show: true}, {name:'土豆', domain: 'tudou', show: true}, {name: '迅雷', domain: 'movie', show: true}];
    $scope.query = {};
    $scope.selectFlag = null;
    
    //use cookie to change siteList
    $scope.getSiteCookie = function(siteList) {
        return siteList.map(function(site) {
            var value = ipCookie(site.domain);
            if (value!==undefined) {
                site.show = value;
            }
           return site; 
        });
    };
    
    //check if all bangumi's show is true
    $scope.checkSiteList = function() {
        for(var i = 0, l = $scope.siteList.length; i < l; i++) {
            if($scope.siteList[i].show === false) {
                $scope.selectFlag = true;
                break;
            }
            $scope.selectFlag = false;
        }
    };
    
    //for select all button
    $scope.selectAll = function(flag) {
        for(var i = 0, l = $scope.siteList.length; i < l; i++) {
           $scope.siteList[i].show = flag; 
           ipCookie($scope.siteList[i].domain,$scope.siteList[i].show,{expires:365});
        }
        $scope.selectFlag = !$scope.selectFlag;
    };

    //order bangumi list
    $scope.order = function(items, target, reverseFlag) {
        var weekDay = 'weekDay' + target.toUpperCase(),
        time = 'time' + target.toUpperCase();

        $scope.reversed = !reverseFlag;
        $scope.ordered = target;
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
                return reverseFlag * ((a[weekDay] === 0 ? 7 : a[weekDay]) - 
                                        (b[weekDay] === 0 ? 7 : b[weekDay]));
            }
        });
    };

    //turn current month to bangumi season
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

    //use year month to get json file path
    $scope.getJsonPath = function(year, month, archive) {
        for (var file in archive) {
            if (archive[file].year == year) {
                var months = archive[file].months;
                $scope.yearRead = archive[file].year;
                $scope.monthRead = $scope.monthToSeason(month); 
                for (var i = 0, l = months.length; i < l; i++ ) {
                    if ($scope.monthRead === months[i].month && months[i].json) {
                        return months[i].json;
                    }
                }
                if ($scope.monthRead === 1) {
                    //console.log('failed to get json path, try year - 1, 10');
                    return $scope.getJsonPath(year - 1, 10, archive);
                } else {
                    //console.log('failed to get json path, try year, month - 3');
                    return $scope.getJsonPath(year, month - 3, archive);
                }
            }
        }
        //console.log('failed to get json path, try year - 1');
        return $scope.getJsonPath(year - 1, month, archive);
    };

    //use $http to get bangumi data
    $scope.readBangumi = function(filePath, order, reverse) {
        //ngProgressLite.start();
        $http.get(filePath)
            .success(function(data) {
                $scope.bangumis = $scope.order(data, order, reverse);
                $scope.query.titleCN = '';
                //ngProgressLite.done();
            })
            .error(function(data, status) {
                alert('读取' + filePath + '出错\n错误代码:' + status + '\n请联系wxt2005#gmail.com\n或在Twitter上@wxt2005');   
            });
    };

    //use $http to get archive data, then init page
    $http.get('json/archive.json')
        .success(function(data, status, headers) {
            //if server time didn't exist, use local time
            dateNow = headers('Date') ? new Date(headers('Date')) : new Date();
            weekDayNow = dateNow.getDay();
            yearNow = dateNow.getFullYear();
            monthNow = dateNow.getMonth() + 1;
            $scope.query.weekDayCN = weekDayNow;

            for (var file in data) {
                data[file].show = data[file].year == yearNow ? true : false;
            }
            $scope.archive = data;
            $scope.readBangumi($scope.getJsonPath(yearNow, monthNow, data), $scope.ordered, !$scope.reversed);
        })
        .error(function(data, status) {
            alert('读取archive.json出错\n错误代码:' + status + '\n请联系wxt2005#gmail.com\n或在Twitter上@wxt2005');
        });

    $scope.siteList = $scope.getSiteCookie($scope.siteList);
    $scope.query.newBgm = ipCookie('newOnly');
    $scope.checkSiteList();
}])

//nav bar template
/*.directive('navBar', function() {
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
})*/

//filter used to format time data
.filter('selectAllButton', function() {
    return function(flag) {
        return flag ? '全选' : '全不选';
    };
})

//filter used to format weekday data
.filter('weekday', function() {
    var weekDayList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return function(weekDayNum) {
        return weekDayList[weekDayNum];
    };
})

//filter used to format time data
.filter('time', function() {
    return function(originTime) {
        return originTime ? originTime.slice(0,2) + ':' + originTime.slice(2) : '(预计)';
    };
})

//filter used to format month data
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

//filter used to format bangumi link
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
            default:
                return '未知';
        }
    };
})

//filter use to choose and order onair site
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
    };
});

