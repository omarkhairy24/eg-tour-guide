const catchAsync = require('../middlewares/catchAsync');
const multer = require('multer');
const AppError = require('../middlewares/AppError');
const Artifacs = require('../models/artifacs');

const multerStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'public/img/Artifacss')
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname)
    }
});

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) cb(null, true)
	else cb(new AppError(400, 'only images are accepted'), false)
}

const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
})

exports.uploadImages = upload.array('images');

exports.createArtifacs = catchAsync(async(req,res,next)=>{
    let images = [];
    let files = req.files 
    if(req.files){
        for (let file of files){
            images.push(file.filename)
        }
    }
    console.log(files);

     const artifacs = await Artifacs.create({
        name:req.body.name,
        images:images,
        museum:req.body.museum,
        description:req.body.description
     });
     console.log(artifacs);
     res.status(201).json({
        status:'success',
        artifacs
     })
});

exports.updateArtifacs = catchAsync( async (req,res,next)=>{
    const artifacsId = req.params.artifaceId
    let artifacs = await Artifacs.findById(artifacsId);
    if(!artifacs){
        return next(new AppError('Artifacs not found',404));
    }
    let updateData ={
        name:req.body.name,
        museum:req.body.govName,
        description:req.body.description,
    }

    let images;
    let files = req.files;
    console.log(files);
    if(req.files && req.files.length > 0){
        images = [];
        for (let file of files){
            images.push(file.filename)
        }
        updateData.images = images
    }

    artifacs = await Artifacs.findByIdAndUpdate(artifacsId,updateData,{
        new:true,
        runValidators:true
    })
        
    res.status(200).json({
        status:'success',
        artifacs
    })
})


exports.deleteArtifacs = catchAsync(async(req,res,next)=>{
    await Artifacs.findByIdAndDelete(req.params.artifaceId);
    res.status(200).json({
        status:'success',
        message:'Artifacs deleted successfully'
    })
});

exports.getArtifacs = catchAsync(async (req,res,next)=>{
    const artifacs = await Artifacs.findById(req.params.artifaceId).populate('museum')
    res.status(200).json({
        status:'success',
        artifacs
    })
})

exports.getArtifacss = catchAsync(async(req,res,next)=>{
    const artifaces = await Artifacs.find().populate('museum');
    res.status(200).json({
        status:'success',
        artifaces
    })
})