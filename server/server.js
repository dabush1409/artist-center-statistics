'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    path = require('path'),
    app = express(),
    Q = require('q'),
    cities = require('./utils/cities'),
    countries = require('./utils/countries'),
    mongoose = require('mongoose'),
    nodemailer = require('nodemailer');


app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.set('port', 5000);

app.set('sessionTimeout', 30);
app.set('view engine', 'html');
app.set('view cache', false);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const MISSING_ARTIST_IMG = "/images/corridor/Center for Israeli Art/placeholders/missing artist.jpg";
const EXHIBITIONS_BASE_URL = "http://museum.imj.org.il/artcenter/newsite/he/exhibitions/?artist=";
const MAIN_URL = 'http://museum.imj.org.il/artcenter/newsite/he/?list=א';
const NUMBER_OF_ARTISTS_TO_GET = 20;
const START_DATABASE = true;
const DEBUG = true;

function loadRoutes() {
    //app.all('*', middleware.preRequest());
    // require(path.join(__dirname, 'routes'))(app);

    // todo fix web site static routes
    app.use(express.static(__dirname + '/../' + 'dist.dev'));

    var router = express.Router();
    router.use(function (req, res, next) {
        // do logging
        console.log('Something is happening.');
        next(); // make sure we go to the next routes and don't stop here
    });

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
    router.get('/', function (req, res) {
        res.json({message: 'hooray! welcome to our api!'});
    });


    app.use('/api', router);

    app.get('/*', function (req, res) {
        res.sendFile(path.resolve(__dirname + '/../' + 'dist.dev/index.html'));
    });
}

/*function startServer(callback) {
    callback(undefined, app);
}*/

function init(callback) {
    loadRoutes();
    return app;
}

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dabusht@post.bgu.ac.il',
        pass: 'Tal456+-'
    }
})

var mailOptions = {
    from: 'dabusht@post.bgu.ac.il',
    to: 'dabusht@post.bgu.ac.il, benbash@post.bgu.ac.il',
    subject: 'msg from your server',
    text: DEBUG ? 'Done crawling' + NUMBER_OF_ARTISTS_TO_GET + ' artists m8!' : 'done crawling all m8!'
};


if (START_DATABASE) {
    mongoose.connect('mongodb://localhost:27017/artcenter', {useNewUrlParser: true});
}

var ArtistController = require('./api/controllers/ArtistController');
app.use('/api/artist', ArtistController);

var CountryController = require('./api/controllers/CountryController');
app.use('/api/country', CountryController);


var Crawler = require("crawler");
var URL = require('url')

var c = new Crawler({
    maxConnections: 10,
    preRequest: function (options, done) {
        console.log("crawling url: " + decodeURI(options.uri));
        done();
    },
    retries: 0
});


function getAllData(res) {
    c.queue([{
        uri: encodeURI(MAIN_URL),
        priority: 10,
        // This will be called for each crawled page
        callback: function (error, result, done) {
            if (error) {
                console.log(error);
            } else {
                var $ = result.$;
                // $ is Cheerio by default

                var arr = [];


                //TODO: URL? REQUEST URL?
                let requestUrl = result.request.uri.href;
                $(".list_of_artists li a").each(function (key, value) {
                    let href = value.attribs.href;
                    arr.push(URL.resolve(requestUrl, href));
                });

                var promises = [];

                //how many artists crawled.
                console.log("artist length", arr.length);

                var length = NUMBER_OF_ARTISTS_TO_GET;
                if (!DEBUG) {
                    length = arr.length;
                }

                //if not DEBUG mode, get data from all artists
                for (var i = 0; i < length; i++) {
                    promises.push(getArtistData(arr[i]));
                }

                //TODO: why waiting all promises to come back?!
                Q.all(promises)
                    .then(function (val) {
                        console.log("\n############################################");
                        console.log("############## done crawling ###############");
                        console.log("############################################\n");

                        if (!DEBUG) {
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Email sent: ' + info.response);
                                }
                            });
                        }
                    })
                    .catch(function (error) {
                        // Handle any error from all above steps
                    })
                    .done();

            }
            done();
        }
    }]);
}

