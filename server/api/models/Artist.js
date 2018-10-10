var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

// create a schema
var artistSchema = new Schema({
        name: {type: String, required: true},
        image: {
            url: {type: String},
            copyright: {type: String}
        },
        generalInfo: [String],
        birthYear: String,
        gender: String,
        birthCity: String,
        birthCountry: String,
        study: [{
            startYear: String,
            endYear: String,
            text: String,
            city: String
        }],
        teaching: [{
            startYear: String,
            endYear: String,
            text: String,
            city: String
        }],
        awards: [{
            startYear: String,
            endYear: String,
            text: String,
            city: String
        }],
        exhibitions: [{
            name: String,
            location: String,
            time: String,
            startDate: String,
            endDate: String,
            city: String
        }]

    },
    {
        strict: true,
        timestamps:
            true
    });

artistSchema.plugin(mongoosePaginate);

// the schema is useless so far
// we need to create a model using it
var Artist = mongoose.model('Artist', artistSchema);

// make this available to our users in our Node applications
module.exports = Artist;