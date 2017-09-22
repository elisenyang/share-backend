var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  userInfo: {
    type: Object
  }
});

var postSchema = mongoose.Schema({
  user: Object,
  date: Number,
  content: String,
  replies: []
})


User = mongoose.model('User', userSchema);
Post = mongoose.model('Post', postSchema)

module.exports = {
    User: User,
    Post: Post
};
