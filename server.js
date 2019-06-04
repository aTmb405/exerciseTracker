'use strict';
require('dotenv').config()
const express = require('express')
const app = express()
const mongo = require('mongodb')
const bodyParser = require('body-parser')
const shortid = require('shortid')


const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

var userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  _id: String,
  count: Number,
  log: [{ 
    description: String,
    duration: Number,
    created: Date
  }],
  
});

var User = mongoose.model('User', userSchema);

// all users    -> /api/exercise/users
app.get("/api/exercise/users", function(req, res) {
  User.find({}, function(err, allUsers) {
    if(err) {
      console.log(err);
    } else {
      res.json(allUsers);
    }
  });
});

// create user  -> /api/exercise/new-user 
app.post("/api/exercise/new-user", function (req, res, next) {
  var name = req.body.username;
  var short = shortid.generate();
  var newUser = {_id: short, name: name};
  console.log(newUser);
  User.create(newUser, function(err, newlyCreated){
    if(err) {
        console.log(err);
    } else {
        console.log(newlyCreated);
    }
  });
  res.json(newUser);
});

// add exercise -> /api/exercise/add
app.post("/api/exercise/add", function (req, res, next) {
  var userid = req.body.userId;
  var description = req.body.description;
  var duration = req.body.duration;
  var newExercise = {description: description, duration: duration, created: Date.now()};
  User.findById({_id: userid}, function(err, user) {
    if(err) {
      console.log(err);
    } else {
      console.log(user.count)
      user.count += 1;
      user.log.push(newExercise);
      user.save((error, user) => {
        if(error) return next(error);
        res.json(user);
      });
    }
  });
});
// exercise log -> /api/exercise/log

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
