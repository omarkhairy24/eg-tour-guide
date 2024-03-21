const catchAsync = require('../middlewares/catchAsync');
const Review = require('../models/review');
const Places = require('../models/places');
const Tours = require('../models/tours');
const AppError = require('../middlewares/AppError');

exports.addPlaceReview = catchAsync(async (req,res,next)=>{
    const place = await Places.findById(req.params.placeId)
    if(!place){
        return next(new AppError('place not found',404));
    }

    const review = await Review.create({
        place:place._id,
        user:req.user.id,
        review:req.body.review,
        rating:req.body.rating,
    })

    res.status(201).json({
        status:'success',
        review
    });
});

exports.addToursReview = catchAsync( async(req,res,next)=>{
    const tour = await Tours.findById(req.params.tourId);
    if(!tour){
        return next(new AppError('tour not found',404))
    }

    const review = await Review.create({
        tour:tour._id,
        user:req.user.id,
        review:req.body.review,
        rating:req.body.rating,
    })

    res.status(201).json({
        status:'success',
        review
    });

})

exports.updateReview = catchAsync(async (req,res,next)=>{
    let review = await Review.findById(req.params.reviewId);
    if(review.user._id.toString() !== req.user.id){
        return next(new AppError('not allowed',403))
    }
    review = await Review.findByIdAndUpdate(req.params.reviewId,req.body
        ,{new:true,runValidators:true}
    )
    res.status(201).json({
        status:'success',
        message:'review updated successfully',
        review
    })
});

exports.deleteReview = catchAsync(async (req,res,next)=>{
    let review = await Review.findById(req.params.reviewId);
    if(review.user._id.toString() !== req.user.id){
        return next(new AppError('not allowed',403))
    }
    await Review.findByIdAndDelete(req.params.reviewId);
    res.status(200).json({
        status:'success',
        message:'review deleted successfully'
    })
});