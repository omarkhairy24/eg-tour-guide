const mongoose = require('mongoose')

const historySchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true,
        unique:true
    },
    place:[{
        type:mongoose.Schema.ObjectId,
        ref:'Places',
        required:true
    }]
})

module.exports = mongoose.model('History',historySchema)