app.get('/data', function (req, res) {

    //first, remove all data from the database
    getAllData(res);

    res.json({"status": "ok"});
});

function getDataWithNewLines(children, manipulation) {
    var data = [];
    if (children !== undefined) {
        //parse array with new lines
        if (Array.isArray(children)) {
            children.forEach(function (value) {
                if (value.type === "text") {
                    var str = replaceNewLinesWithEmpty(value.data);
                    data.push(manipulation(str));
                }
            });
        } else {
            //parse one line only
            data.push(children);
        }
    }
    return data;
}


function findGender(value, details) {
    var femaleGuessRegExp = /(נולדה|גדלה|למדה|עבודותיה)/g;
    var femaleGuessMatch = femaleGuessRegExp.exec(value);

    var maleGuessRegExp = /(נולד|גדל|למד|עבודותיו)[^א-ת]/g;
    var maleGuessMatch = maleGuessRegExp.exec(value);

    //get the year
    if (femaleGuessMatch !== null && Array.isArray(femaleGuessMatch) && femaleGuessMatch.length > 0) {
        //console.log(femaleGuessMatch);
        details.gender = "נקבה";
    }

    if (details.gender === undefined && maleGuessMatch !== null && Array.isArray(maleGuessMatch) && maleGuessMatch.length > 0) {
        //console.log(maleGuessMatch);
        details.gender = "זכר";
    }
}

function findCities(items, test) {
    var i;
    items.forEach(function (item) {
        var locations = item.text.split(", ");
        //console.log("study locations: " + studyLocations[0]);
        var found = false;
        for (i = locations.length - 1; i >= 0 && !found; i--) {
            found = findCity(locations, i, item);
        }
        if (test) {
            console.log("***************item************");
            console.log(item);
        }
    })
    return i;
}

function removeUnnecessarySigns(str) {
    if (str === null || str === undefined) {
        return str;
    }

    var _str = str.replace(/,|\\n|<br>|\-|\./g, "");
    if (_str.charAt(0) === " ") {
        _str = _str.substr(1);
    }
    if (_str.charAt(_str.length - 1) === " ") {
        _str = _str.substr(0, _str.length - 1);
    }

    return _str;
}

function parseData(value, details) {
    //if(value.attribs !== undefined && value.attribs.class === "artist_and_sideinfo")

    if (value.attribs !== undefined && value.attribs.class === "clearfloat" &&
        value.next !== null && value.next.children !== undefined) {
        details.generalInfo = getDataWithNewLines(value.next.children, function (data) {
            return data;
        });

        if (details.generalInfo !== undefined) {
            var birthYearRegExp = /(?:נולדה|נולד)(?: )(?:(?:[א-ת]|,)*(?: ))*(?:(?:ב).?)*(\d\d\d\d)/g;
            var birthCity = /(?:נולדה|נולד) (?:בקיבוץ|במושב|ב)(?:((?:[א-ת]|,| )*) (?:(?:בשנת|ב).?)+(?:.?\d\d\d\d)|(?:\d\d\d\d.?(?:ב|,))?((?:[א-ת]|,| )*))/g; //TODO:

            details.generalInfo.forEach(function (value, key) {

                var birthYearMatch = birthYearRegExp.exec(value);
                var birthCityMatch = birthCity.exec(value);

                //get the year
                if (birthYearMatch !== null && Array.isArray(birthYearMatch) && birthYearMatch.length > 1) {
                    details.birthYear = birthYearMatch[1];
                }

                //get the city
                if (birthCityMatch !== null && Array.isArray(birthCityMatch) && birthCityMatch.length > 1) {
                    var birthCityStr = removeUnnecessarySigns(birthCityMatch[1]);
                    if (cities.getCities().indexOf(birthCityStr) > -1) {
                        details.birthCity = birthCityStr;
                        details.birthCountry = "ישראל";
                    } else if (countries.getCountries().indexOf(birthCityStr) > -1) {
                        details.birthCountry = birthCityStr;
                    }

                    if (birthCityStr === undefined || birthCityStr === null) {
                        birthCityStr = removeUnnecessarySigns(birthCityMatch[2]);
                        if (cities.getCities().indexOf(birthCityStr) > -1) {
                            details.birthCity = birthCityStr;
                            details.birthCountry = "ישראל";
                        } else if (countries.getCountries().indexOf(birthCityStr) > -1) {
                            details.birthCountry = birthCityStr;
                        }

                    }


                }

                findGender(value, details);
            })

        }
    }

    if (value.children !== undefined) {
        value.children.forEach(function (child, key1) {
                switch (child.name) {
                    case "strong": {
                        child.children.forEach(function (child1, key1) {
                            if (child1.data === "לימודים") {
                                details.study = getDataWithNewLines(value.next.children, parseTextWithDatesToJson);
                                findCities(details.study, true);
                            } else if (child1.data === "הוראה") {
                                details.teaching = getDataWithNewLines(value.next.children, parseTextWithDatesToJson);
                                findCities(details.teaching);
                            } else if (child1.data === "פרסים") {
                                details.awards = getDataWithNewLines(value.next.children, parseTextWithDatesToJson);
                                findCities(details.awards);
                            }
                        });
                        break;
                    }
                }
            }
        );
    }
}


