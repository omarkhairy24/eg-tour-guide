const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const fs = require('fs');
const path = require('path');
const Artifacs = require('./models/artifacs');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/RecPhoto');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

exports.upload = multer({ storage });

let model;

const loadModel = async () => {
    try {
        model = await mobilenet.load();
        console.log('Model loaded successfully');
    } catch (err) {
        console.error('Failed to load model', err);
        process.exit(1);
    }
};
loadModel();

const loadImage = (imagePath) => {
    const buf = fs.readFileSync(imagePath);
    const tensor = tf.node.decodeImage(buf, 3);
    return tensor;
};

const extractFeatures = async (imageTensor) => {
    loadModel;
    const activation = model.infer(imageTensor, 'conv_preds');
    const features = activation.dataSync();
    imageTensor.dispose();
    activation.dispose();
    return features;
};

const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (normA * normB);
};

const artifactFeaturesCache = new Map();

const extractAndCacheFeatures = async (imagePath) => {
    const imageTensor = loadImage(imagePath);
    const features = await extractFeatures(imageTensor);
    artifactFeaturesCache.set(imagePath, features);
    return features;
};

const recognizeImage = async (imagePath, artifactImages) => {
    const imageTensor = loadImage(imagePath);
    const uploadedImageFeatures = await extractAndCacheFeatures(imagePath);

    let bestMatch = null;
    let highestSimilarity = -1;

    for (const artifactImage of artifactImages) {
        const artifactImagePath = path.join(__dirname, artifactImage);
        if (!fs.existsSync(artifactImagePath)) {
            console.error(`File not found: ${artifactImagePath}`);
            continue;
        }

        let artifactImageFeatures = artifactFeaturesCache.get(artifactImagePath);
        if (!artifactImageFeatures) {
            artifactImageFeatures = await extractAndCacheFeatures(artifactImagePath);
        }

        const similarity = cosineSimilarity(uploadedImageFeatures, artifactImageFeatures);
        console.log(`Similarity with ${artifactImagePath}: ${similarity}`);

        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = artifactImage;
        }
    }

    imageTensor.dispose();
    return { bestMatch, highestSimilarity };
};

exports.recognize = async (req, res) => {
    const imagePath = req.file.path;

    try {
        const artifacts = await Artifacs.find().lean();

        let bestArtifact = null;
        let highestSimilarity = -1;

        for (const artifact of artifacts) {
            const artifactImages = artifact.images.map(image => path.join('public/img/Artifacss', image));
            const { bestMatch, highestSimilarity: similarity } = await recognizeImage(imagePath, artifactImages);

            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestArtifact = artifact;
                bestArtifact.bestMatchImage = bestMatch;
            }
        }

        if (bestArtifact) {
            return res.status(200).json({
                artifact: bestArtifact,
                similarity: highestSimilarity,
                message: 'Best matching artifact found'
            });
        }

        res.status(404).json({ message: 'No matching artifact found' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
