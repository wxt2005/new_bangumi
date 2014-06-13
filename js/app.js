(function(){
    'use strict';

    var app = angular.module('BangumiList', ['ieFix']);

    app.controller('ListController', ['$scope', '$http', function($scope, $http) {
        $scope.dateNow = new Date();
        $scope.weekDayNum = $scope.dateNow.getDay();
        $scope.yearNow = $scope.dateNow.getFullYear();
        $scope.monthNow = $scope.dateNow.getMonth() + 1;
        $scope.reversed = false;
        $scope.ordered = 'jp';
        $scope.query = {weekDayCN: $scope.weekDayNum};
        $scope.mArr = [1, 4, 7, 10];

        //order bangumi list
        $scope.order = function(items, target, reverseFlag) {
            var weekDay = 'weekDay' + target.toUpperCase(),
            time = 'time' + target.toUpperCase();

            $scope.reversed = !reverseFlag;
            $scope.ordered = target;
            reverseFlag = reverseFlag ? -1 : 1;

            return items.sort(function(a, b) {
                if (a[weekDay] === b[weekDay]) {
                    return reverseFlag * (a[time] - b[time]);
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
                    return archive[file].months[$scope.mArr.indexOf($scope.monthToSeason(month))].json;     
                }
            }
            throw new Error('failed to get json path');
        };

        //use $http to get bangumi data
        $scope.readBangumi = function(filePath) {
            $http.get(filePath).success(function(data) {
                $scope.bangumis = $scope.order(data, $scope.ordered, !$scope.reversed);
            });
        };

        //use $http to get archive data, then init page
        $http.get('json/archive.json').success(function(data) {
            for (var file in data) {
                data[file].show = data[file].year == $scope.yearNow ? true : false;
            }
            $scope.archive = data;
            $scope.readBangumi($scope.getJsonPath($scope.yearNow, $scope.monthNow, data));
        });

    }]);

    //nav bar template
    app.directive('navBar', function() {
        return {
            restrict: 'E',
            templateUrl: 'nav.html'
        };
    });

    //table template
    app.directive('itemList', function() {
        return {
            restrict: 'E',
            templateUrl: 'list.html'
        };
    });

    //side bar template
    app.directive('sideBar', function() {
        return {
            restrict: 'E',
            templateUrl: 'sidebar.html'
        };
    });
    
    //filter used to format weekday data
    app.filter('weekday', function() {
        var weekDayList = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        return function(weekDayNum) {
            return weekDayList[weekDayNum];
        };
    });

    //filter used to format time data
    app.filter('time', function() {
        return function(originTime) {
            return originTime ? originTime.slice(0,2) + ':' + originTime.slice(2) : '(预计)';
        };
    });

    //filter used to format month data
    app.filter('monthCN', function() {
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
    });

    //filter used to format bangumi link
    app.filter('onair', function() {
        var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;
        return function(link) {
            switch (link.match(re)[1].toLowerCase()) {
                case "youku":
                    return "优酷 ";     
                case "sohu":
                    return "搜狐 ";
                case "qq":
                    return "腾讯 ";
                case "iqiyi":
                    return "爱奇艺 ";
                case "letv":
                    return "乐视 ";
                case "pptv":
                    return "PPTV ";
                case "tudou":
                    return "土豆 ";
                case "bilibili":
                    return "B站 ";
                case "acfun":
                    return "A站 ";
                default:
                    return "未知 ";
            }
        };
    });
})();
