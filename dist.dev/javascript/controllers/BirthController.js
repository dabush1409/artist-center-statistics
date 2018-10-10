(function () {
    'use strict';

    angular.module('miniProj')
        .controller('BirthController', BirthController);

    BirthController.$inject = ['$scope', 'Constants', 'Api'];

    function BirthController($scope, Constants, Api) {

        var vm = this;

        vm.graphOptions = Constants.graphOptions;

        Api.getArtistBirthCities()
            .then(function (data) {
                initializeMap("map_canvas5", data.data);
            }, function () {

            });


        var geocoder;

        function showCordinates(data, map, i) {
            console.log(data[i]);
            var location = {
                lat: parseFloat(data[i].location.lat),
                lng: parseFloat(data[i].location.lng),
            };
            if (data[i].birthCountry === "ישראל") {
                map.setCenter(location);
            }
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


        vm.series2 = ["אמנים לא מהפריפריה"]

        Api.getArtistBirthCitiesStats(false)
            .then(function (data) {
                var labels2 = [];

                var arr = [];
                angular.forEach(data.data, function (val) {
                    arr.push(val.count);
                    labels2.push(val.birthCity);
                });

                vm.data2 = [];
                vm.data2.push(arr);
                vm.labels2 = labels2;
            }, function () {

            });

    }


})();