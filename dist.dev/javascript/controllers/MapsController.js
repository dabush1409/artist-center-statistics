(function () {
    'use strict';

    angular.module('miniProj')
        .controller('MapsController', MapsController);

    MapsController.$inject = ['$scope', 'Api'];

    function MapsController($scope, Api) {

        var vm = this;

        var citiesData, birthCitiesData;

        Api.getArtistStatsWow()
            .then(function (data) {
                citiesData = data.data;
                initializeMap("exhibit");
            }, function () {

            });

        Api.getArtistBirthCities()
            .then(function (data) {
                birthCitiesData = data.data;
                initializeMap("birth");
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

        function initializeMap(city) {
            if (angular.isUndefined(geocoder) || geocoder === null) {
                geocoder = new google.maps.Geocoder();
            }

            var latlng = new google.maps.LatLng(-0.397, 5.644);
            var options = {
                zoom: 8,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var map;
            if (city === "birth") {
                map = new google.maps.Map(document.getElementById("map_canvas2"), options);
            } else {
                map = new google.maps.Map(document.getElementById("map_canvas"), options);
            }

            var data;
            if (city === "birth") {
                data = birthCitiesData;
            } else {
                data = citiesData;
            }


            for (var i = 0; i < data.length; i++) {
                showCordinates(data, map, i);
            }
        }

    }


})();