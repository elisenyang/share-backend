var express = require('express');
var router = express.Router();
var models = require('../models/models');
var User = models.User;
var Post = models.Post

///////////////////////////// END OF PUBLIC ROUTES /////////////////////////////

router.use(function(req, res, next){
  if (!req.user) {
    res.json({Error: 'Not logged in'})
  } else {
    return next();
  }
});

//////////////////////////////// PRIVATE ROUTES ////////////////////////////////
// Only logged in users can see these routes

router.get('/posts', function(req,res) {
  console.log('id', req.user._id)
  if (req.query.myposts) {
    Post.find({"user.id": String(req.user._id)}, function(err, posts) {
      console.log('HERE', posts)
    }).then(posts => {
      res.json({posts: posts})
      return;
    })
  } else {
    Post.find(function(err, docs) {
      if (err) {
        res.status(500).send({error: 'Posts could not be found'})
      }
      // res.status(200).json(docs)
    }).then(docs => {
      var promises = []
      docs.forEach(post => {
        promises.push(
          User.findById(post.user.id, function(err, user) {
            if (err) {
              console.log(err)
            }
          }).then(user=> {
            post.user.userInfo = user.userInfo
            return post;
          })
        )
      })
      Promise.all(promises)
      .then((resp) => {
        var sorted = resp.sort(function(a,b) {
           if (b.date > a.date) {
             return 1
           }
           if (b.date < a.date) {
             return -1
           }
        })
        res.json(resp)
      })
    })
  }
})

router.post('/userInfo', function(req, res) {
  var posts = req.body.posts
  var promises = []
  posts.forEach(post => {
    promises.push(
      User.findById(post.user.id, function(err, user) {
        if (err) {
          console.log(err)
        }
      }).then(user=> {
        post.user.userInfo = user.userInfo
        return post;
      })
    )
  })
  Promise.all(promises)
  .then((resp) => {
    res.json({success: resp})
  })
})

router.post('/ask', function(req,res) {
  var newPost = new Post({
    user: req.body.user,
    date: Date.now(),
    content: req.body.message,
    replies: []
  })

  newPost.save(function(err) {
    if (err) {
      res.json({Error: 'There was an error sending your post. Please try again'})
    }
    res.json({success: true})
  })
})

router.post('/comment', function(req,res) {
  Post.findById(req.body.postId, function(err,doc) {
    doc.replies.push({
      user: req.body.user,
      content: req.body.message,
      likes: 0
    })
    doc.save()
  }).then(() => {
    res.json({success: true})
  }).catch(() => {
    res.json({error: 'Could not post comment'})
  })  
})


router.get('/comments/:postId', function(req,res) {
  Post.findById(req.params.postId, function(err, doc) {
    res.json(doc.replies)
  })
})

router.post('/like', function(req, res) {
  Post.findById(req.body.postID, function(err,doc) {
    var post = doc.toJSON()
    console.log(post)
    var comment = post.replies[req.body.commentIndex]
    comment.likes = comment.likes +1
    post.replies[req.body.commentIndex] = comment
    doc.replies = post.replies
    doc.save(function(err) {
      if (err) {
        res.json({success: false})
      }
      res.json({success: true})
    })
  })
})

router.post('/updateInfo', function(req,res) {
  User.findById(req.body.userId, function(err, doc) {
    console.log(doc)
    var user = doc.toJSON()
    user.userInfo = {
      year: req.body.year,
      school: req.body.school,
      gender: req.body.gender,
      age: req.body.age
    }
    doc.userInfo = user.userInfo
    doc.save(function(err) {
      if (err) {
        res.json({success: false})
      } else {
        res.json({success: true})
      }
    })
  })
})

router.post('/delete', function(req,res) {
  Post.remove({ _id:req.body.postId}, function(err) {
    if (err) {
      res.json({error: err.message})
    }
    res.json({success: true})
  })
})

///////////////////////////// END OF PRIVATE ROUTES /////////////////////////////

module.exports = router;