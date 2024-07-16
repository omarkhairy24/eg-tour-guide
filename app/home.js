const Places = require('../models/places');
const Events = require('../models/events');
const History = require('../models/history');
const Fav = require('../models/favoritePlace');
const Recommedation = require('../middlewares/recommendation');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../middlewares/AppError');
const Artifacs = require('../models/artifacs');
const SearchHistory = require('../models/searchHistory');
const tours = require('../models/tours');

const filteredPlaces = (places,fav) =>{
    return places.map((place,i) =>({
        _id:place._id,
        name:place.name,
        image:place.images[0],
        govName:place.govName,
        category:place.category,
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
        type:place.type,
        material:place.material,
        ar:place.ar,
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

const isFavArtifacs = async (aritfacs, userId) => {
    const favStatuses = await Promise.all(aritfacs.map(async (artifac) => {
        const saved = await Fav.findOne({ user: userId, artifacs: artifac._id });
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

exports.getPlacesFilter = catchAsync(async (req,res,next) =>{
    const category = Places.schema.path('category').enumValues;
    const type = Places.schema.path('type').enumValues;
    const location = await Places.distinct('govName')
    res.status(200).json({
        status:'success',
        category,
        type,
        location
    })

});

exports.getArtifactFilter = catchAsync(async(req,res,next) =>{
    const [type , material] = await Promise.all([
        Artifacs.distinct('type'),
        Artifacs.distinct('material')
    ])
    res.status(200).json({
        status:'success',
        type,
        material
    })
})

exports.getTourFilter = catchAsync(async(req,res,next) =>{
    const type = tours.schema.path('type').enumValues;
    res.status(200).json({
        status:'success',
        type
    })
})

exports.getRecommend = async(req,res)=>{
    const places = await Recommedation(req,res)
    res.status(200).json({
        recommended:filteredPlaces(places,await isFav(places,req.user.id))
    })
}

exports.getHome = catchAsync(async(req,res)=>{

    const [event,recommendation , topPlaces ,places,historyPlaces,recentAdded] = await Promise.all([
        Events.find().select('name images'),
        Recommedation(req,res),
        Places.find().sort({ratingAverage:-1}).limit(10).select('name images govName category ratingAverage ratingQuantity'),
        Places.find().limit(10).select('name images govName ratingAverage ratingQuantity category updatedAt'),
        History.findOne({user:req.user.id}).populate('place').select('place').distinct('place'),
        Places.find().sort({'_id':-1}).limit(10).select('name images govName category ratingAverage ratingQuantity updatedAt')
    ])

    const [recommendationFavStatuses,topPlacesFavStatuses,placesFavStatuses,history,recentlyAdded] = await Promise.all([
        isFav(recommendation, req.user.id),
        isFav(topPlaces, req.user.id),
        isFav(places, req.user.id),
        Places.find({_id:historyPlaces}).sort({'_id':-1}).limit(10),
        isFav(recentAdded,req.user.id)
    ])

    res.status(200).json({
        event,
        suggestedForYou: filteredPlaces(recommendation, recommendationFavStatuses),
        topRated: filteredPlaces(topPlaces, topPlacesFavStatuses),
        explore: filteredPlaces(places, placesFavStatuses),
        recentlyAdded:filteredPlaces(recentAdded,recentlyAdded),
        recentlyViewed: history ? filteredPlaces(history, await isFav(history,req.user.id)) : []
    })
})

exports.getLandMarks = catchAsync(async (req,res,next) =>{
    const places = await Places.find().select('name images govName category ratingAverage ratingQuantity').lean();
    const isFavPlaces = await isFav(places,req.user.id)

    res.status(200).json({
        status:'success',
        places:filteredPlaces(places,isFavPlaces)
    })
})

exports.getLandMark = catchAsync(async (req,res,next)=>{
    const [place,history] = await Promise.all([
        Places.findById(req.params.placeId).populate({path: 'reviews',options: { limit: 2, sort: { createdAt: -1 }}}),
        History.findOne({user:req.user.id})
    ]) 
    if(!place) return next(new AppError('not found',404));

    if (history){
        history.place.push(place._id)
        await history.save()
    }else{ 
        History.create({
            user:req.user.id,
            place:place._id
        });
    }

    let isSaved;
    const saved = await Fav.findOne({user:req.user.id,place:place._id})
    if (saved) isSaved = true
    else isSaved = false ;

    const [relatedPlaces,artifacs] = await Promise.all([
        Places.find({category:place.category,_id:{$ne:place._id}}).limit(5).lean(),
        Artifacs.find({museum:place._id}).limit(5).lean()
    ])

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
            ratingAverage:place.ratingAverage,
            ratingQuantity:place.ratingQuantity,
            reviews:place.reviews,
            model:place.vrModel
        },
        relatedPlaces:filteredPlaces(relatedPlaces,await isFav(relatedPlaces,req.user.id)),
        relatedArtifacs:filteredartifacs(artifacs,await isFavArtifacs(artifacs))
    })
})

exports.getArtifacts = catchAsync(async(req,res,next) =>{
    const artifacs = await Artifacs.find().select('name images material museum type').sort({ar:-1})
    res.status(200).json({
        status:'success',
        artifacs:filteredartifacs(artifacs,await isFavArtifacs(artifacs,req.user.id))
    })
})


exports.getArtifac = catchAsync(async(req,res,next) =>{
    const artifac = await Artifacs.findById(req.params.artifacId)
    if(!artifac) return next(new AppError('not found',404));
    let isSaved;
    const saved = await Fav.findOne({user:req.user.id,artifacs:artifac._id})
    if (saved) isSaved = true
    else isSaved = false ;

    const relatedArtifacs = await Artifacs.find({'_id':{$ne:artifac._id},type:artifac.type}).limit(5)
    res.status(200).json({
        status:'success',
        artifac: {
        _id: artifac._id,
        name: artifac.name,
        museum: artifac.museum,
        images:artifac.images,
        description:artifac.description,
        type:artifac.type,
        material:artifac.material,
        ar:artifac.ar,
        saved:isSaved
    },
        relatedArtifacs:filteredartifacs(relatedArtifacs,await isFavArtifacs(relatedArtifacs))
    })
})

exports.search = catchAsync(async(req,res,next)=>{
    let searchQ = req.query.searchQ
    await SearchHistory.create({search:searchQ,user:req.user.id});
    let resultField = generateSearchFields(['name' , 'category' , 'govName'],searchQ)
    const placeResult = await Places.find({ $or: resultField });
    const artifacResult = await Artifacs.find({ $or: resultField }).populate('museum');
    res.status(200).json({
        status: 'success',
        data: {
            places: filteredPlaces(placeResult ,await isFav(placeResult,req.user.id) ),
            artifacs: filteredartifacs(artifacResult,await isFavArtifacs(artifacResult),req.user.id)
        }
    }); 
});


exports.getSearchHistory = catchAsync(async(req,res,next)=>{
    const searchHistory = await SearchHistory.find({user:req.user.id})
    const search = searchHistory.map(sh =>{
        return {
            _id:sh._id,
            search:sh.search
        }
    })
    res.status(200).json({
        status:'success',
        search
    })
})

exports.deleteSearchHistory = catchAsync(async(req,res,next) =>{
    await SearchHistory.deleteMany({user:req.user.id})
    res.status(200).json({
        status:'success',

    })
})