/*jshint -W093 */
(function () {
    'use strict';

    angular.module('miniProj.services')
        .service('Maps', Maps);

    Maps.$inject = ['$http'];

    function Maps($http) {

        return {
            initializeMap: initializeMap,
        };

        var geocoder;

        function showCordinates(data, map, scale) {
            if (angular.isUndefined(data.location) ||
                angular.isUndefined(data.location.lat) ||
                angular.isUndefined(data.location.lng)) {
                return;
            }

            var location = {
                lat: parseFloat(data.location.lat),
                lng: parseFloat(data.location.lng),
            };
            map.setCenter(location);
            var marker = new google.maps.Marker({
                position: location,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: Math.min(Math.max(data.count / scale, 3), 15),
                    fillColor: "#F00",
                    fillOpacity: 0.4,
                    strokeWeight: 0.4
                },
                map: map
            });
        }

        function initializeMap(id, data, scale) {
            if (angular.isUndefined(scale)) {
                scale = 100;
            }

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
                showCordinates(data[i], map, scale);
            }
        }

    }
})();