var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var cities = require('../../utils/cities');
var countries = require('../../utils/countries');


var Artist = require('../models/Artist.js');

router.post('/', function (req, res) {
    //console.log("req.body", req.body);

    Artist.create(req.body, onInsert);

    function onInsert(err, ans) {
        if (err) {
            console.log(err);
            return res.status(500).send("There was a problem adding the information to the database.");
        }

        return res.status(200).send(ans);
    }
});

router.get('/', function (req, res) {
    let query = {};
    let pagination = {limit: 13};

    if (req.query.name !== undefined) {
        query.name = req.query.name;
    }

    if (req.query.page !== undefined) {
        pagination.page = req.query.page;
    }

    Artist.paginate(query, pagination, function (err, artists) {
        if (err) return res.status(500).send("There was a problem finding the users.");

        //console.log(artists);

        //ok, send the data
        res.status(200).send({
            metadata: {
                page: artists.page,
                length: artists.docs.length,
                total: artists.total,
            },
            result: artists.docs
        });
    });
});

router.get('/remove/all', function (req, res) {
    Artist.remove({}, function (err, artists) {
        if (err) return res.status(500).send("There was a problem removing the artists.");

        res.status(200).send("done.")
    });
});

router.get('/without/city', function (req, res) {
    Artist.aggregate([
        [{
            $match: /** * query - The query in MQL. */
                {
                    "birthCity": {"$exists": false},
                    "birthCountry": {"$exists": false}
                }
        }, {
            $project: /** * specifications - The fields to *   include or exclude. */{
                name: 1,
                generalInfo: 1
            }
        }]
    ]).then(function (result) {
        res.status(200).send(result);
    }, function () {

    });
});

//return total artists from periphery and total artists not from periphery
//added number of artists from other country.
router.get('/stats', function (req, res) {
    let query = {};
    let pagination = {limit: 13};

    query.birthCity = {$in: cities.getPeripheries()};

    Artist.paginate(query, pagination, function (err, artists) {
        if (err) return res.status(500).send("There was a problem finding the users.");

        Artist.paginate({
            birthCity: {
                $nin: cities.getPeripheries(),
                $ne: null
            }
        }, pagination, function (err, allArtists) {
            Artist.paginate({
                birthCountry: {
                    $in: countries.getCountries(),
                    $ne: "ישראל"
                }
            }, pagination, function (err, abroadArtists) {
                if (err) return res.status(500).send("There was a problem finding the users.");

                //ok, send the data
                res.status(200).send({
                    fromPeriphery: artists.total,
                    fromAbroad: abroadArtists.total,
                    notFromPeriphery: allArtists.total
                });
            });
        });
    });
});

router.get('/stats/exhibitions', function (req, res) {
    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                exhibitions: {
                    "$map": {
                        "input": "$exhibitions",
                        "as": "m",
                        "in": {
                            "city": "$$m.city"
                        }
                    }
                }
            }
        },
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$exhibitions"}
            },
            {
                $group: {
                    _id: "test",
                    "notPeriphery": {
                        "$sum": {
                            "$cond": [
                                {$in: ["$exhibitions.city", cities.getPeripheries()]},
                                0,
                                1
                            ]
                        }
                    },
                    "periphery": {
                        "$sum": {
                            "$cond": [
                                {$in: ["$exhibitions.city", cities.getPeripheries()]},
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});

router.get('/stats/cities', function (req, res) {
    let query = {$in: cities.getPeripheries()};

    if (req.query.periphery !== undefined && req.query.periphery === 'false') {
        query = {$nin: cities.getPeripheries(), "$ne": null};
    }

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCity: 1,
            }
        }, {
            $match: /** * query - The query in MQL. */{
                "birthCity": query
            }
        }, {
            $group: /** * _id - The id of the group. * field1 - The first field name. */{
                _id: "$birthCity",
                birthCity: {$first: "$birthCity"},
                count: {$sum: 1}
            }
        }, {
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                birthCity: 1,
                count: 1
            }
        }]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});

