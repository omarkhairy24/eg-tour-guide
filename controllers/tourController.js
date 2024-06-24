const AppError = require('../middlewares/AppError');
const catchAsync = require('../middlewares/catchAsync');
const Tours = require('../models/tours');
const User = require('../models/users');
const mongoose = require('mongoose')
const Fav = require('../models/favoritePlace');

const filteredtours = (tours, fav) => {
	return tours.map((tour, i) => ({
		_id: tour._id,
		name: tour.name,
		image: tour.places[0].place.images[0],
		duration: tour.duration,
		ratingAverage: tour.ratingAverage,
		ratingQuantity: tour.ratingQuantity,
		saved: fav[i],
	}));
};

const isFav = async (tours, userId) => {
	const favStatuses = await Promise.all(
		tours.map(async (tour) => {
			const saved = await Fav.findOne({ user: userId, tour: tour._id });
			return !!saved;
		})
	);
	return favStatuses;
};

exports.getTours = catchAsync(async (req, res, next) => {
	const tours = await Tours.find({user:null}).lean();
	res.status(200).json({
		status: 'success',
		tours: filteredtours(tours, await isFav(tours, req.user.id)),
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	const tour = await Tours.findById(req.params.tourId).populate('reviews');
	let images = [];
	let isSave;
	tour.places.forEach((place) => {
		images.push(place.place.images[0]);
	});
	const saved = await Fav.findOne({ user: req.user.id, tour: tour._id });

	if (saved) isSave = true;
	else isSave = false;

	const duration = Math.max(...tour.places.map(place => place.day));

	const relatedTours = await Tours.find({
		type: tour.type,
		_id: { $ne: tour._id },
	}).limit(5);

	if(tour.user) {
		tour.type = null
	}

	res.status(200).json({
		status: 'success',
		tour: {
			_id: tour._id,
			name: tour.name,
			images: images,
			description: tour.description,
			duration: duration,
			ratingAverage: tour.ratingAverage,
			ratingQuantity: tour.ratingQuantity,
			type:tour.type,
			saved: isSave,
			reviews: tour.reviews,
		},
		relatedTours: filteredtours(
			relatedTours,
			await isFav(relatedTours, req.user.id)
		),
	});
});

exports.getTourDetails = catchAsync(async (req, res, next) => {
	const tourId = new mongoose.Types.ObjectId(req.params.tourId);
	const tourInfo = await Tours.findById(req.params.tourId)
	const tour = await Tours.aggregate([
		{ $match: { _id: tourId } },
		{ $unwind: '$places' },
		{
			$lookup: {
				from: 'places',
				localField: 'places.place',
				foreignField: '_id',
				as: 'placeDetails',
			},
		},
		{ $unwind: '$placeDetails' },
		{
			$group: {
				_id: '$places.day',
				places: {
					$push: {
						placeDetails: {
							_id: '$placeDetails._id',
							name: '$placeDetails.name',
							govNAme: '$placeDetails.govName',
							images: '$placeDetails.images',
							ratingAverage:'$placeDetails.ratingAverage',
							ratingQuantity:'$placeDetails.ratingQuantity'
						},
						time: '$places.time'
					}
				},
			},
		},
		{
			$project: {
				_id: 0,
				day: '$_id',
				places: 1
			},
		},
		{ $sort: { day: 1 } },
	]);

	res.status(200).json({
		status: 'success',
		name:tourInfo.name,
		startDate:tourInfo.startDate || null,
		details: tour,
	});
});

exports.createTour = catchAsync(async (req, res, next) => {
	const data = {
		name: req.body.name,
		description: req.body.description,
	};

	const user = await User.findById(req.user.id).select('+role');
	if (user.role === 'user') {
		data.user = user._id;
	}

	const tour = await Tours.create(data);
	res.status(200).json({
		status: 'success',
		tour,
	});
});

exports.addPlacesToTour = catchAsync(async (req, res, next) => {
	const [tour , places] = await Promise.all([
		Tours.findById(req.params.tourId),
		Tours.findById(req.params.tourId).select('places')
	])

	if (!tour) {
		return next(new AppError('tour not found', 404));
	}

	if (tour.user) {
		const user = await User.findById(req.user.id).select('+role');
		if (tour.user._id.toString() !== user._id.toString()) {
			return next(new AppError('not allowed', 403));
		}
		tour.reviews = undefined
		tour.type = undefined
	}

	const data = {
		place: req.body.placeId,
		time: req.body.time,
	};

	let maxDay = 1;
	let dayTimes = {};
	
	places.places.forEach(place => {
		if (!dayTimes[place.day]) {
			dayTimes[place.day] = 0;
		}
		dayTimes[place.day] += place.time;
		maxDay = Math.max(maxDay, place.day);
	});
	
	if (!dayTimes[maxDay]) {
		dayTimes[maxDay] = 0;
	}
	
	if (dayTimes[maxDay] + data.time > 12) {
		data.day = maxDay + 1;
	} else {
		data.day = maxDay;
	}

	tour.places.push(data);
	await tour.save();

	tour.duration = Math.max(...tour.places.map(place => place.day));

	await tour.save()

	res.status(200).json({
		status: 'success'
	});
});

exports.removePlaceFromTour = catchAsync(async (req, res, next) => {
	let tour = await Tours.findById(req.params.tourId);
	if (!tour) {
		return next(new AppError('tour not found', 404));
	}
	
	if (tour.user) {
		const user = await User.findById(req.user.id).select('+role');
		if (tour.user._id.toString() !== user._id.toString()) {
			return next(new AppError('not allowed', 403));
		}
	}

	tour.places.pull(req.body.objectId);

	await tour.save();

	res.status(200).json({
		status: 'success',
		tour,
	});
});

exports.updateTourDetails = catchAsync(async (req, res, next) => {
	let tour = await Tours.findById(req.params.tourId);
	if (!tour) {
		return next(new AppError('tour not found', 404));
	}
	
	if (tour.user) {
		const user = await User.findById(req.user.id).select('+role');
		if (tour.user._id.toString() !== user._id.toString()) {
			return next(new AppError('not allowed', 403));
		}
		if(req.body.type) return next(new AppError('not allowed to pass type',403));
		tour.reviews = undefined
		tour.type = undefined
	}

	const data = {
		name: req.body.name,
		duration: req.body.duration,
		startDate: req.body.startDate,
		description: req.body.description,
		type: req.body.type,
	};

	tour = await Tours.findByIdAndUpdate(req.params.tourId, data, { new: true });

	res.status(200).json({
		status: 'success',
		tour,
	});
});

exports.deleteTour = catchAsync(async (req, res, next) => {
	let tour = await Tours.findById(req.params.tourId);
	if (!tour) {
		return next(new AppError('tour not found', 404));
	}
	const user = await User.findById(req.user.id).select('+role');
	if (tour.user) {
		if (tour.user._id.toString() !== user.id.toString()) {
			return next(new AppError('not allowed', 403));
		}
	}

	await Tours.findByIdAndDelete(req.params.tourId);

	res.status(200).json({
		status: 'success',
		message: 'tour deleted successfully',
	});
});

exports.getUserTours = catchAsync(async(req,res,next) =>{
	const tours = await Tours.find({user:req.user.id});
	tours.map(tour =>{
		tour.type = undefined
	})
	res.status(200).json({
		status:'success',
		tours:filteredtours(tours,await isFav(tours,req.user.id))
	})
})