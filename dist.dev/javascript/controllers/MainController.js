(function () {
    'use strict';

    angular.module('miniProj')
        .controller('MainController', MainController);

    MainController.$inject = ['$scope', 'Constants', 'Api'];

    function MainController($scope, Constants, Api) {

        var vm = this;

        vm.graphOptions = Constants.graphOptions;

        vm.labels = ["נולדו בפריפריה", "נולדו לא בפריפריה", "נולדו בחו\"ל"];
        vm.labels3 = ["פריפריה", "לא בפריפריה"];

        Api.getArtistStats()
            .then(function (data) {
                vm.data = [data.data.fromPeriphery,
                    data.data.notFromPeriphery,
                    data.data.fromAbroad];

                console.log(vm.data);
            }, function () {

            });


        Api.getArtistExhibitionsLocationStats()
            .then(function (data) {
                vm.data3 = [data.data[0].periphery,
                    data.data[0].notPeriphery];

            }, function () {

            });

    }


})();