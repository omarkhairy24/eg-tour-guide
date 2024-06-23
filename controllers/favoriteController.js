const Favorite = require('../models/favoritePlace');
const catchAsync = require('../middlewares/catchAsync');


const filteredPlaces = (places) =>{
    return places.map(place =>({
        _id:place.place._id,
        name:place.place.name,
        image:place.place.images[0],
        govName:place.place.govName,
        category:place.place.category,
        ratingAverage:place.place.ratingAverage,
        ratingQuantity:place.place.ratingQuantity
    }))
}

const filteredartifacs = (artifacs) =>{
    return artifacs.map(artifac =>({
        _id:artifac.artifacs._id,
        name:artifac.artifacs.name,
        image:artifac.artifacs.images[0],
        museumName:artifac.artifacs.museum.name,
        type:artifac.artifacs.type
    }))
}

const filteredtours = (tours) => {
	return tours.map(tour => ({
		_id: tour.tour._id,
		name: tour.tour.name,
		image: tour.tour.places[0].place.images[0],
		duration: tour.tour.duration,
		ratingAverage: tour.tour.ratingAverage,
		ratingQuantity: tour.tour.ratingQuantity,
	}));
};

exports.getFavorites = catchAsync(async(req,res,nex)=>{
    const [favPlaces , favArtifacs,favTours] = await Promise.all([
        Favorite.find({user:req.user.id , place:{$ne:null}}).select('place'),
        Favorite.find({user:req.user.id,artifacs:{$ne:null}}).select('artifacs'),
        Favorite.find({user:req.user.id,tour:{$ne:null}}).select('tour'),
    ])

    res.status(200).json({
        status:'success',
        places:filteredPlaces(favPlaces),
        artifacs:filteredartifacs(favArtifacs),
        tours:filteredtours(favTours)
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

exports.addFavTour = catchAsync(async(req,res,next)=>{
    let Fav;
    const isFav = await Favorite.findOne({user:req.user.id,tour:req.params.tourId});
    if(isFav){
        await Favorite.findOneAndDelete({user:req.user.id,tour:req.params.tourId});
    }
    else{
        Fav = await Favorite.create({
            user:req.user.id,
            tour:req.params.tourId
        })
    }

    res.status(200).json({
        status:'success',
        Fav
    })
});