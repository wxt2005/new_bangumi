(function() {
    'use strict';

    var ieFix = angular.module('ieFix', []);
    //fix IE7- bugs
    if (navigator.appName === "Microsoft Internet Explorer" && 
        +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 8) {

        //fix IE7- $sce:iequirks error
        ieFix.config(function($sceProvider) {
            $sceProvider.enabled(false);
        });

        //fix IE7- ng-class bug
        ieFix.directive('classFix', function() {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) { 
                    scope.$watch(function() {
                        return element[0]['class'];
                    }, function() {
                        element[0].className = element[0]['class'] ? element[0]['class'] : '';
                    });
                }
            };
        }); 
    }

    //fix IE8- bugs
    if (navigator.appName === "Microsoft Internet Explorer" && 
        +navigator.appVersion.match(/MSIE\s(\d+)/)[1] < 9) {

        //fix IE8- transparent display error
        ieFix.directive('spanFix', function() {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) { 
                    element[0].className = 'hide';
                }
            };
        });
    }
})();
