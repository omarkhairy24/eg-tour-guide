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
    eDate:{
        type:Date,
        required:true,
        validate:{
            validator:function(val){
                return val > this.sDate
            },
            message:'this date is before the start date'
        }
    },
    category:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('Events',eventSchema)