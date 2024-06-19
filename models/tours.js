const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    startDate:{
        type:Date
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User'
    },
    places:[{
        place:{
            type:mongoose.Schema.ObjectId,
            ref:'Places',
        },
        day:{
            type: Number
        }
    }],
    type:{
        type:String,
        enum:['Cultural', 'Historical', 'Entertainment','Religion','Adventure','Ecotourism']
    },
    description:{
        type:String
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
    }
},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

tourSchema.virtual('reviews',{
    ref:'Review',
    localField:'_id',
    foreignField:'tour'
});

tourSchema.pre(/^find/,function(next){
    this.populate({
        path:'user',
        select:'username photo'
    }).populate('places')
    next()
})

module.exports = mongoose.model('Tours',tourSchema);