function parseTextWithDatesToJson(data) {
    var result = {};


    var regExp = /(?:(\d\d\d\d)-?(?:(\d\d\d\d|\d\d))? ?)?(.*)/g;
    var groups = regExp.exec(data);


    if (groups === null || !Array.isArray(groups)) {
        return data;
    }

    //get the start year
    if (groups.length > 1 && groups[1] !== undefined) {
        result.startYear = groups[1];
    }

    //get the end year
    if (groups.length > 2 && groups[2] !== undefined) {
        result.endYear = groups[2];
    }
    //get the start year
    if (groups.length > 3 && groups[3] !== undefined) {
        result.text = groups[3];
    }

    return result;
}

function replaceNewLinesWithEmpty(str) {
    return str.replace(/(\r\n)*/g, "");
}

/**
 * add start and end date to specific exhibition
 */
function addStartAndEndDate(exhibition) {
    var regex = /((?:(?:\d\d|\d) (?:[א-ת]| |,)*(?:\d\d\d\d))|(?:\d\d\d\d))(?: - )*((?:(?:\d\d|\d) (?:[א-ת]| |,)*(?:\d\d\d\d))|(?:\d\d\d\d))*/g;

    var match = regex.exec(exhibition.time);

    if (match !== null && Array.isArray(match) && match.length > 1) {
        exhibition.startDate = match[1];
        exhibition.endDate = match[2];
    }
}

function findInCities(locations, i, exhibition) {
    if (cities.getCities().indexOf(locations[i]) > -1) {
        exhibition.city = locations[i];
        console.log("findInCities");
        console.log(exhibition);
        return true;
    }

}

function findCity(locations, i, exhibition) {
    if (findInCities(locations, i, exhibition)) {
        return true;
    }
    locations[i] = locations[i].replace("-", " ");
    if (findInCities(locations, i, exhibition)) {
        return true;
    }
    // locations[i] = locations[i].replace("\'", "\"");
    // if(findInCities(locations, i, exhibition)){
    //     return true;
    // }
    var splited = locations[i].split(" ");
    for (var j = splited.length; j >= 0; j--) {
        if (findInCities(splited, j, exhibition)) {
            return true;
        }
    }
    return false;
}


