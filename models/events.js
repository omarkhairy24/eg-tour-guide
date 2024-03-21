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
    eDate:{
        type:Date,
        required:true,
        validate:{
            validator:function(val){
                return val > this.sDate
            },
            message:'this date is before the start date'
        }
    }
});

module.exports = mongoose.model('Events',eventSchema)