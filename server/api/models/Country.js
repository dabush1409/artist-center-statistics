var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

// create a schema
var countrySchema = new Schema({
        name: {type: String, required: true},
        cities: [{
            name: String,
            latitude: Number,
            longitude: Number
        }],
        latitude: Number,
        longitude: Number
    },
    {
        strict: true,
        timestamps:
            true
    });

countrySchema.plugin(mongoosePaginate);

// the schema is useless so far
// we need to create a model using it
var Country = mongoose.model('Country', countrySchema);

// make this available to our users in our Node applications
module.exports = Country;