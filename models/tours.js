const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    startDate:{
        type:Date
    },
    duration:Number,
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User'
    },
    type:{
        type:String,
        enum:['Cultural', 'Historical', 'Entertainment','Religion','Adventure','Ecotourism']
    },
    places:[{
        place:{
            type:mongoose.Schema.ObjectId,
            ref:'Places',
        },
        time:Number,
        day:{
            type:Number,
            default:1
        }
    }],
    description:{
        type:String,
        required:true
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
    }).populate({
        path:'places.place',
        select:'images'
    })
    next()
})

module.exports = mongoose.model('Tours',tourSchema);