router.get('/stats/wow', function (req, res) {

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                exhibitions: {
                    "$map": {
                        "input": "$exhibitions",
                        "as": "m",
                        "in": {
                            "city": "$$m.city"
                        }
                    }
                }
            }
        },
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$exhibitions"}
            },
            {
                $group: /** * _id - The id of the group. * field1 - The first field name. */{
                    _id: "$name",
                    "exhibitions": {"$addToSet": {"city": "$exhibitions.city"}},
                    "birthCity": {$first: "$birthCity"},
                    "birthCountry": {$first: "$birthCountry"}
                }
            },
            {
                $unwind: {path: "$exhibitions"}
            },
            {
                $group: {
                    _id: "$exhibitions.city",
                    city: {$first: "$exhibitions.city"},
                    "notPeripheryExhibitNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$in": ["$birthCity", cities.getPeripheries()]}},
                                        {"$eq": ["$birthCountry", "ישראל"]},
                                        {"$not": {"$in": ["$exhibitions.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "peripheryExhibitNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$in": ["$birthCity", cities.getPeripheries()]},
                                        {"$not": {"$in": ["$exhibitions.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "abroadExhibitNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$eq": ["$birthCountry", "ישראל"]}},
                                        {"$not": {"$eq": ["$birthCountry", null]}},
                                        {"$not": {"$in": ["$exhibitions.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "unknown": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$eq": ["$birthCountry", null]},
                                        {"$not": {"$in": ["$exhibitions.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                $match: {
                    "_id": {$nin: cities.getPeripheries(), $ne: null}
                }
            },
            {
                $lookup:
                    {
                        from: "countries",
                        let: {
                            cityName: "$city"
                        },
                        pipeline: [
                            {
                                $match: {
                                    "name": "ישראל"
                                }
                            },
                            {
                                $unwind: {path: "$cities"}
                            },
                            {
                                $match: {
                                    $expr: {$eq: ["$cities.name", "$$cityName"]}
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    lng: "$cities.longitude",
                                    lat: "$cities.latitude"
                                }
                            }
                        ],
                        as: "location"
                    }
            },
            {
                $project: {
                    location: {$arrayElemAt: ["$location", 0]},
                    notPeripheryExhibitNotPeriphery: 1,
                    peripheryExhibitNotPeriphery: 1,
                    abroadExhibitNotPeriphery: 1,
                    unknown: 1,
                    count: 1
                }
            }
        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});

router.get('/stats/wowInPeriphery', function (req, res) {

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                exhibitions: {
                    "$map": {
                        "input": "$exhibitions",
                        "as": "m",
                        "in": {
                            "city": "$$m.city"
                        }
                    }
                }
            }
        },
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$exhibitions"}
            }, {
            $group: /** * _id - The id of the group. * field1 - The first field name. */{
                _id: "$name",
                "exhibitions": {"$addToSet": {"city": "$exhibitions.city"}},
                "birthCity": {$first: "$birthCity"},
                "birthCountry": {$first: "$birthCountry"}
            }
        }, {$unwind: {path: "$exhibitions"}}, {
            $group: {
                _id: "$exhibitions.city",
                city: {$first: "$exhibitions.city"},
                "notPeripheryExhibitInPeriphery": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [{"$not": {"$in": ["$birthCity", cities.getPeripheries()]}},
                                    {"$eq": ["$birthCountry", "ישראל"]},
                                    {"$in": ["$exhibitions.city", cities.getPeripheries()]}]
                            },
                            1,
                            0
                        ]
                    }
                },
                "peripheryExhibitInPeriphery": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [{"$in": ["$birthCity", cities.getPeripheries()]},
                                    {"$in": ["$exhibitions.city", cities.getPeripheries()]}]
                            },
                            1,
                            0
                        ]
                    }
                },
                "abroadExhibitInPeriphery": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [{"$not": {"$eq": ["$birthCountry", "ישראל"]}},
                                    {"$not": {"$eq": ["$birthCountry", null]}},
                                    {"$in": ["$exhibitions.city", cities.getPeripheries()]}]
                            },
                            1,
                            0
                        ]
                    }
                },
                "unknown": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [{"$eq": ["$birthCountry", null]},
                                    {"$in": ["$exhibitions.city", cities.getPeripheries()]}]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }, {
            $match: {
                "_id": {$in: cities.getPeripheries(), $ne: null}
            }
        }, {
            $lookup:
                {
                    from: "countries",
                    let: {
                        cityName: "$city"
                    },
                    pipeline: [
                        {
                            $match: {
                                "name": "ישראל"
                            }
                        },
                        {
                            $unwind: {path: "$cities"}
                        },
                        {
                            $match: {
                                $expr: {$eq: ["$cities.name", "$$cityName"]}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                lng: "$cities.longitude",
                                lat: "$cities.latitude"
                            }
                        }
                    ],
                    as: "location"
                }
        },
            {
                $project: {
                    location: {$arrayElemAt: ["$location", 0]},
                    notPeripheryExhibitInPeriphery: 1,
                    peripheryExhibitInPeriphery: 1,
                    abroadExhibitInPeriphery: 1,
                    unknown: 1,
                    count: 1
                }
            }
        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


