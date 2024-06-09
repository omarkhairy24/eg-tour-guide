const Places = require('../models/places');
const History = require('../models/history');

function cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
}

function createFeatureVector(place) {
    const categories = ['Cultural', 'Historical', 'Entertainment','Religion','Adventure','Ecotourism'];
    const types = ['Museums', 'Liberary', 'Luxury','Ecotourism','Mosque'];
    const categoryVector = categories.map(cat => place.category === cat ? 1 : 0);
    const typeVector = types.map(type => place.type === type ? 1 : 0);
    const ratingVector = [place.ratingAverage / 5];

    return [...categoryVector, ...typeVector, ...ratingVector];
}

async function Recommedation(req,res) {
        try {
            const userHistory = await History.findOne({ user: req.user.id }).populate('place');
    
            if (!userHistory) {
                return await Places.aggregate([
                    {$sample:{size:8}}
                ])
            }
    
            const visitedPlaces = userHistory.place;
    
            const visitedFeatureVectors = visitedPlaces.map(place => createFeatureVector(place));
    
            const allPlaces = await Places.find();
            const allFeatureVectors = allPlaces.map(place => createFeatureVector(place));
    
            const similarityScores = allPlaces.map((place, idx) => {
                const placeVector = allFeatureVectors[idx];
                const maxSimilarity = Math.max(...visitedFeatureVectors.map(vec => cosineSimilarity(vec, placeVector)));
                return { place, score: maxSimilarity };
            });
    
            similarityScores.sort((a, b) => b.score - a.score);
    
            const recommendedPlaces = similarityScores
                .filter(item => !visitedPlaces.some(visited => visited._id.equals(item.place._id)))
                .map(item => item.place)
                .slice(0,10);
    
            return recommendedPlaces
    
        } catch (error) {
            console.error(error);
            return error
        }
}

module.exports = Recommedation;