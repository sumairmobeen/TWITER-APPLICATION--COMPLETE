const PORT = process.env.PORT || 5000;
var express = require("express");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cors = require("cors");
var morgan = require("morgan");
var jwt = require('jsonwebtoken');
var http = require("http");
var socketIO = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const admin = require("firebase-admin");

var path = require("path");

// console.log("module: ", userModel);
var { SERVER_SECRET } = require("./core/index");


var { userModel, tweetModel } = require("./dbrepo/models");
var authRoutes = require("./routes/auth");

var app = express();

var server = http.createServer(app);
const storage = multer.diskStorage({ // https://www.npmjs.com/package/multer#diskstorage
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, `${new Date().getTime()}-${file.filename}.${file.mimetype.split("/")[1]}`)
    }
})
var upload = multer({ storage: storage })

// var serviceAccount = JSON.parse(process.env.service_account);
var serviceAccount = 
{
    "type": "service_account",
    "project_id": "twiter-a7bc3",
    "private_key_id": "da23a042a06dea189b9490ffa60d88e06710460d",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDE+sJHu1F36T9H\n0TIrWW04n0gQQp88GrhZgAhdlNQcJy23RwLov1EkaDxL0SyQGa3yvBqHYCPcrr8F\nEvNWQyNFb32JzvEVtWtIm4GBEMe7wuI4ZdOegSxMsJGn0z2RqMOz0H1ccJnC0WvB\nIuhEzWnSGsPFOEwfYatBo99tpmk2kFKIJebZj7OYjHIUXhS2DKnM07E9WcCqEree\nzohmJ6CteLkcYASsMUofx2aB1ZzuQUccYxRmBGJN1rp+4RQgLFVNFH60iB1EoqVc\nsAqVtgAZQhg7EHOWdWQsxyO1H32qnlSUq0GNL/8u4333K/8uOw1u1o++lmn40cq5\nIKkxEJhZAgMBAAECgf8oRe4haur9Nlvih3Ru0TzDf57k+f/l8r8nAbq0IZyZggwL\nITmraCx6hRsUqxKaHevJ9SuOpQf11sSI1n/HEdAS3G0Cui+zUgFo9AVGWFCsddSn\n1incuJfzLVUmDG1hbALFxrIJXROHRz5d0AVEaQDuHNw7ZPuftLtJKo9bJ3aVqycs\nZ4THp7+0f09Ni33sdmDfWKoqV9+CG1qw48yOcjxdZz+cX8HhWRXHyUBs7b4wQerT\nc/qlyeDxtd6kP+3PxceqeBUUe0gq1ttWpziAMCXKJv4k4AuySsU/EpER6S79gvPt\n8qImamghgTWD+MC1FVizo83r1hpCvg71L9D1F6UCgYEA+wcRL5huCnjO9FMaB08A\nVfSVJ7boNEBADdWFQGLgFAuwPAjSslVWHSSxKZQ85DrrrUr1HN2KCh/B2MZSn0Dj\nyYAipgYldqJBHgKFXkmn7zP7ZddlfaYf8tCTJ8AnLLa8GX1y0KAHwZkkchKcAPoZ\nxXf3ta6yCCpmcL13TCBSbV0CgYEAyOGeubAbaAAwlGh+TZWDka3LMcNR5vTeyQKs\nX4IGNBKYsQedTm12TSURaZRXwj4rnve/LWXSJJM+z1NDFDJyAV/m9h7mRaRYS63u\nlGxK7DX0uZw6GGGe28YgquRLcjpnrYozWoynPXfxoPg+M5LcbrLL7MWBVXAGagLp\nDTb76y0CgYBhx8bx+zYh7hzvHs+suSEwWi0fYyff8ocA3IMjKWCPbl4fhHBN9t+s\nSnaX854kaK8UuXXw4Hq8ptIjVl0om2YfP0I/2XUOWPV0cxbwO1Cm5GCwss5duzAG\nrSgk+7xGtodehncKvMtIphaEOKt71e/j828R3hKLC7kLgUHO7WguIQKBgQCjoWUx\nzIoGhWENArEfcZLir7a8qmWkxAJVqp/OjJORBzTpv1Ib+H5NCMzOO8/godPWgehw\nimhK8sZPC3uwkAbdp8jy4uigAecKfnvA2xWMo8bdCq0n/xzv2MvzaFMskPazHcgH\nEluIbpOck5nXWOHGKk6CZ7+aYM5YvFYqNYevYQKBgQCFUP/1xCm6jWM1BwLLzWMG\nU4GlUQszWZwJvtQag1+GEHCX/XQo5GsEn8Dxts6TvLmWGtyEbl6bgRlg02Ekc7vC\n/d30adrnpv3hU+NV/O5qBP5s0mhlsV0YFiY2RExaWthHw8eQm58Shma1LLgZ5UV2\ntXAdEpkQRcrPbzwFHUSzdQ==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-h90x3@twiter-a7bc3.iam.gserviceaccount.com",
    "client_id": "116050304666746088222",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-h90x3%40twiter-a7bc3.iam.gserviceaccount.com"
};


// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: process.env.databaseURL
// });
// const bucket = admin.storage().bucket(process.env.bucket);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://twiter-a7bc3-default-rtdb.firebaseio.com'
});
const bucket = admin.storage().bucket('gs://twiter-a7bc3.appspot.com');



app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(morgan('dev'));

// example how to send file any requrest

// app.get("/", (req, res, next) => {
//     console.log(__dir);
//     res.sendFile(path.resolve(path.join(__dirname, "public")))
// })

app.use("/", express.static(path.resolve(path.join(__dirname, "public"))))

app.use('/', authRoutes);


var io = socketIO(server);
io.on("connection", (user) => {
    console.log("user connected");
})


app.use(function (req, res, next) {

    console.log("req.cookies: ", req.cookies);

    if (!req.cookies.jToken) {
        res.status(401).send("include http-only credentials with every request")
        return;
    }
    jwt.verify(req.cookies.jToken, SERVER_SECRET, function (err, decodedData) {
        if (!err) {

            const issueDate = decodedData.iat * 1000;
            const nowDate = new Date().getTime();
            const diff = nowDate - issueDate; // 84600,000

            if (diff > 300000) { // expire after 5 min (in milis)
                res.send({
                    message: "TOKEN EXPIRED",
                    status: 401
                });
            } else { // issue new Token
                var token = jwt.sign({
                    id: decodedData.id,
                    name: decodedData.name,
                    email: decodedData.email,
                    phone: decodedData.phone,
                    gender: decodedData.gender
                }, SERVER_SECRET)

                res.cookie('jToken', token, {
                    maxAge: 86_400_000,
                    httpOnly: true
                });
                req.body.jToken = decodedData
                next();
            }
        } else {
            res.send({
                message: "Invalid Token",
                status: 401
            });
        }


    });

});

app.get("/profile", (req, res, next) => {
    console.log(req.body);

    userModel.findById(req.body.jToken.id, 'name email phone gender createdOn', function (err, doc) {
        if (!err) {
            res.send({
                profile: doc
            })

        } else {
            res.send({
                message: "Server Error",
                status: 500
            });
        }
    });
})

app.post("/tweet", (req, res, next) => {
    if (!req.body.jToken.id || !req.body.tweet) {
        res.send({
            status: 401,
            message: "Please Start Tweet"
        })
    }
    userModel.findById(req.body.jToken.id, 'name', function (err, user) {
        if (!err) {
            tweetModel.create({
                "username": user.name,
                "tweet": req.body.tweet
            }, function (err, data) {
                if (err) {
                    res.send({
                        message: "Tweet DB ERROR",
                        status: 404
                    });
                }
                else if (data) {
                    console.log("data checking Tweeter ", data);
                    res.send({
                        message: "Your Tweet Send",
                        status: 200,
                        tweet: data
                    });
                    io.emit("NEW_POST", data);

                    console.log("server checking code tweet ", data.tweet)
                } else {
                    res.send({
                        message: "Tweets posting error try again later",
                        status: 500
                    });
                }
            });
           
        } else {
            res.send({
                message: "User Not Found",
                status: 404
            });
        }
    });


});
app.get("/tweet-get", (req, res, next) => {
    tweetModel.find({}, function (err, data) {
        if (err) {
            res.send({
                message: "Error :" + err,
                status: 404
            });
        } else if (data) {
            res.send({
                gettweet: data,
                status: 200
            });
        } else {
            res.send({
                message: "User Not Found"
            });
        }
    });
});

app.get("/myTweets", (req, res, next) => {
    console.log(req.body.jToken.name)

    tweetModel.find({ username: req.body.jToken.name }, (err, data) => {
        if (!err) {
            console.log("tweet data=>", data);
            res.send({
                tweet: data,
                status: 200
            });
            io.emit("MY_POST", data);
        }
        else {
            console.log("error : ", err);
            res.status(500).send("error");
        }
    })
});

server.listen(PORT, () => {
    console.log("Server is Running:", PORT);
});