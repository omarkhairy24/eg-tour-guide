const Places = require('../models/places');
const catchAsync = require('../middlewares/catchAsync');
const History = require('../models/history');
const multer = require('multer');
const AppError = require('../middlewares/AppError');

const multerStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/img/places');
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + file.originalname);
	},
});

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) cb(null, true);
	else cb(new AppError(400, 'only images are accepted'), false);
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

exports.uploadImages = upload.array('images');

exports.createPlace = catchAsync(async (req, res, next) => {
	let images = [];
	let files = req.files;
	if (req.files) {
		for (let file of files) {
			images.push(file.filename);
		}
	}

	const { lat, lng } = req.body;
	const place = await Places.create({
		name: req.body.name,
		images: images,
		govName: req.body.govName,
		description: req.body.description,
		category: req.body.category,
		location: {
			coordinates: [lat, lng],
		},
		type: req.body.type,
	});
	res.status(201).json({
		status: 'success',
		place,
	});
});

exports.updatePlace = catchAsync(async (req, res, next) => {
	const placeId = req.params.placeId;
	let place = await Places.findById(placeId);
	if (!place) {
		return next(new AppError('place not found', 404));
	}
	let updateData = {
		name: req.body.name,
		govName: req.body.govName,
		description: req.body.description,
		category: req.body.category,
	};

	let images;
	let files = req.files;
	console.log(files);
	if (req.files && req.files.length > 0) {
		images = [];
		for (let file of files) {
			images.push(file.filename);
		}
		updateData.images = images;
	}

	place = await Places.findByIdAndUpdate(placeId, updateData, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		status: 'success',
		place,
	});
});

exports.deletePlace = catchAsync(async (req, res, next) => {
	await Places.findByIdAndDelete(req.params.placeId);
	res.status(200).json({
		status: 'success',
		message: 'place deleted successfully',
	});
});

exports.getPlace = catchAsync(async (req,res,next)=>{
    const [place ,history ] = await Promise.all([
        Places.findById(req.params.placeId).populate('reviews'),
        History.findOne({user:req.user.id})
    ]);
    if (history){
        history.place.push(place._id)
        await history.save()
    }else{ 
        History.create({
            user:req.user.id,
            place:place._id
        });
    }
    res.status(200).json({
        status:'success',
        place
    })
})

exports.getPlaces = catchAsync(async (req, res, next) => {
	const places = await Places.find();
	res.status(200).json({
		status: 'success',
		places,
	});
});
