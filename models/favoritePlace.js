const mongoose = require('mongoose');

const favSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    place:{
        type:mongoose.Schema.ObjectId,
        ref:'Places'
    },
    artifacs:{
        type:mongoose.Schema.ObjectId,
        ref:'Artifacs'
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tours'
    }
});

favSchema.index({user:1,place:1,artifacs:1},{unique:true});

favSchema.pre(/^find/,function(next){
    this.populate('place artifacs');
    next();
});

module.exports = mongoose.model('Favorite',favSchema);