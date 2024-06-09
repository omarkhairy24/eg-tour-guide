const Favorite = require('../models/favoritePlace');
const AppError = require('../middlewares/AppError');
const catchAsync = require('../middlewares/catchAsync');

exports.getFavorites = catchAsync(async(req,res,nex)=>{
    const favorites = await Favorite.find({user:req.user.id});
    res.status(200).json({
        status:'success',
        favorites
    })
})

exports.addFavPlace = catchAsync(async(req,res,next)=>{
    let Fav;
    const isFav = await Favorite.findOne({user:req.user.id,place:req.params.placeId});
    if(isFav){
        await Favorite.findOneAndDelete({user:req.user.id,place:req.params.placeId});
    }
    else{
        Fav = await Favorite.create({
            user:req.user.id,
            place:req.params.placeId
        })
    }

    res.status(200).json({
        status:'success',
        Fav
    })
});

exports.addFavArtifacs = catchAsync(async(req,res,next)=>{
    let Fav;
    const isFav = await Favorite.findOne({user:req.user.id,artifacs:req.params.artifacId});
    if(isFav){
        await Favorite.findOneAndDelete({user:req.user.id,artifacs:req.params.artifacId});
    }
    else{
        Fav = await Favorite.create({
            user:req.user.id,
            artifacs:req.params.artifacId
        })
    }

    res.status(200).json({
        status:'success',
        Fav
    })
});