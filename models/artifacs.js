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
    },
    material:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    ar:String
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});

artifacsSchema.pre(/^find/, function (next) {
	this.populate({
		path:'museum',
		select:'name'
    })
	next();
});

module.exports = mongoose.model('Artifacs',artifacsSchema);