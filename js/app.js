'use strict';

var app = angular.module('BangumiList', []);

app.controller('ListController', ['$scope', '$http', function($scope, $http) {
    $http.get('json/bangumi-1404.json').success(function(data) {
                $scope.bangumis = data;
              });
}]);

app.filter('weekday', function() {
    var weekDayList = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return function(weekDayNum) {
        return weekDayList[weekDayNum];
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


