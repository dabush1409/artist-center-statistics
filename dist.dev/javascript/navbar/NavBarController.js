(function () {
    'use strict';

    angular.module('miniProj')
        .controller('NavBarController', NavBarController);

    NavBarController.$inject = ['$location'];

    function NavBarController($location) {

        var vm = this;

        vm.goto = goto;

        initialize();

        function initialize() {
            vm.tabs = [
                new Tab("ראשי", '/main'),
                new Tab("לידה", '/birth'),
                new Tab("לימודים", '/study'),
                new Tab("הוראה", '/teaching'),
                // new Tab("מפות", '/maps'),
                // new Tab("גרפים", '/graphs'),
                new Tab("תערוכות", '/exhibitions'),
                new Tab("אודות", '/about'),
            ];

            selectTab();
        }

        function goto(url) {
            $location.path(url);
        }

        function Tab(title, url) {
            this.title = title;
            this.url = url;
        }

        function selectTab() {
            for (var tab in vm.tabs) {
                if ($location.path() === vm.tabs[tab].url) {
                    vm.currentNavItem = 'tab' + tab;
                }
            }
        }
    }


})();