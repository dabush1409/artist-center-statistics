(function () {
    'use strict';

    angular.module('miniProj')
        .factory('Constants', constants)

    function constants() {
        return {
            graphOptions: {
                legend: {display: true},
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            min: 0
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            autoSkip: false
                        }
                    }]
                }
            }
        }
    }
})();