router.get('/study/cities/wow', function (req, res) {

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                study: {
                    "$map": {
                        "input": "$study",
                        "as": "m",
                        "in": {
                            "city": "$$m.city"
                        }
                    }
                }
            }
        }
            ,
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$study"}
            }, {
            $match: {
                "study.city": {$ne: null}
            }
        },
            {
                $group: /** * _id - The id of the group. * field1 - The first field name. */{
                    _id: "$name",
                    "study": {"$addToSet": {"city": "$study.city"}},
                    "birthCity": {$first: "$birthCity"},
                    "birthCountry": {$first: "$birthCountry"}
                }
            }
            , {
            $unwind: {path: "$study"}
        }
            ,
            {
                $group: {
                    _id: "$study.city",
                    city: {$first: "$study.city"},
                    "notPeripheryStudyNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$in": ["$birthCity", cities.getPeripheries()]}},
                                        {"$eq": ["$birthCountry", "ישראל"]},
                                        {"$not": {"$in": ["$study.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "peripheryStudyNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$in": ["$birthCity", cities.getPeripheries()]},
                                        {"$not": {"$in": ["$study.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "abroadStudyNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$eq": ["$birthCountry", "ישראל"]}},
                                        {"$not": {"$eq": ["$birthCountry", null]}},
                                        {"$not": {"$in": ["$study.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "unknown": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$eq": ["$birthCountry", null]},
                                        {"$not": {"$in": ["$study.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "count": {"$sum": 1}
                }
            }, {
            $match: {
                "_id": {$nin: cities.getPeripheries(), $ne: null}
            }
        }
            ,
            {
                $lookup:
                    {
                        from: "countries",
                        let: {
                            cityName: "$city"
                        },
                        pipeline: [
                            {
                                $match: {
                                    "name": "ישראל"
                                }
                            },
                            {
                                $unwind: {path: "$cities"}
                            },
                            {
                                $match: {
                                    $expr: {$eq: ["$cities.name", "$$cityName"]}
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    lng: "$cities.longitude",
                                    lat: "$cities.latitude"
                                }
                            }
                        ],
                        as: "location"
                    }
            },
            {
                $project: {
                    location: {$arrayElemAt: ["$location", 0]},
                    notPeripheryStudyNotPeriphery: 1,
                    peripheryStudyNotPeriphery: 1,
                    abroadStudyNotPeriphery: 1,
                    unknown: 1,
                    count: 1
                }
            }
        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


router.get('/teaching/cities/wow', function (req, res) {

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                teaching: {
                    "$map": {
                        "input": "$teaching",
                        "as": "m",
                        "in": {
                            "city": "$$m.city"
                        }
                    }
                }
            }
        }
            ,
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$teaching"}
            }, {
            $match: {
                "teaching.city": {$ne: null}
            }
        },
            {
                $group: /** * _id - The id of the group. * field1 - The first field name. */{
                    _id: "$name",
                    "teaching": {"$addToSet": {"city": "$teaching.city"}},
                    "birthCity": {$first: "$birthCity"},
                    "birthCountry": {$first: "$birthCountry"}
                }
            }
            , {
            $unwind: {path: "$teaching"}
        }
            ,
            {
                $group: {
                    _id: "$teaching.city",
                    city: {$first: "$teaching.city"},
                    "notPeripheryTeachingNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$in": ["$birthCity", cities.getPeripheries()]}},
                                        {"$eq": ["$birthCountry", "ישראל"]},
                                        {"$not": {"$in": ["$teaching.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "peripheryTeachingNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$in": ["$birthCity", cities.getPeripheries()]},
                                        {"$not": {"$in": ["$teaching.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "abroadTeachingNotPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$eq": ["$birthCountry", "ישראל"]}},
                                        {"$not": {"$eq": ["$birthCountry", null]}},
                                        {"$not": {"$in": ["$teaching.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "unknown": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$eq": ["$birthCountry", null]},
                                        {"$not": {"$in": ["$teaching.city", cities.getPeripheries()]}}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "count": {"$sum": 1}
                }
            }, {
            $match: {
                "_id": {$nin: cities.getPeripheries(), $ne: null}
            }
        }
            ,
            {
                $lookup:
                    {
                        from: "countries",
                        let: {
                            cityName: "$city"
                        },
                        pipeline: [
                            {
                                $match: {
                                    "name": "ישראל"
                                }
                            },
                            {
                                $unwind: {path: "$cities"}
                            },
                            {
                                $match: {
                                    $expr: {$eq: ["$cities.name", "$$cityName"]}
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    lng: "$cities.longitude",
                                    lat: "$cities.latitude"
                                }
                            }
                        ],
                        as: "location"
                    }
            },
            {
                $project: {
                    location: {$arrayElemAt: ["$location", 0]},
                    notPeripheryTeachingNotPeriphery: 1,
                    peripheryTeachingNotPeriphery: 1,
                    abroadTeachingNotPeriphery: 1,
                    unknown: 1,
                    count: 1
                }
            }
        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


router.get('/study/cities/wowInPeriphery', function (req, res) {

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                study: {
                    "$map": {
                        "input": "$study",
                        "as": "m",
                        "in": {
                            "city": "$$m.city"
                        }
                    }
                }
            }
        }
            ,
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$study"}
            }, {
            $match: {
                "study.city": {$ne: null}
            }
        },
            {
                $group: /** * _id - The id of the group. * field1 - The first field name. */{
                    _id: "$name",
                    "study": {"$addToSet": {"city": "$study.city"}},
                    "birthCity": {$first: "$birthCity"},
                    "birthCountry": {$first: "$birthCountry"}
                }
            }
            , {
            $unwind: {path: "$study"}
        }
            ,
            {
                $group: {
                    _id: "$study.city",
                    city: {$first: "$study.city"},
                    "notPeripheryStudyInPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$in": ["$birthCity", cities.getPeripheries()]}},
                                        {"$eq": ["$birthCountry", "ישראל"]},
                                        {"$in": ["$study.city", cities.getPeripheries()]}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "peripheryStudyInPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$in": ["$birthCity", cities.getPeripheries()]},
                                        {"$in": ["$study.city", cities.getPeripheries()]}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "abroadStudyInPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$eq": ["$birthCountry", "ישראל"]}},
                                        {"$not": {"$eq": ["$birthCountry", null]}},
                                        {"$in": ["$study.city", cities.getPeripheries()]}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "unknown": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$eq": ["$birthCountry", null]},
                                        {"$in": ["$study.city", cities.getPeripheries()]}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "count": {"$sum": 1}
                }
            }, {
            $match: {
                "_id": {$in: cities.getPeripheries(), $ne: null}
            }
        }
            ,
            {
                $lookup:
                    {
                        from: "countries",
                        let: {
                            cityName: "$city"
                        },
                        pipeline: [
                            {
                                $match: {
                                    "name": "ישראל"
                                }
                            },
                            {
                                $unwind: {path: "$cities"}
                            },
                            {
                                $match: {
                                    $expr: {$eq: ["$cities.name", "$$cityName"]}
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    lng: "$cities.longitude",
                                    lat: "$cities.latitude"
                                }
                            }
                        ],
                        as: "location"
                    }
            },
            {
                $project: {
                    location: {$arrayElemAt: ["$location", 0]},
                    notPeripheryStudyInPeriphery: 1,
                    peripheryStudyInPeriphery: 1,
                    abroadStudyInPeriphery: 1,
                    unknown: 1,
                    count: 1
                }
            }
        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


router.get('/teaching/cities/wowInPeriphery', function (req, res) {

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                teaching: {
                    "$map": {
                        "input": "$teaching",
                        "as": "m",
                        "in": {
                            "city": "$$m.city"
                        }
                    }
                }
            }
        }
            ,
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$teaching"}
            }, {
            $match: {
                "teaching.city": {$ne: null}
            }
        },
            {
                $group: /** * _id - The id of the group. * field1 - The first field name. */{
                    _id: "$name",
                    "teaching": {"$addToSet": {"city": "$teaching.city"}},
                    "birthCity": {$first: "$birthCity"},
                    "birthCountry": {$first: "$birthCountry"}
                }
            }
            , {
            $unwind: {path: "$teaching"}
        }
            ,
            {
                $group: {
                    _id: "$teaching.city",
                    city: {$first: "$teaching.city"},
                    "notPeripheryTeachingInPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$in": ["$birthCity", cities.getPeripheries()]}},
                                        {"$eq": ["$birthCountry", "ישראל"]},
                                        {"$in": ["$teaching.city", cities.getPeripheries()]}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "peripheryTeachingInPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$in": ["$birthCity", cities.getPeripheries()]},
                                        {"$in": ["$teaching.city", cities.getPeripheries()]}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "abroadTeachingInPeriphery": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$not": {"$eq": ["$birthCountry", "ישראל"]}},
                                        {"$not": {"$eq": ["$birthCountry", null]}},
                                        {"$in": ["$teaching.city", cities.getPeripheries()]}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "unknown": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [{"$eq": ["$birthCountry", null]},
                                        {"$in": ["$teaching.city", cities.getPeripheries()]}]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "count": {"$sum": 1}
                }
            }, {
            $match: {
                "_id": {$in: cities.getPeripheries(), $ne: null}
            }
        }
            ,
            {
                $lookup:
                    {
                        from: "countries",
                        let: {
                            cityName: "$city"
                        },
                        pipeline: [
                            {
                                $match: {
                                    "name": "ישראל"
                                }
                            },
                            {
                                $unwind: {path: "$cities"}
                            },
                            {
                                $match: {
                                    $expr: {$eq: ["$cities.name", "$$cityName"]}
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    lng: "$cities.longitude",
                                    lat: "$cities.latitude"
                                }
                            }
                        ],
                        as: "location"
                    }
            },
            {
                $project: {
                    location: {$arrayElemAt: ["$location", 0]},
                    notPeripheryTeachingInPeriphery: 1,
                    peripheryTeachingInPeriphery: 1,
                    abroadTeachingInPeriphery: 1,
                    unknown: 1,
                    count: 1
                }
            }
        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


function findInCities(splittedText) {
    var i;
    for (i = 0; i < splittedText.length; i++) {
        if (cities.getCities().indexOf(splittedText[i]) > -1) {
            console.log("Found city: " + splittedText[i]);
            return splittedText[i];
        }
    }
}

function findCity(studyText) {
    console.log("studyText: " + studyText.text + " id: " + studyText._id);
    studyText.text = studyText.text.replace("-", " ");
    console.log("studyText after: " + studyText.text + " id: " + studyText._id);
    var splittedText = [];
    splittedText.push(studyText.text.split(","));
    splittedText.push(studyText.text.split(", "));
    splittedText.push(studyText.text.split(" "));
    //splittedText.push(studyText.text.match(/\b[\w']+(?:[^\w\n]+[\w']+){0,2}\b/g));
    //console.log("every 2 words: " + splittedText[3]);
    var i, ans;
    for (i = 0; i < splittedText.length; i++) {
        if ((ans = findInCities(splittedText[i])) !== undefined) {
            return ans;
        }
    }
    return ans;
}

router.get('/update/studies', function (req, res) {

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                study: 1
            }
        }, {
            $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                {path: "$study"}
        }
        ]
    ]).then(function (result) {
        result.forEach(function (study) {
            var cityFound = findCity(study.study);
            console.log("after findCity i got: " + cityFound);
            if (cityFound !== undefined && cityFound !== null) {
                console.log("found city! : " + cityFound);
                var conditions = {"study._id": study.study._id}
                    , update = {"study.$.city": cityFound}
                    , options = {upsert: true};

                Artist.findOneAndUpdate(conditions, update, options, callback);

                function callback(err, numAffected) {
                    // numAffected is the number of updated documents
                    if (err) console.log(err);
                    console.log(numAffected);
                }
            }
            //console.log(study.study);
            // var stat = Artist.update(
            //     {"study.id": study.study.id},
            //     {"$set": {"study.$city": findCity(study.study)}}
            // )
            // console.log("Status: " + stat.nMatched);
        })
        res.status(200).send("updated");
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


router.get('/update/teaching', function (req, res) {

    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                teaching: 1,
                _id: 0
            }
        },
            {
                $match: /** * query - The query in MQL. */
                    {"teaching": {$exists: true}}
            },
            {$unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                {path: "$teaching"}
            }
        ]
    ]).then(function (result) {
        result.forEach(function (teaching) {
            console.log("teaching.teaching.text: " + teaching.teaching.text);
            var cityFound = findCity(teaching.teaching);
            console.log("after findCity i got: " + cityFound);
            if (cityFound !== undefined && cityFound !== null) {
                console.log("found city! : " + cityFound);
                var conditions = {"teaching._id": teaching.teaching._id}
                    , update = {"teaching.$.city": cityFound}
                    , options = {upsert: true};

                Artist.update(conditions, update, options, callback);

                function callback(err, numAffected) {
                    // numAffected is the number of updated documents
                    if (err) console.log(err);
                    console.log(numAffected);
                }
            }
            //console.log(study.study);
            // var stat = Artist.update(
            //     {"study.id": study.study.id},
            //     {"$set": {"study.$city": findCity(study.study)}}
            // )
            // console.log("Status: " + stat.nMatched);
        })
        res.status(200).send("updated");
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


//artists from periphery who exhibits in given city
router.get('/from/', function (req, res) {

    let query = {};

    //check if requested specific birth city or periphery\not
    var fromPeriphery = req.query.fromPeriphery;
    if (fromPeriphery !== undefined) {
        query.fromPeriphery = checkPeriphery(fromPeriphery);
    } else {
        var fromCity = req.query.fromCity;
        fromCity = fromCity.split(",");
        query.fromCity = fromCity;
    }

    //check if requested specific exhibition city or periphery\not
    var exhibitInPeriphery = req.query.exhibitInPeriphery;
    if (exhibitInPeriphery !== undefined) {
        query.exhibitInPeriphery = checkPeriphery(exhibitInPeriphery);
    } else {
        var exhibitCity = req.query.exhibitCity;
        exhibitCity = exhibitCity.split(",");
        query.exhibitCity = exhibitCity;
    }


    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                exhibitions: {
                    "$map": {
                        "input": "$exhibitions",
                        "as": "m",
                        "in": {
                            "name": "$$m.name",
                            "location": "$$m.location",
                            "city": "$$m.city",
                            "time": "$$m.time",
                            "startDate": "$$m.startDate",
                            "endDate": "$$m.endDate"
                        }

                    }
                }
            }
        }, {$unwind: {path: "$exhibitions"}}, {
            $match: /** * query - The query in MQL. */{
                "exhibitions.city": query.exhibitInPeriphery === undefined ?
                    {$in: query.exhibitCity} :
                    {$in: query.exhibitInPeriphery},
                "birthCity": query.fromPeriphery === undefined ?
                    {$in: query.fromCity} :
                    {$in: query.fromPeriphery}
            },
        }, {
            $group: /** * _id - The id of the group. * field1 - The first field name. */{
                _id: "$name",
                exhibitions: {$push: "$exhibitions"},
                birthCity: {$first: "$birthCity"}
            }
        }]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


//artists from periphery who exhibits out of the periphery
router.get('/from/periphery', function (req, res) {
    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                _id: 0,
                name: 1,
                birthCountry: 1,
                birthCity: 1,
                exhibitions: {
                    "$map": {
                        "input": "$exhibitions",
                        "as": "m",
                        "in": {
                            "name": "$$m.name",
                            "location": "$$m.location",
                            "city": "$$m.city",
                            "time": "$$m.time",
                            "startDate": "$$m.startDate",
                            "endDate": "$$m.endDate"
                        }

                    }
                }
            }
        }, {$unwind: {path: "$exhibitions"}}, {
            $match: /** * query - The query in MQL. */{
                "exhibitions.city": {$nin: cities.getPeripheries()},
                "birthCity": {$in: cities.getPeripheries()}
            }
        }, {
            $group: /** * _id - The id of the group. * field1 - The first field name. */{
                _id: "$name",
                exhibitions: {$push: "$exhibitions"},
                birthCity: {$first: "$birthCity"}
            }
        }]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(res); // [ { maxBalance: 98000 } ]
    });
});


