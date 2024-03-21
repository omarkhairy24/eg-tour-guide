const AppError = require('../middlewares/AppError');
const catchAsync = require('../middlewares/catchAsync');
const Tours = require('../models/tours');
const User = require('../models/users');

exports.getTour = catchAsync(async(req,res,next)=>{
    const tour = await Tours.findById(req.params.tourId).populate('reviews');
    res.status(200).json({
        status:'success',
        tour
    })
})

exports.createTour = catchAsync(async (req,res,next)=>{
    const data = {
        name:req.body.name,
        places:req.body.places
    }
    const user = await User.findById(req.user.id).select('+role');
    if(user.role === 'user'){
        data.user = user._id
    }
    const tour = await Tours.create(data);
    res.status(200).json({
        status:'success',
        tour
    })
});

exports.updateTour = catchAsync(async(req,res,next)=>{
    let tour = await Tours.findById(req.params.tourId);
    if(!tour){
        return next(new AppError('tour not found',404))
    }
    
    const user = await User.findById(req.user.id).select('+role');
    
    if(tour.user){
        if(tour.user._id.toString() !== user._id.toString()){
            return next(new AppError('not allowed',403))
        }
    }

    tour = await Tours.findByIdAndUpdate(req.params.tourId,req.body,{new:true});

    res.status(200).json({
        status:'success',
        tour
    })
});

exports.deleteTour = catchAsync(async(req,res,next)=>{
    let tour = await Tours.findById(req.params.tourId);
    if(!tour){
        return next(new AppError('tour not found',404))
    }
    const user = await User.findById(req.user.id).select('+role');
    if(tour.user){
        if(tour.user._id.toString() !== user.id.toString()){
            return next(new AppError('not allowed',403))
    }}

    await Tours.findByIdAndDelete(req.params.tourId)

    res.status(200).json({
        status:'success',
        message:'tour deleted successfully'
    })
})