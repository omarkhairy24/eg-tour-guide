const mongoose = require('mongoose');
const Places = require('./places');
const Tours = require('./tours');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    place: {
        type: mongoose.Schema.ObjectId,
        ref: 'Places'
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tours'
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

reviewSchema.index({ place: 1, user: 1,tour:1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'username photo'
    });
    next();
});

reviewSchema.statics.calculateAverage = async function (targetId, targetType) {
    const stats = await this.aggregate([
        {
            $match: { [targetType]: targetId }
        },
        {
            $group: {
                _id: `$${targetType}`,
                numOfRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if(targetType === 'place'){
        if (stats.length > 0) {
            await Places.findByIdAndUpdate(targetId, {
                ratingAverage: stats[0].avgRating,
                ratingQuantity: stats[0].numOfRating
            });
        } else {
            await Places.findByIdAndUpdate(targetId, {
                ratingAverage: null,
                ratingQuantity: 0
            });
        }
    }
    if(targetType === 'tour'){
        if (stats.length > 0) {
            await Tours.findByIdAndUpdate(targetId, {
                ratingAverage: stats[0].avgRating,
                ratingQuantity: stats[0].numOfRating
            });
        } else {
            await Places.findByIdAndUpdate(targetId, {
                ratingAverage: null,
                ratingQuantity: 0
            });
        }
    }

};

reviewSchema.post('save', function () {
    this.constructor.calculateAverage(this.place, 'place');
    this.constructor.calculateAverage(this.tour, 'tour');
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.rw = await this.clone().findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    await this.rw.constructor.calculateAverage(this.rw.place, 'place');
    await this.rw.constructor.calculateAverage(this.rw.tour, 'tour');
});

module.exports = mongoose.model('Review', reviewSchema);
