var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;

mongoose.connect(connect);

var models = require('./models/models');
var Count = models.Count


var newCount = new Count ({
    count: {
        Bear: 1,
        Bird: 1,
        Cat: 4,
        Crocodile: 1,
        Dog: 0,
        Elephant: 3,
        Fox: 0,
        Giraffe: 1,
        Horse: 5,
        Lion: 1,
        Panda: 5,
        Pig: 4,
        Rabbit: 1,
        Rhinoceros: 0,
        Sheep: 3,
        Tiger:1
    }
});

 newCount.save(function(err) {
     if (err) {
         console.log(err)
     }
 })
