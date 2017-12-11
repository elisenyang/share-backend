var express = require('express');
var router = express.Router();
var models = require('../models/models');
var User = models.User;
var Post = models.Post;
var Count = models.Count;

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
  if (req.query.myposts) {
    Post.find({"user.id": String(req.user._id)}, function(err, posts) {
      if (err) {
        res.status(500).send({error: 'Posts could not be found'})
      }
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
        var end = resp.length
        if (resp.length > req.query.page*10) {
          end = req.query.page*10
        }
        var sliced = resp.slice((req.query.page*10)-10, end)
        res.json({arr: sorted})
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

router.get('/userInfoComments/:userId', function(req, res) {
  User.findById(req.params.userId, function(err, user) {
    if (err) {
      console.log(err.message)
    }
    res.json({userInfo: user.userInfo})
  })
})

router.post('/ask', function(req,res) {
  var newPost = new Post({
    user: req.body.user,
    date: Date.now(),
    flagged: false,
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
    var commentId = doc.replies.length
    doc.replies.push({
      user: req.body.user,
      content: req.body.message,
      likes: 0,
      id: commentId
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


router.post('/deleteComment', function(req, res) {
  Post.findById(req.body.postId, function(err, doc) {
    var replies = [...doc.replies]
    var index;
    replies.forEach((comment) => {
      if (comment.id === req.body.commentId) {
        index = replies.indexOf(comment)
      }
    })
    replies.splice(index, 1)
    doc.replies = replies
    doc.save(function (err) {
      if (err) {
        res.json({success: false})
      } else {
        res.json({success: true})
      }
    })
  })
})

router.post('/like', function(req, res) {
  Post.findById(req.body.postID, function(err,doc) {
    var post = doc.toJSON()
    var comment = post.replies[req.body.commentIndex]
    comment.likes = comment.likes +1
    post.replies[req.body.commentIndex] = comment
    doc.replies = post.replies
    doc.save(function(err) {
      if (err) {
        res.json({success: false})
      } else {
        res.json({success: true})
      }
    })
  })
})

router.post('/updateInfo', function(req,res) {
  User.findById(req.body.userId, function(err, doc) {
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

router.post('/deletePost', function(req,res) {
  Post.remove({ _id:req.body.postId}, function(err) {
    if (err) {
      res.json({error: err.message})
    }
    res.json({success: true})
  })
})


router.get('/count', function(req, res) {
  console.log(req.query)
  if (req.query.postId) {
    Post.findById(req.query.postId, function(err, post) {
      var username;
      for (var i=0; i<post.replies.length; i++) {
        if (post.replies[i].user.id === req.query.userId) {
          username = post.replies[i].user.animal
          break;
        }
      }
      if (username) {
        res.json({success: true, username: username})
      } else {
        Count.find(function(err, count) {
          var number = count[0].count[req.query.animal]
          res.json({success: true, number: number})
        })
      }
    })
  } else {
      Count.find(function(err, count) {
        var number = count[0].count[req.query.animal]
        res.json({success: true, number: number})
      })
    }
})

router.post('/count', function(req,res) {
  Count.find(function(err, count) {
    var updateCount = Object.assign({}, count[0].count)
    updateCount[req.body.animal] = Number(req.body.number);
    count[0].count = updateCount
    count[0].save(function(err) {
      if (err) {
        res.json({success: false})
      } else {
        res.json({success: true})
      }
    })
  })
})

router.post('/flag', function(req,res) {
  Post.findById(req.body.postId, function(err, doc) {
    if (err) {
      console.log(err)
    } else {
      doc.flagged = true
      doc.save(function(err) {
        if (err) {
          res.json({success: false})
        } else {
          res.json({success: true})
        }
      })
    }
  })
})


router.post('/flagComment', function(req, res) {
  Post.findById(req.body.postId, function(err, doc) {
    var replies = [...doc.replies]
    var index;
    replies.forEach((comment) => {
      if (comment.id === req.body.commentId) {
        index = replies.indexOf(comment)
      }
    })
    var temp = Object.assign({}, replies[index])
    temp.flagged = true;
    replies[index] = temp
    doc.replies = replies
    doc.save(function (err) {
      if (err) {
        res.json({success: false})
      } else {
        res.json({success: true})
      }
    })
  })
})

router.get('/mycomments', function(req, res) {
  var resp = []
  Post.find(function(err, docs) {
    docs.forEach(doc => {
      doc.replies.forEach(comment => {
        if (comment.user.id === req.user._id) {
          if (resp.indexOf(doc) === -1) {
            resp.push(doc)
          }
        }
      })
    })
  })
  res.json(resp)
})


///////////////////////////// END OF PRIVATE ROUTES /////////////////////////////

module.exports = router;