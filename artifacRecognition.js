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

const loadModel = async () => { // Mobilenet is a pre-trained convolutional neural network (CNN) model
    try {
        model = await mobilenet.load();
        console.log('Model loaded successfully');
    } catch (err) {
        console.error('Failed to load model', err);
        process.exit(1);
    }
};
loadModel();

const loadImage = (imagePath) => { // input: image path -> load image and create tensor
    const buf = fs.readFileSync(imagePath);
    const tensor = tf.node.decodeImage(buf, 3); // 3 channels for rgb
    return tensor;
};

const extractFeatures = async (imageTensor) => { // use pre-trained model to extract features from the image
    loadModel;
    const activation = model.infer(imageTensor, 'conv_preds');
    const features = activation.dataSync();
    imageTensor.dispose();
    activation.dispose();
    return features;
};

/*
angle between two vectors: { 0 -> identical } { 90 ->  }
vecA and vecB are the features of the two images
*/
const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (normA * normB);
};

// for chaching images paths with the correspoding image features
const artifactFeaturesCache = new Map();

const extractAndCacheFeatures = async (imagePath) => {
    const imageTensor = loadImage(imagePath);
    const features = await extractFeatures(imageTensor);
    artifactFeaturesCache.set(imagePath, features);
    return features;
};

// Usage example within recognizeImage function
const recognizeImage = async (imagePath, artifactImages) => {
    const imageTensor = loadImage(imagePath);
    const uploadedImageFeatures = await extractAndCacheFeatures(imagePath);

    let bestMatch = null;
    let highestSimilarity = -1; // cos range between -1 and 1

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

    imageTensor.dispose(); // Dispose uploaded image tensor after loop
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
