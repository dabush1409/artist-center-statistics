/*jshint noempty: false */
(function () {
    'use strict';

    angular.module('miniProj')
        .controller('GraphsController', GraphsController);

    GraphsController.$inject = ['$scope', 'Constants', '$q', 'Api'];

    function GraphsController($scope, Constants, $q, Api) {

        var vm = this;

        vm.graphOptions = Constants.graphOptions;

        var statsPromise = Api.getArtistStats();

        var statsWowPromise = Api.getArtistStatsWow();

        var promises = [];
        promises.push(statsPromise);
        promises.push(statsWowPromise);
        $q.all(promises)
            .then(function (returnedPromises) {
                var totalInPeriphery = returnedPromises[0].data.fromPeriphery,
                    totalNotInPeriphery = returnedPromises[0].data.notFromPeriphery,
                    totalAbroad = returnedPromises[0].data.fromAbroad;
                var peripheryArr = [], notPeripheryArr = [], abroadArr = [], labels3 = [];
                angular.forEach(returnedPromises[1].data, function (val) {
                    if (!(val.peripheryExhibitNotPeriphery === 0 &&
                        val.notPeripheryExhibitNotPeriphery === 0 &&
                        val.abroadExhibitNotPeriphery === 0)) {
                        peripheryArr.push(val.peripheryExhibitNotPeriphery / totalInPeriphery * 100);
                        notPeripheryArr.push(val.notPeripheryExhibitNotPeriphery / totalNotInPeriphery * 100);
                        abroadArr.push(val.abroadExhibitNotPeriphery / totalAbroad * 100);
                        labels3.push(val._id);
                    }
                });


                vm.labels3 = labels3;
                vm.series3 = ["אמנים מהפריפריה", "אמנים לא מהפריפריה", "אמנים מחו\"ל"];
                vm.data3 = [];
                vm.data3.push(peripheryArr);
                vm.data3.push(notPeripheryArr);
                vm.data3.push(abroadArr);

            }, function () {

            });


        Api.getArtistStatsWowInPeriphery()
            .then(function (data) {

                var peripheryArr = [], notPeripheryArr = [], abroadArr = [], labels4 = [];
                angular.forEach(data.data, function (val) {
                    if (val.peripheryExhibitInPeriphery === 0 &&
                        val.notPeripheryExhibitInPeriphery === 0 &&
                        val.abroadExhibitInPeriphery === 0) {
                    } else {
                        peripheryArr.push(val.peripheryExhibitInPeriphery);
                        notPeripheryArr.push(val.notPeripheryExhibitInPeriphery);
                        abroadArr.push(val.abroadExhibitInPeriphery);
                        labels4.push(val._id);
                    }
                });


                vm.labels4 = labels4;
                vm.series4 = ["אמנים מהפריפריה", "אמנים לא מהפריפריה", "אמנים מחו\"ל"];
                vm.data4 = [];
                vm.data4.push(peripheryArr);
                vm.data4.push(notPeripheryArr);
                vm.data4.push(abroadArr);
            }, function () {

            });


    }


})();