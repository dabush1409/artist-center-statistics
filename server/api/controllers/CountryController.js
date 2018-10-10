var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var cities = require('../../utils/cities');
var countries = require('../../utils/countries');

var NodeGeocoder = require('node-geocoder');


var Artist = require('../models/Artist.js');
var Country = require('../models/Country.js');


var options = {
    provider: 'google',

    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: 'AIzaSyAG4chrqAwBltqDl_V_YKx-PYHWpdx76AM', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);


function getMapCoordinates(res, country, city) {

    var searchQuery = country;
    if (city !== undefined) {
        searchQuery = city;
    }

    geocoder.geocode(searchQuery)
        .then(function (result) {

                console.log(result);

                var findQuery;
                var updateQuery;
                if (city === undefined) {
                    updateQuery = {
                        latitude: result[0].latitude,
                        longitude: result[0].longitude
                    };

                    findQuery = {
                        name: country
                    };
                } else {
                    updateQuery = {
                        $addToSet: {
                            'cities': {
                                name: city,
                                latitude: result[0].latitude,
                                longitude: result[0].longitude
                            }
                        }
                    };

                    findQuery = {
                        name: country
                    };
                }


                Country.findOneAndUpdate(findQuery,
                    updateQuery
                    , {upsert: true, new: true, setDefaultsOnInsert: true}, function (err, result) {
                        if (err) {
                            res.status(500).send("There was a problem finding the users.")
                            console.log(err)
                        }

                        // console.log(result);
                    });
            }
        )
        .catch(function (err) {
            console.log(err);
        });
}

router.get('/parse/cities/all', function (req, res) {

    for (var i in cities.getCities()) {
        var city = cities.getCities()[i];
        getMapCoordinates(res, "ישראל", city);
    }
    res.status(200).send({status: "ok"});
});


router.get('/parse/cities/missing', function (req, res) {
    //return birth city no duplicates
    Country.aggregate([
        {
            $match: /** * query - The query in MQL. */
                {"cities.name": {$exists: true}}
        },
        {
            $project: /** * specifications - The fields to *   include or exclude. */
                {"cities.name": 1}
        },
        {
            $group: /** * _id - The id of the group. * field1 - The first field name. */{
                _id: "birthCity",
                cities: {$push: "$cities.name"}
            }
        },
        {
            $project: /** * specifications - The fields to *   include or exclude. */{
                birthCity: {$setDifference: [cities.getCities(), {$arrayElemAt: ["$cities", 0]}]},
                _id: 0
            }
        }], function (err, cities) {
        if (err) return res.status(500).send(err);

        for (var i in cities[0].birthCity) {
            var city = cities[0].birthCity[i];
            getMapCoordinates(res, "ישראל", city);
        }

        res.status(200).send({status: "ok", missing: cities[0].birthCity});
//ok, send the data
    });
});


router.get('/parse/countries/all', function (req, res) {


});

router.get('/parse/countries/missing', function (req, res) {


    Artist.find({"birthCountry": {$exists: true}})
        .distinct("birthCountry")
        .exec(function (err, countries) {

            //return birth city no duplicates
            Country.aggregate([
                    {
                        $match: /** * query - The query in MQL. */
                            {
                                "name": {$exists: true},
                                "latitude": {$exists: true}
                            }
                    },
                    {
                        $project: /** * specifications - The fields to *   include or exclude. */
                            {
                                "_id": 0,
                                "name": 1
                            }
                    },
                    {
                        $group: /** * _id - The id of the group. * field1 - The first field name. */{
                            _id: "birthCountry",
                            countries: {$push: "$name"}
                        }
                    },
                    {
                        $project: /** * specifications - The fields to *   include or exclude. */{
                            birthCity: {$setDifference: [countries, "$countries"]}
                        },

                    }
                ],

                function (err, countriesMissing) {
                    if (err) return res.status(500).send(err);

                    for (var i in countriesMissing[0].birthCity) {
                        var country = countriesMissing[0].birthCity[i];
                        getMapCoordinates(res, country);
                    }

                    res.status(200).send({status: "ok", missing: countriesMissing[0].birthCity});
//ok, send the data
                }
            )
            ;

        });

})
;


module.exports = router;

