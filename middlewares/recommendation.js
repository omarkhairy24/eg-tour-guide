const Places = require('../models/places');
const History = require('../models/history');

function cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
}

function createFeatureVector(place) {
    const categories = ['Cultural', 'Historical', 'Entertainment', 'Religion', 'Adventure', 'Ecotourism'];
    const types = ['Museums', 'Liberary', 'Luxury', 'Ecotourism', 'Mosque'];
    const categoryVector = categories.map(cat => place.category === cat ? 1 : 0);
    const typeVector = types.map(type => place.type === type ? 1 : 0);
    const ratingVector = [place.ratingAverage / 5];

    return [...categoryVector, ...typeVector, ...ratingVector];
}


async function Recommedation(req, res) {
    try {
        const [userHistory, allPlaces] = await Promise.all([
            History.findOne({ user: req.user.id }).populate('place').lean(),
            Places.find().lean()
        ]);

        if (!userHistory) {
            const randomPlaces = await Places.aggregate([{ $sample: { size: 8 } }]).exec();
            return randomPlaces;
        }

        const visitedPlaces = userHistory.place;
        const visitedFeatureVectors = visitedPlaces.map(createFeatureVector);

        const allFeatureVectors = allPlaces.map(createFeatureVector);

        const similarityScores = allPlaces.map((place, idx) => {
            const placeVector = allFeatureVectors[idx];
            const maxSimilarity = Math.max(...visitedFeatureVectors.map(vec => cosineSimilarity(vec, placeVector)));
            return { place, score: maxSimilarity };
        });
        
        similarityScores.sort((a, b) => b.score - a.score);

        const recommendedPlaces = similarityScores
            .filter(item => !visitedPlaces.some(visited => visited._id.equals(item.place._id)))
            .slice(0, 10)
            .map(item => item.place);

        return recommendedPlaces;
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}

module.exports = Recommedation;