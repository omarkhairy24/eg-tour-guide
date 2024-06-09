const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    govName:{
        type:String,
        required:true
    },
    images:[String],
    description:{
        type:String,
        required:true
    },
    location:{
        type:{
            type:String,
            enum:['Point']
        },
        coordinates:[Number]
    },
    type:{
        type:String,
        required:true,
        enum:['Museums', 'Liberary', 'Luxury','Ecotourism','Mosque']
    },
    category:{
        type:String,
        required:true,
        enum:['Cultural', 'Historical', 'Entertainment','Religion','Adventure','Ecotourism']
    },
    ratingAverage:{
        type:Number,
        default:0,
        min:0,
        max:5,
        set:val => Math.round(val*10)/10
    },
    ratingQuantity:{
        type:Number,
        default:0
    },
    vrModel:String
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});


placeSchema.virtual('reviews',{
    ref:'Review',
    localField:'_id',
    foreignField:'place'
});

module.exports = mongoose.model('Places',placeSchema);