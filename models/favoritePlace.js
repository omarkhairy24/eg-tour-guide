const mongoose = require('mongoose');

const favSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    place:{
        type:mongoose.Schema.ObjectId,
        ref:'Places',
        required:true
    }
});

favSchema.index({user:1,place:1},{unique:true});

favSchema.pre(/^find/,function(next){
    this.populate('place');
    next();
});

module.exports = mongoose.model('Favorite',favSchema);