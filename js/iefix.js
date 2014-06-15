//if Array.prototype.indexOf didn't exist, then add one
if (typeof Array.prototype.indexOf !== 'function') {
    Array.prototype.indexOf = function(target) {
        if (target) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (this[i] == target) {
                    return i;
                }
            }
            return -1;
        } else {
            throw new Error('illegal target');
        }
    };
}

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
                        if (element[0]['class']) {
                            element[0].className = element[0]['class'];
                        } else {
                            element[0].className = '';
                        }
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
