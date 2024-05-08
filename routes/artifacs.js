const artifacsController = require('../controllers/artifacs');
const authController = require('../controllers/authController');
const router = require('express').Router();

router.get('/:artifaceId',artifacsController.getArtifacs);

router.get('/',artifacsController.getArtifacss);

router.post('/add-artifacs',authController.protect,authController.restrictTo('admin'),artifacsController.uploadImages,artifacsController.createArtifacs);

router.put('/edit-artifacs/:artifacsId',authController.protect,authController.restrictTo('admin'),artifacsController.uploadImages,artifacsController.updateArtifacs);

router.delete('/delete-artifacs/:artifacsId',authController.protect,authController.restrictTo('admin'),artifacsController.deleteArtifacs)

module.exports = router