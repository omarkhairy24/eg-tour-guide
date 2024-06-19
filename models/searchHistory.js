const mongoose = require('mongoose');

const searchHistory = new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    search:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('SearchHistory',searchHistory);