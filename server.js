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

var serviceAccount = JSON.parse(process.env.service_account)

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
                req.headers.jToken = decodedData
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

    userModel.findById(req.body.jToken.id, 'name email phone gender createdOn profilePic', function (err, doc) {
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
    userModel.findById(req.body.jToken.id, 'name profilePic', function (err, user) {
        console.log("afsafsf ========", user)
        if (!err) {
            tweetModel.create({
                "username": user.name,
                "tweet": req.body.tweet,
                "profilePic": user.profilePic
            }, function (err, data) {
                if (err) {
                    res.send({
                        message: "Tweet DB ERROR",
                        status: 404
                    });
                }
                else if (data) {
                    console.log("daada", data)
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
app.post("/upload", upload.any(), (req, res, next) => {

    console.log("req.body: ", req.body);
    bucket.upload(
        req.files[0].path,
        function (err, file, apiResponse) {
            if (!err) {
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                }).then((urlData, err) => {
                    if (!err) {
                        console.log("public downloadable url: ", urlData[0])
                        userModel.findOne({ email: req.body.email }, (err, user) => {
                            console.log(user)
                            if (!err) {
                                    tweetModel.updateMany({ email:req.headers.jToken.email }, {profilePic:urlData[0]}, (err, tweetModel) => {
                                        console.log(tweetModel)
                                        if (!err) {
                                            console.log("update");
                                        }
                                    });
                                user.update({ profilePic: urlData[0] }, (err, updatedProfile) => {
                                    if (!err) {
                                        res.status(200).send({
                                            message: "succesfully uploaded",
                                            url: urlData[0],
                                        })
                                    }
                                    else {
                                        res.status(500).send({
                                            message: "an error occured" + err,
                                        })
                                    }

                                })
                            }
                            else {
                                res.send({
                                    message: "error"
                                });
                            }
                        })
                        try {
                            fs.unlinkSync(req.files[0].path)
                        } catch (err) {
                            console.error(err)
                        }
                    }
                })
            } else {
                console.log("err: ", err)
                res.status(500).send();
            }
        });
})


server.listen(PORT, () => {
    console.log("Server is Running:", PORT);
});