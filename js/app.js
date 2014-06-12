(function(){
    'use strict';

    var app = angular.module('BangumiList', ['ieFix']);

    app.controller('ListController', ['$scope', '$http', function($scope, $http) {
        $scope.weekDayNum = (new Date()).getDay();
        $scope.reversed = false;
        $scope.ordered = 'jp';
        $scope.query = {weekDayCN: $scope.weekDayNum};

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

        //use $http to get json data
        $http.get('json/bangumi-1404.json').success(function(data) {
            $scope.bangumis = $scope.order(data, 'jp', $scope.reversed);
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

    //filter used to format bangumi link
    app.filter('onair', function() {
        var re = /^https{0,}:\/\/\w+\.(\w+)\.\w+/i;
        return function(link) {
            switch (link.match(re)[1].toLowerCase()) {
                case "youku":
                    return "优酷";     
                case "sohu":
                    return "搜狐";
                case "qq":
                    return "腾讯";
                case "iqiyi":
                    return "爱奇艺";
                case "letv":
                    return "乐视";
                case "pptv":
                    return "PPTV";
                case "tudou":
                    return "土豆";
                case "bilibili":
                    return "B站";
                case "acfun":
                    return "A站";
                default:
                    return "未知";
            }
        };
    });
})();
