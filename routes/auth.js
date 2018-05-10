var express = require('express');
var router = express.Router();
var models = require('../models/models');

module.exports = function (passport) {

    router.post('/register', function (req, res) {

        let newUser = new User({
            email: req.body.email,
            password: req.body.password,
            userInfo: {
                year: req.body.userInfo.year,
                school: req.body.userInfo.school,
                gender: req.body.userInfo.gender,
                age: req.body.userInfo.age
            },
            new: true
        })

        if (req.body.email && req.body.password) {
            newUser.save(function (err) {
                if (err) {
                    res.status(500).json({ error: 'Registration Failed. Please try again' })
                } else {
                    res.status(200).json({ success: 'Registration successful' })
                }
            })
        } else if (!req.body.email) {
            res.json({ error: 'You must enter a valid email' })
        } else if (!req.body.password) {
            res.json({ error: 'You must provide a valid password' })
        }
    })

    // POST Login page
    router.post('/login', passport.authenticate('local', {
        successRedirect: '/loginSuccess',
        failureRedirect: '/loginFailure'
    }));

    router.get('/loginSuccess', function(req,res) {
            res.json({user: req.user})
    })

    router.get('/loginFailure', function(req,res) {
        res.json({error: 'Login Failed'})
    })

    router.get('/logout', function(req, res) {
        req.logout()
        res.json({success: true})
    });

    return router;
};