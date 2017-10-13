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

var countSchema = mongoose.Schema({
  count: Object
})


User = mongoose.model('User', userSchema);
Post = mongoose.model('Post', postSchema);
Count = mongoose.model('Count', countSchema);

module.exports = {
    User: User,
    Post: Post,
    Count: Count
};
