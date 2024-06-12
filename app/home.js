const Places = require('../models/places');
const Events = require('../models/events');
const History = require('../models/history');
const Fav = require('../models/favoritePlace');
const Recommedation = require('../middlewares/recommendation');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../middlewares/AppError');
const Artifacs = require('../models/artifacs');

const filteredPlaces = (places,fav) =>{
    return places.map((place,i) =>({
        _id:place._id,
        name:place.name,
        image:place.images[0],
        govName:place.govName,
        ratingAverage:place.ratingAverage,
        ratingQuantity:place.ratingQuantity,
        saved:fav[i]
    }))
}

const filteredartifacs = (places,fav) =>{
    return places.map((place,i) =>({
        _id:place._id,
        name:place.name,
        image:place.images[0],
        museumName:place.museum.name,
        saved:fav[i]
    }))
}

const isFav = async (places, userId) => {
    const favStatuses = await Promise.all(places.map(async (place) => {
        const saved = await Fav.findOne({ user: userId, place: place._id });
        return !!saved;
    }));
    return favStatuses;
}

const isFavArtifacs = async (places, userId) => {
    const favStatuses = await Promise.all(places.map(async (place) => {
        const saved = await Fav.findOne({ user: userId, artifacs: place._id });
        return !!saved;
    }));
    return favStatuses;
}

function generateSearchFields(fields, searchQ) {
    return fields.flatMap(field => [
        { [field]: { $regex: searchQ, $options: "i" } },
        { [field]: { $regex: searchQ, $options: "xi" } },
        { [field]: { $regex: searchQ, $options: "x" } }
    ]);
}

exports.getHome = catchAsync(async(req,res)=>{
    const [event,recommendation , topPlaces ,places,history,recentAdded] = await Promise.all([
        Events.find().select('name images'),
        Recommedation(req,res),
        Places.find().sort({ratingAverage:-1}).limit(10).select('name images govName ratingAverage ratingQuantity'),
        Places.find().limit(10).select('name images govName ratingAverage ratingQuantity updatedAt'),
        History.findOne({user:req.user.id}).populate('place').select('place'),
        Places.find().sort({'_id':-1}).limit(10).select('name images govName ratingAverage ratingQuantity updatedAt')
    ])

    const [recommendationFavStatuses,topPlacesFavStatuses,placesFavStatuses,historyFavStatuses,recentlyAdded] = await Promise.all([
        isFav(recommendation, req.user.id),
        isFav(topPlaces, req.user.id),
        isFav(places, req.user.id),
        history ? isFav(history.place, req.user.id) : [],
        isFav(recentAdded,req.user.id)
    ])

    res.status(200).json({
        event,
        suggestedForYou: filteredPlaces(recommendation, recommendationFavStatuses),
        topRated: filteredPlaces(topPlaces, topPlacesFavStatuses),
        explore: filteredPlaces(places, placesFavStatuses),
        recentlyAdded:filteredPlaces(recentAdded,recentlyAdded),
        recentlyViewed: history ? filteredPlaces(history.place, historyFavStatuses) : []
    })
})

exports.getLandMarks = catchAsync(async (req,res,next) =>{
    const places = await Places.find().select('name images govName ratingAverage ratingQuantity');
    const isFavPlaces = await isFav(places,req.user.id)

    res.status(200).json({
        status:'success',
        places:filteredPlaces(places,isFavPlaces)
    })
})

exports.getLandMark = catchAsync(async (req,res,next)=>{
    const place = await Places.findById(req.params.placeId).populate('reviews');
    if(!place) return next(new AppError('not found',404));

    let isSaved;
    const saved = await Fav.findOne({user:req.user.id,place:place._id})
    if (saved) isSaved = true
    else isSaved = false ;

    const relatedPlaces = await Places.find({category:place.category}).limit(5)

    res.status(200).json({
        status:'success',
        place:{
            _id:place._id,
            name:place.name,
            images:place.images,
            govName:place.govName,
            description:place.description,
            location:place.location,
            type : `${place.category},${place.type}`,
            saved:isSaved,
            reviews:place.reviews,
            model:place.vrModel
        },
        relatedPlaces:filteredPlaces(relatedPlaces,await isFav(relatedPlaces,req.user.id))
    })
})

exports.getArtifacts = catchAsync(async(req,res,next) =>{
    const artifacs = await Artifacs.find().select('name images museum').populate('museum','name');
    res.status(200).json({
        status:'success',
        artifacs:filteredartifacs(artifacs,await isFavArtifacs(artifacs,req.user.id))
    })
})


exports.getArtifac = catchAsync(async(req,res,next) =>{
    const artifac = await Artifacs.findById(req.params.artifacId).populate('museum','name')
    if(!artifac) return next(new AppError('not found',404));
    let isSaved;
    const saved = await Fav.findOne({user:req.user.id,artifacs:artifac._id})
    if (saved) isSaved = true
    else isSaved = false ;

    const relatedArtifacs = await Artifacs.find({'_id':{$ne:artifac._id}}).limit(5)
    res.status(200).json({
        status:'success',
        artifac: {
        _id: artifac._id,
        name: artifac.name,
        museum: artifac.museum,
        images:artifac.images,
        description:artifac.description,
        saved:isSaved
    },
        relatedArtifacs:filteredartifacs(relatedArtifacs,await isFavArtifacs(relatedArtifacs))
    })
})

exports.search = catchAsync(async(req,res,next)=>{
    let searchQ = req.query.searchQ
    let resultField = generateSearchFields(['name' , 'category' , 'govName'],searchQ)
    const placeResult = await Places.find({$or:resultField});
    const artifacResult = await Artifacs.find({$or:resultField});
    res.status(200).json({
        status:'success',
        data:{
            places: filteredPlaces(placeResult,await isFav(placeResult)),
            artifacs :filteredartifacs(artifacResult,await isFavArtifacs(artifacResult))
        }
    })  
})