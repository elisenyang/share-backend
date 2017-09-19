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
    console.log(docs)
    res.status(200).json(docs)
  })
})



var port = process.env.PORT || 3000;
app.listen(port);
console.log('Server started. Listening on port %s', port);

module.exports = app;
