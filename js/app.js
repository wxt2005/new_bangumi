'use strict';

var app = angular.module('BangumiList', []);

app.controller('ListController', ['$scope', '$http', function($scope, $http) {
    $scope.reverse = false;
    $scope.ordered = 'jp';

    //order bangumi list
    $scope.order = function(items, target, reverse) {
        var weekDay = 'weekDay' + target.toUpperCase(),
            time = 'time' + target.toUpperCase();
        reverse = reverse ? -1 : 1;
        
        return items.sort(function(a, b) {
            if (a[weekDay] === b[weekDay]) {
                return reverse * (a[time] - b[time]);
            } else {
                return reverse * ((a[weekDay] === 0 ? 7 : a[weekDay]) - 
                                  (b[weekDay] === 0 ? 7 : b[weekDay]));
            }
       });
    };

    $http.get('json/bangumi-1404.json').success(function(data) {
                $scope.bangumis = $scope.order(data, 'jp', false);
              });
}]);

app.filter('weekday', function() {
    var weekDayList = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return function(weekDayNum) {
        return weekDayList[weekDayNum];
    };
});

app.filter('time', function() {
    return function(originTime) {
        return originTime ? originTime.slice(0,2) + ':' + originTime.slice(2) : '';
    };
});

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


