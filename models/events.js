const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    images:[{
        type:String,
    }],
    description:{
        type:String,
        required:true
    },
    sDate:{
        type:Date,
        required:true
    },
    location:{
        type:{
            type:String,
            enum:['Point']
        },
        coordinates:[Number]
    },
    placeName:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('Events',eventSchema)