(function () {
    'use strict';

    /**
     * Configure the Routes
     */
    angular.module('miniProj')
        .config(routesConfig);

    routesConfig.$inject = ['$httpProvider', '$routeProvider', '$locationProvider'];

    function routesConfig($httpProvider, $routeProvider, $locationProvider) {

        $routeProvider
            .when("/main", {
                templateUrl: "views/main.html",
                controller: "MainController as mainCtrl",
                title: 'ראשי'
            })
            .when("/maps", {
                templateUrl: "views/maps.html",
                controller: "MapsController as mapsCtrl",
                title: 'מפות'
            })
            .when("/graphs", {
                templateUrl: "views/graphs.html",
                controller: "GraphsController as graphsCtrl",
                title: 'גרפים'
            })
            .when("/birth", {
                templateUrl: "views/birth.html",
                controller: "BirthController as birthCtrl",
                title: 'גרפים'
            })
            .when("/study", {
                templateUrl: "views/study.html",
                controller: "StudyController as studyCtrl",
                title: 'לימודים'
            })
            .when("/teaching", {
                templateUrl: "views/teaching.html",
                controller: "TeachingController as teachingCtrl",
                title: 'הוראה'
            })
            .when("/exhibitions", {
                templateUrl: "views/exhibitions.html",
                controller: "ExhibitionsController as exhibitCtrl",
                title: 'תערוכות'
            })
            .when("/about", {
                templateUrl: "views/about.html",
                title: 'אודות'
            })
            .otherwise({
                redirectTo: "/main"
            });


        $locationProvider.html5Mode(true);
    }


})();