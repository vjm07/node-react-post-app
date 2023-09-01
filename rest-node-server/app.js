const MONGODB_URI = 'mongodb+srv://vjmartinezt01:m3metatronmongodb@cluster0.eyvuzz3.mongodb.net/feeds?retryWrites=true&w=majority'

const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const location = path.join(__dirname, 'images');
        cb(null, location);
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const filter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'  || file.mimetype === 'image/jpg' ) {
        cb(null, true); // valid file
    }
    else {
        cb(null, false);
    }
}

// app.use(bodyParser.urlencoded()) // x-www-form-urlencoded <form>
app.use(bodyParser.json())
app.use(
        multer({storage: storage,
                fileFilter: filter}).single('image')
        )
app.use('/images', express.static(path.join(__dirname, 'images')));

// enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // 'app.net, server.set'
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use((req, res, next) => {
    console.log(req.url);
    next();
})
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

// general error handling -> can now just throw errors in other routes.
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data});
});

mongoose.connect(MONGODB_URI)
    .then(result=> {
        const server = app.listen(8080);
        const io = require('./socket').init(server)
        io.on('connection', socket => {
            console.log('Client connected');
        });

    })
    .catch(err=> console.log(err));