router.get('/birth/cities', function (req, res) {
    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                birthCity: {
                    "$ifNull": [
                        "$birthCity",
                        "none"
                    ]
                },
                birthCountry: 1,
                _id: 0
            }
        }, {
            $match: /** * query - The query in MQL. */
                {"birthCountry": {$exists: true}}
        }, {
            $group: /** * _id - The id of the group. * field1 - The first field name. */
                {
                    _id: "$birthCountry",
                    birthCity: {$push: "$birthCity"}
                }
        }, {
            $unwind: {path: "$birthCity"}
        }, {
            $group: {
                _id: {$cond: [{$eq: ["$_id", "ישראל"]}, "$birthCity", "$_id"]},
                count: {$sum: 1},
                birthCountry: {$first: "$_id"}
            }
        }, {
            $lookup:
                {
                    from: "countries",
                    let: {
                        cityName: "$_id",
                        countryName: "$birthCountry"
                    },
                    pipeline: [
                        {
                            $project: /** * specifications - The fields to *   include or exclude. */{
                                cities: {
                                    $cond: [{$eq: [{$size: "$cities"}, 0]},
                                        [{name: "none"}],
                                        "$cities"]
                                },
                                name: 1,
                                latitude: 1,
                                longitude: 1
                            }
                        },
                        {
                            $unwind: {
                                path: "$cities"
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: [{$cond: [{$eq: ["$$countryName", "ישראל"]}, "$cities.name", "$name"]}, "$$cityName"]
                                }
                                //{$eq: ["$cities.name", "$$cityName"]}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                lng: {$cond: [{$eq: ["$$countryName", "ישראל"]}, "$cities.longitude", "$longitude"]},
                                lat: {$cond: [{$eq: ["$$countryName", "ישראל"]}, "$cities.latitude", "$latitude"]}
                            }
                        }
                    ],
                    as:
                        "location"
                }
        }, {
            $match: {
                _id: {$ne: "none"},
            }
        }, {
            $project: {
                count: 1,
                location: {$arrayElemAt: ["$location", 0]},
                birthCountry: 1
            }
        }, {
            $match: {
                location: {$exists: true},
            }
        }
        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(result); // [ { maxBalance: 98000 } ]
    });
})
;

