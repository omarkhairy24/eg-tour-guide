const mongoose = require('mongoose');

const artifacsSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    museum:{
        type:mongoose.Types.ObjectId,
        ref:'Places',
        required:true
    },
    images:[String],
    description:{
        type:String,
        required:true
    }
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});


module.exports = mongoose.model('Artifacs',artifacsSchema);