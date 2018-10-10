(function () {
    'use strict';

    angular.module('miniProj.directives', []);
    angular.module('miniProj.filters', []);
    angular.module('miniProj.services', []);
    angular.module('miniProj.templates', []);
    angular.module('miniProj', [
        'miniProj.directives',
        'miniProj.services',
        'miniProj.filters',
        'miniProj.templates',
        'ngRoute',
        'ngCookies',
        'ngMaterial',
        'ui.bootstrap',
        'chart.js'
    ]);

    /* set route title */
    angular.module('miniProj').run(['$location', '$rootScope', '$route',
        function ($location, $rootScope, $route) {

            $rootScope.$on('$routeChangeSuccess', function () {
                if (angular.isDefined($route.current.title)) {
                    document.title = $route.current.title;
                } else {
                    document.title = "";
                }
            });
        }]);

})();