router.get('/study/cities', function (req, res) {
    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                study: 1,
                _id: 0
            }
        }, {
            $match: /** * query - The query in MQL. */
                {"study": {$exists: true}}
        },
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$study"}
            },
            {
                $match: /** * query - The query in MQL. */
                    {"study.city": {$ne: null}}
            },
            {
                $group: /** * _id - The id of the group. * field1 - The first field name. */{
                    _id: "$study.city",
                    count: {$sum: 1},
                    city: {$first: "$study.city"}
                }
            },
            {
                $lookup:
                    {
                        from: "countries",
                        let: {
                            cityName: "$city"
                        },
                        pipeline: [
                            {
                                $match: {
                                    "name": "ישראל"
                                }
                            },
                            {
                                $unwind: {path: "$cities"}
                            },
                            {
                                $match: {
                                    $expr: {$eq: ["$cities.name", "$$cityName"]}
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    lng: "$cities.longitude",
                                    lat: "$cities.latitude"
                                }
                            }
                        ],
                        as: "location"
                    }
            },
            {
                $project: {
                    count: 1,
                    location: {$arrayElemAt: ["$location", 0]}
                }
            }


        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(result); // [ { maxBalance: 98000 } ]
    });
});
router.get('/teaching/cities', function (req, res) {
    Artist.aggregate([
        [{
            $project: /** * specifications - The fields to *   include or exclude. */{
                teaching: 1,
                _id: 0
            }
        }, {
            $match: /** * query - The query in MQL. */
                {"teaching": {$exists: true}}
        },
            {
                $unwind: /** * path - Path to the array field. * includeArrayIndex - Optional name for index. * preserveNullAndEmptyArrays - Optional *   toggle to unwind null and empty values. */
                    {path: "$teaching"}
            },
            {
                $match: /** * query - The query in MQL. */
                    {"teaching.city": {$ne: null}}
            },
            {
                $group: /** * _id - The id of the group. * field1 - The first field name. */{
                    _id: "$teaching.city",
                    count: {$sum: 1},
                    city: {$first: "$teaching.city"}
                }
            },
            {
                $lookup:
                    {
                        from: "countries",
                        let: {
                            cityName: "$city"
                        },
                        pipeline: [
                            {
                                $match: {
                                    "name": "ישראל"
                                }
                            },
                            {
                                $unwind: {path: "$cities"}
                            },
                            {
                                $match: {
                                    $expr: {$eq: ["$cities.name", "$$cityName"]}
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    lng: "$cities.longitude",
                                    lat: "$cities.latitude"
                                }
                            }
                        ],
                        as: "location"
                    }
            },
            {
                $project: {
                    count: 1,
                    location: {$arrayElemAt: ["$location", 0]}
                }
            }


        ]
    ]).then(function (result) {
        res.status(200).send(result);
        //console.log(result); // [ { maxBalance: 98000 } ]
    });
});

router.delete('/', function (req, res) {
    Artist.findOneAndRemove({name: req.query.artist}, {}, function (err, data) {
        console.log("err", data);
        if (err || data === null) return res.status(500).send("There was a problem finding the artist.");
        if (!err) {

        }
    });
});

function getNotPeripheries() {
    return arr_diff(cities.getCities(), cities.getPeripheries());
}


function arr_diff(a1, a2) {

    var a = [], diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }

    return diff;
}


function checkPeriphery(fromPeriphery) {
    if (fromPeriphery === "yes") {
        return cities.getPeripheries();
    } else if (fromPeriphery === "no") {
        return getNotPeripheries();
    }
}

module.exports = router;
