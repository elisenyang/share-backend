var express = require('express');
var router = express.Router();
var models = require('../models/models');
var User = models.User;
var Post = models.Post;
var Count = models.Count;
const fetch = require('isomorphic-fetch')

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
      likes: [],
      id: commentId,
      date: Date.now()
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
    var liked = false
    var removed = []
    var updated = []
    comment.likes.forEach(like => {
      if (like === req.body.userId) {
        liked = true
      }
    })
    if (liked === true) {
      comment.likes.forEach(like => {
        if (like !== req.body.userId) {
          removed.push(like)
        }
      })
      comment.likes = removed
    } else {
      comment.likes.push(req.body.userId)
    }
    User.findById(req.body.userId, function(err, user) {
      if (liked === false) {
        user.hearts.push({
          post: req.body.postID,
          comment: req.body.commentIndex
        })
      } else {
        var newHearts = []
        user.hearts.forEach(heart => {
          if (heart.post !== req.body.postId && heart.comment !== req.body.commentIndex) {
            newHearts.push(heart)
          }
        })
        user.hearts = newHearts
      }
      user.save()
    })
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
        if (String(comment.user.id) === String(req.user._id)) {
          if (resp.indexOf(doc) === -1) {
            resp.push(doc)
          }
        }
      })
    })
    res.json(resp)
  })
})

router.get('/pulse', function(req, res) {
  Post.find(function(err, docs) {
    if (err) {
      console.log(err.message)
    } else {
      return docs
    }
  }).then((docs) => {
    var dataArr = []
    var numberConvos = docs.length
    docs.forEach(function(doc) {
      dataArr.push(String(doc.content))
      doc.replies.forEach(function(comment) {
        dataArr.push(comment.content)
      })
    })
    fetch('https://apiv2.indico.io/emotion/batch', {
      method: 'POST',
      body: JSON.stringify({
        'api_key': '8786bb9f79fbd4817cb36a1aad444c9d',
        'data': dataArr,
        'threshold': 0.1
      })
    }).then(function(res) {
      return res.json()
    }).then(function(resJSON) {
      var length = resJSON.results.length
      var anger = 0
      var fear = 0
      var sadness = 0
      var joy = 0
      var surprise = 0
  
      resJSON.results.forEach(function(res) {
        if (res.anger) {
          anger += res.anger
        }
        if (res.fear) {
          fear += res.fear
        }
        if (res.sadness) {
          sadness += res.sadness
        }
        if (res.joy) {
          joy += res.joy
        }
        if (res.surprise) {
          surprise += res.surprise
        }
      })
  
      var final = {
        anger: anger/length,
        fear: fear/length,
        sadness: sadness/length,
        joy: joy/length,
        surprise: surprise/length
      }
      res.json({data: final, numberConvos: numberConvos})
  
    }).catch(function(err) {
      console.log(err.message)
    })
  }).catch(function(err) {
    console.log(err.message)
  })
})

router.post('/seeWarning', function(req, res) {
  User.findById(req.body.userId, function(err, doc) {
    if (err) {
      console.log(err.message)
    } else {
        return doc
    }
  }).then((doc) => {
      var updated = Object.assign({}, doc.warnings)
      updated.seen = true
      doc.warnings = updated
      doc.save()
  }).then(() => {
    res.json({success: true})
  }).catch(err => {
    console.log(err)
  })
})


///////////////////////////// END OF PRIVATE ROUTES /////////////////////////////

module.exports = router;