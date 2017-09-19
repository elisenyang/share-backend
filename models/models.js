var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

var postSchema = mongoose.Schema({
  user: Object,
  question: String,
  replies: []
})


User = mongoose.model('User', userSchema);
Post = mongoose.model('Post', postSchema)

module.exports = {
    User: User,
    Post: Post
};
