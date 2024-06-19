const AppError = require('../middlewares/AppError');
const catchAsync = require('../middlewares/catchAsync');
const Tours = require('../models/tours');
const User = require('../models/users');
const mongoose = require('mongoose');
const Fav = require('../models/favoritePlace');

const filteredtours = (tours,fav) =>{
    return tours.map((tour,i) =>({
        _id:tour._id,
        name:tour.name,
        image:tour.places[0].place.images[0],
        duration:tour.duration,
        ratingAverage:tour.ratingAverage,
        ratingQuantity:tour.ratingQuantity,
        saved:fav[i]
    }))
}

const isFav = async (tours, userId) => {
    const favStatuses = await Promise.all(tours.map(async (tour) => {
        const saved = await Fav.findOne({ user: userId, tour: tour._id });
        return !!saved;
    }));
    return favStatuses;
}


exports.getTours = catchAsync(async(req,res,next) =>{
    const tours = await Tours.find().populate('places.place','images').lean()
    res.status(200).json({
        status:'success',
        tours:filteredtours(tours , await isFav(tours ,req.user.id))
    })
})

exports.getTour = catchAsync(async(req,res,next)=>{
    const tour = await Tours.findById(req.params.tourId).populate('reviews places.place','images name');
    let images = []
    let isSave;
    tour.places.forEach(place =>{
        images.push(place.place.images[0]);
    })
    const saved = await Fav.findOne({ user: req.user.id, tour: tour._id });
    
    if(saved) isSave = true 
    else isSave = false

    const relatedTours = await Tours.find({type:tour.type,_id:{$ne:tour._id}}).populate('places.place').limit(5)

    res.status(200).json({
        status:'success',
        tour:{
            _id:tour._id,
            name:tour.name,
            images:images,
            description:tour.description,
            duration:tour.duration,
            type:tour.type,
            ratingAverage:tour.ratingAverage,
            ratingQuantity:tour.ratingQuantity,
            saved:isSave,
            reviews:tour.reviews
        },
        relatedTours:filteredtours(relatedTours,await isFav(relatedTours,req.user.id))
    })
})

exports.getTourDetails = catchAsync(async(req,res,next)=>{
    const tourId = new mongoose.Types.ObjectId(req.params.tourId);
    const tour = await Tours.aggregate([
        {$match:{ "_id" : tourId}},
        { $unwind: '$places' },
        { 
            $lookup: {
                from: 'places',
                localField: 'places.place',
                foreignField: '_id',
                as: 'placeDetails'
            }
        },
        { $unwind: '$placeDetails' },
        {
            $group: {
                _id: '$places.day',
                places: { $push: '$placeDetails' }
            }
        },
        {
            $project: {
                _id: 0,
                day: '$_id',
                places: 1,
            }
        },
        { $sort: { day: 1 } }
    ])
    
    res.status(200).json({
        status:'success',
        details:tour
    })
})

exports.createTour = catchAsync(async (req,res,next)=>{
    const data = {
        name:req.body.name,
        duration:req.body.duration,
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

exports.addPlacesToTour = catchAsync(async(req,res,next)=>{
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

    const data = {
        place:req.body.placeId,
        day:req.body.day
    }

    if (req.body.day > tour.duration) return res.status(400).json({message:'Day must be less than or equal to the duration of the tour'})
    tour.places.push(data)

    await tour.save()

    res.status(200).json({
        status:'success',
        tour
    })
});


exports.removePlaceFromTour = catchAsync(async(req,res,next)=>{
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

    tour.places.pull(req.body.objectId)

    await tour.save()

    res.status(200).json({
        status:'success',
        tour
    })
});

exports.updateTourDetails = catchAsync(async(req,res,next)=>{
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

    const data = {
        name:req.body.name,
        duration:req.body.duration,
        startDate:req.body.startDate,
        description:req.body.description,
        type:req.body.type
    }

    tour = await Tours.findByIdAndUpdate(req.params.tourId,data,{new:true});

    res.status(200).json({
        status:'success',
        tour
    })
})

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