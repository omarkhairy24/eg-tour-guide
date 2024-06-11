const AppError = require('../middlewares/AppError');
const catchAsync = require('../middlewares/catchAsync');
const Events = require('../models/events');

exports.getEvent = catchAsync(async(req,res,next)=>{
    const event = await Events.findById(req.params.eventId);
    res.status(200).json({
        status:'success',
        event
    })
})

exports.getEvents = catchAsync(async(req,res,next)=>{
    const events = await Events.find({eDate : {$gt:Date.now()}})
    res.status(200).json({
        status:'success',
        events
    }) 
})

exports.addEvent = catchAsync(async(req,res,next)=>{
    let images = [];
    let files = req.files 
    if(req.files){
        for (let file of files){
            images.push(file.filename)
        }
    }
    const{lat,lng} = req.body;
    const event = await Events.create({
        name:req.body.name,
        description:req.body.description,
        images,
        sDate:req.body.sDate,
        eDate:req.body.eDate,
        location:{
            coordinates:[lat,lng]
        },
        category:req.body.category
    });

    res.status(201).json({
        status:'success',
        event
    })
})

exports.editEvent = catchAsync(async(req,res,next)=>{
    let event = await Events.findById(req.params.eventId);
    if(!event){
        return next(new AppError('this event is not found',404))
    }

    let images;
    let files = req.files 
    if(req.files && req.files.length > 0 ){
        images = []
        for (let file of files){
            images.push(file.filename)
        }
    }
    event = await Events.findByIdAndUpdate(req.params.eventId,{
        name:req.body.name,
        description:req.body.description,
        images,
        sDate:req.body.sDate,
        eDate:req.body.eDate
    },{new:true});

    res.status(200).json({
        status:'success',
        message:'event updated successfully',
        event
    })
})

exports.deleteEvent = catchAsync(async (req,res,next)=>{
    await Events.findByIdAndDelete(req.params.eventId);
    res.status(200).json({
        status:'success',
        message:'event deleted successfully',
    })
})