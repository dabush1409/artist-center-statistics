/*jshint -W093 */
(function () {
    'use strict';

    angular.module('miniProj.services')
        .service('Api', Api);

    Api.$inject = ['$http'];

    function Api($http) {

        var cache = {};

        return {
            getArtistStats: getArtistStats,
            getArtistStatsWow: getArtistStatsWow,
            getArtistStatsWowInPeriphery: getArtistStatsWowInPeriphery,
            getArtistBirthCities: getArtistBirthCities,
            getArtistBirthCitiesStats: getArtistBirthCitiesStats,
            getArtistTeachingCities: getArtistTeachingCities,
            getArtistTeachingCitiesPeriphery: getArtistTeachingCitiesPeriphery,
            getArtistStudyCities: getArtistStudyCities,
            getArtistStudyCitiesPeriphery: getArtistStudyCitiesPeriphery,
            updateStudiesCity: updateStudiesCity,
            updateTeachingCity: updateTeachingCity,
            getCitiesAndCountriesStudied: getCitiesAndCountriesStudied,
            getCitiesAndCountriesTeached: getCitiesAndCountriesTeached,
            getArtistExhibitionsLocationStats: getArtistExhibitionsLocationStats

        };

        function getArtistStats() {
            if (angular.isDefined(cache.ArtistStats)) {
                return cache.ArtistStats;
            }

            return cache.ArtistStats = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/stats'
            });
        }

        function getArtistStatsWow() {
            if (angular.isDefined(cache.getArtistStatsWow)) {
                return cache.getArtistStatsWow;
            }

            return cache.getArtistStatsWow = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/stats/wow'
            });
        }

        function getCitiesAndCountriesStudied() {
            return cache.getCitiesAndCountriesStudied = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/study/cities'
            });
        }
        function getCitiesAndCountriesTeached() {
            return cache.getCitiesAndCountriesTeached = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/teaching/cities'
            });
        }

        function getArtistStatsWowInPeriphery() {
            if (angular.isDefined(cache.getArtistStatsWowInPeriphery)) {
                return cache.getArtistStatsWowInPeriphery;
            }

            return cache.getArtistStatsWowInPeriphery = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/stats/wowInPeriphery'
            });
        }

        function getArtistBirthCities() {
            if (angular.isDefined(cache.getArtistBirthCities)) {
                return cache.getArtistBirthCities;
            }

            return cache.getArtistBirthCities = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/birth/cities'
            });
        }

        function getArtistStudyCities() {
            if (angular.isDefined(cache.getArtistStudyCities)) {
                return cache.getArtistStudyCities;
            }

            return cache.getArtistStudyCities = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/study/cities/wow'
            });
        }

        function getArtistStudyCitiesPeriphery() {
            if (angular.isDefined(cache.getArtistStudyCitiesPeriphery)) {
                return cache.getArtistStudyCitiesPeriphery;
            }

            return cache.getArtistStudyCitiesPeriphery = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/study/cities/wowInPeriphery'
            });
        }
        function getArtistTeachingCities() {
            if (angular.isDefined(cache.getArtistTeachingCities)) {
                return cache.getArtistTeachingCities;
            }

            return cache.getArtistTeachingCities = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/teaching/cities/wow'
            });
        }

        function getArtistTeachingCitiesPeriphery() {
            if (angular.isDefined(cache.getArtistTeachingCitiesPeriphery)) {
                return cache.getArtistTeachingCitiesPeriphery;
            }

            return cache.getArtistTeachingCitiesPeriphery = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/teaching/cities/wowInPeriphery'
            });
        }


        function updateStudiesCity() {
            if (angular.isDefined(cache.updateStudiesCity)) {
                return cache.updateStudiesCity;
            }

            return cache.updateStudiesCity = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/update/studies'
            });
        }
        function updateTeachingCity() {
            if (angular.isDefined(cache.updateTeachingCity)) {
                return cache.updateTeachingCity;
            }

            return cache.updateTeachingCity = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/teaching/studies'
            });
        }


        function getArtistBirthCitiesStats(periphery) {
            if (angular.isDefined(cache['getArtistBirthCities' + periphery])) {
                return cache['getArtistBirthCities' + periphery];
            }

            return cache['getArtistBirthCities' + periphery] = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/stats/cities',
                params: {periphery: periphery}
            });
        }

        function getArtistExhibitionsLocationStats() {
            if (angular.isDefined(cache.getArtistExhibitionsLocationStats)) {
                return cache.getArtistExhibitionsLocationStats;
            }

            return cache.getArtistExhibitionsLocationStats = $http({
                headers: {'content-type': 'application/json; charset=UTF-8', 'Authorization': 'bearer'},
                method: "GET",
                url: '/api/artist/stats/exhibitions'
            });
        }

    }
})();