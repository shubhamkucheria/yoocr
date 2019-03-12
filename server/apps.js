var express = require('express'); 
var app = express(); 
var bodyParser = require('body-parser');
var multer = require('multer');
var fs   = require('fs');
const gm = require('gm');
const tesseract = require('./lib/node-tesseract');
const router = require('express').Router();

var myFileName;
// var key = "AIzaSyBxFRHU5etlSSUGaSNm62Agv9Hn0gA_AR4";
var request = require('request');
// var mongoose = require('mongoose');                 // mongoose for mongodb
// var database = require('./config/database');            // load the database config
// var Imgobj = mongoose.model('ihack', {
//     labelAnnotations : [{ description: String,  score: Number}],
//     bytecode: String,
//     imagePropertiesAnnotation: {r: Number, g: Number, b: Number}
// });

// mongoose.connect(database.localUrl);



    app.use(function(req, res, next) { //allow cross origin requests
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "http://localhost");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    /** Serving from the same express Server
    No cors required */
    app.use(express.static('../client'));
    app.use(bodyParser.json());  

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/');
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            myFileName = file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1];
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
        }
    });

    var upload = multer({ //multer settings
                    storage: storage
                }).single('file');

    /** API path that will upload the files */
    app.post('/upload', function(req, res) {
        // res.json({yo: 'success'});
        upload(req,res,function(err){
            if(err){
                 res.json({error_code:1,err_desc:err});
                 return;
            }

            path = req.file.path;

            gm(path)
            .monochrome() // Convert to b/w image
            .median(2) // Apply median filter to reduce background noise
            .write(path, (err) => {
                if (err) {
                    console.log(err);
                }
                // Detect text 
                tesseract.process(path, (err, text) => {
                    // Error while processing image
                    if (err) {
                        console.log(err);
                        return res.status(500).json('An error occured!')
                    } else {
                        // Delete image from temporary storage
                        fs.unlink(path, (err) => {
                            if (err) {
                                res.status(500).json('Error while scanning image!');
                            }
                        });
                        console.log(text);
                        // return detected text
                        res.status(200).json(text);
                    }
                });
            });



            var imageFile = fs.readFileSync('./uploads/'+myFileName);
                 // var encoded = Buffer.from(imageFile).toString('base64');
                 // if(encoded) {
                 //     console.log('encode success');
                 // }
                 // return res.json({yo: 'success'});
                 // res.status(200).json({yo: 'success'});


                 // to delete file from storage
                // fs.unlinkSync('./uploads/'+myFileName);
                
        });
    });

    app.listen('5000', function(){
        console.log('running on 3000...');
    });