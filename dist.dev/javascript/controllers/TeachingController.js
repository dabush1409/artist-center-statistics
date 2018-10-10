(function () {
    'use strict';

    angular.module('miniProj')
        .controller('TeachingController', TeachingController);

    TeachingController.$inject = ['$scope', 'Constants', '$q',  'Api'];

    function TeachingController($scope, Constants,$q, Api) {

        var vm = this;

        vm.graphOptions = Constants.graphOptions;

        var statsPromise = Api.getArtistStats();

        var teachingStatsWowPromise = Api.getArtistTeachingCities();

        var promises = [];
        promises.push(statsPromise);
        promises.push(teachingStatsWowPromise);
        $q.all(promises)
            .then(function (returnedPromises) {
                var totalInPeriphery = returnedPromises[0].data.fromPeriphery,
                    totalNotInPeriphery = returnedPromises[0].data.notFromPeriphery,
                    totalAbroad = returnedPromises[0].data.fromAbroad;
                var peripheryArr = [], notPeripheryArr = [], abroadArr = [], labels3 = [];
                angular.forEach(returnedPromises[1].data, function (val) {
                    if (!(val.peripheryTeachingNotPeriphery === 0 &&
                        val.notPeripheryTeachingNotPeriphery === 0 &&
                        val.abroadTeachingNotPeriphery === 0)) {
                        peripheryArr.push(val.peripheryTeachingNotPeriphery / totalInPeriphery * 100);
                        notPeripheryArr.push(val.notPeripheryTeachingNotPeriphery / totalNotInPeriphery * 100);
                        abroadArr.push(val.abroadTeachingNotPeriphery / totalAbroad * 100);
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

        var teachingStatsWowPeripheryPromise = Api.getArtistTeachingCitiesPeriphery();
        promises = [];
        promises.push(statsPromise);
        promises.push(teachingStatsWowPeripheryPromise);
        $q.all(promises)
            .then(function (returnedPromises) {
                var totalInPeriphery = returnedPromises[0].data.fromPeriphery,
                    totalNotInPeriphery = returnedPromises[0].data.notFromPeriphery,
                    totalAbroad = returnedPromises[0].data.fromAbroad;
                var peripheryArr = [], notPeripheryArr = [], abroadArr = [], labels4 = [];
                angular.forEach(returnedPromises[1].data, function (val) {
                    if (!(val.peripheryTeachingInPeriphery === 0 &&
                        val.notPeripheryTeachingInPeriphery === 0 &&
                        val.abroadTeachingInPeriphery === 0)) {
                        peripheryArr.push(val.peripheryTeachingInPeriphery / totalInPeriphery * 100);
                        notPeripheryArr.push(val.notPeripheryTeachingInPeriphery / totalNotInPeriphery * 100);
                        abroadArr.push(val.abroadTeachingInPeriphery / totalAbroad * 100);
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


        Api.getCitiesAndCountriesTeached()
            .then(function (data) {
                initializeMap("map_canvas", data.data);
            }, function () {

            });


        var geocoder;

        function showCordinates(data, map, i) {
            var location = {
                lat: parseFloat(data[i].location.lat),
                lng: parseFloat(data[i].location.lng),
            };
            map.setCenter(location);
            var marker = new google.maps.Marker({
                position: location,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: Math.min(Math.max(data[i].count / 100, 3), 15),
                    fillColor: "#F00",
                    fillOpacity: 0.4,
                    strokeWeight: 0.4
                },
                map: map
            });
        }

        function initializeMap(id, data) {

            if (angular.isUndefined(geocoder) || geocoder === null) {
                geocoder = new google.maps.Geocoder();
            }

            var latlng = new google.maps.LatLng(-0.397, 5.644);
            var options = {
                zoom: 8,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var map = new google.maps.Map(document.getElementById(id), options);

            for (var i = 0; i < data.length; i++) {
                showCordinates(data, map, i);
            }
        }

    }


})();