function getExhibitions(exhibitionsUrl, deferred, details) {
    var deferred = Q.defer();

    c.queue([{
        uri: encodeURI(exhibitionsUrl),
        priority: 2,
        // The global callback won't be called
        callback: function (error, result, done) {
            if (error) {
                console.log(error);
                deferred.reject(error);
            } else {
                //console.log(result);
                var $ = result.$;

                var fieldSets = $(".showExh tr");
                if (fieldSets !== undefined) {
                    var exhibitions = [];
                    fieldSets.children().each(function (key, value) {

                        var exhibition = {};

                        value.children.forEach(function (val) {
                            switch (val.name) {
                                case 'strong': {
                                    // console.log(val.children[0]);
                                    exhibition.name = replaceNewLinesWithEmpty(val.children[0].children[0].data);
                                    break;
                                }
                                case 'div': {
                                    // console.log(val.children[0]);
                                    exhibition.location = replaceNewLinesWithEmpty(val.children[0].data);
                                    var locations = exhibition.location.split(", ");
                                    // console.log("locations: " + locations);
                                    var found = false;
                                    for (var i = locations.length - 1; i >= 0 && !found; i--) {
                                        found = findCity(locations, i, exhibition);
                                    }

                                    if (val.children[2] !== undefined) {
                                        exhibition.time = replaceNewLinesWithEmpty(val.children[2].data);
                                    }

                                    if (exhibition.time !== undefined) {
                                        addStartAndEndDate(exhibition);
                                    }

                                    break;
                                }
                            }
                        });

                        //if exhibition is not empty
                        if (!(Object.keys(exhibition).length === 0 && exhibition.constructor === Object)) {
                            exhibitions.push(exhibition);
                        }
                        // console.log(value);
                    });
                    deferred.resolve(exhibitions);
                }


                done();
            }
        }
    }]);

    return deferred.promise;
}

function saveToDatabase(artistData) {
    var Artist = require('./api/models/Artist.js');

    var query = {name: artistData.name};

    if (artistData.birthYear !== undefined) {
        query.birthYear = artistData.birthYear;
    }

    //insert if not exists otherwise update
    Artist.update(query, artistData, {upsert: true}, onInsert);

    function onInsert(err, ans) {
        if (err) {
            console.log("error inserting", artistData.name, "to the database");
            return;
        }

        console.log(artistData.name, "inserted successfully to the database");
    }
}

function getArtistData(url) {

    var deferred = Q.defer();
    c.queue([{
        uri: encodeURI(url),

        // The global callback won't be called
        callback: function (error, result, done) {
            if (error) {
                console.log(error);
                deferred.resolve();
            } else {

                var details = {};
                var $ = result.$;
                var nameStr = $("div.artistinfo div h2 strong").text();
                details.name = removeUnnecessarySigns(nameStr);

                //get the picture full path url + copyright
                var att = $("div.portrait_box img")[0].attribs;
                var cr = $("div.portrait_container strong")
                if ((att !== undefined && att.src !== undefined) ||
                    (cr !== undefined)) {
                    details.image = {};
                }

                if (att !== undefined && att.src !== undefined &&
                    att.src !== MISSING_ARTIST_IMG) {
                    details.image['url'] = ("http://museum.imj.org.il" + att.src);
                }
                if (cr !== undefined) {
                    var crRegExp = /(?:תצלום\: . )((?:[א-ת]| |-|\'|\")*)/g;
                    var copyRight = crRegExp.exec(cr.text());
                    if (copyRight !== null) {
                        details.image['copyright'] = copyRight[1];
                    }
                }

                //use when all the information is under class "artistinfo"
                $("div.artistinfo > *").each(function (key, value) {
                    parseData(value, details);
                });

                //use when all the information is next to class "artistinfo"
                var value = $("div.artistinfo")[0];
                while ((value = value.next) != null) {
                    parseData(value, details);
                }


                //exhibitions page exists?
                if ($("div.artist_and_sideinfo").html().indexOf('/artcenter/newsite/he/exhibitions/') > -1) {

                    var urlParts = URL.parse(url, true);
                    var exhibitionsUrl = EXHIBITIONS_BASE_URL + urlParts.query.artist;

                    getExhibitions(exhibitionsUrl, deferred, details)
                        .then(function (data) {

                            details.exhibitions = data;

                            if (START_DATABASE) {
                                saveToDatabase(details);
                            }

                            return deferred.resolve(details);
                        })
                        .catch(function () {
                            return deferred.resolve(details);
                        });
                } else {
                    console.log("exhibition not found for", details.name);


                    //TODO: why only if no exhibitions found?!!
                    if (START_DATABASE) {
                        saveToDatabase(details);
                    }

                    deferred.resolve(details);
                }
            }
            done();
        }
    }

    ]);
    return deferred.promise;
}

module.exports.init = init;
