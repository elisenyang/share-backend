var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;

mongoose.connect(connect);

var models = require('./models/models')
var User = models.User
var Post = models.Post

const app = express();

app.use(logger('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.get('/posts', function(req,res) {
  Post.find(function(err, docs) {
    if (err) {
      res.status(500).send({error: 'Posts could not be found'})
    }
    res.status(200).json(docs)
  })
})

app.post('/userInfo', function(req, res) {
  var posts = req.body.posts
  function retrieveUserInfo(id, callback) {
    User.findById(id, function(err, user) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, user);
      }
    });
  }
  Promise.all(posts.map((post)=> {
    return retrieveUserInfo(post.user.id, function(err, user) {
      if (err) {
        console.log(err)
      }
      post.user.userInfo = user.userInfo
    })
  })).then((updatedPosts)=> {
    console.log(updatedPosts)
    res.json({success: posts})
  })
})

var bcrypt = require('bcrypt');
const saltRounds = 10;

app.post('/register', function(req,res) {

  let newUser = new User({
    email: req.body.email,
    password: req.body.password,
    userInfo: {
      year: req.body.userInfo.year,
      school: req.body.userInfo.school,
      gender: req.body.userInfo.gender,
      age: req.body.userInfo.age
    }
  })
  
  if (req.body.email && req.body.password) {
    newUser.save(function(err) {
      if (err) {
        res.status(500).json({error: 'Registration Failed. Please try again'})
      } else {
        res.status(200).json({success: 'Registration successful'})
      }
    })
  } else if (!req.body.email) {
    res.json({error: 'You must enter a valid email'})
  } else if (!req.body.password) {
    res.json({error: 'You must provide a valid password'})
  }
})


var port = process.env.PORT || 3000;
app.listen(port);
console.log('Server started. Listening on port %s', port);

module.exports = app;
