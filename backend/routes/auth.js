const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;  
    let user = new User({ email, password });  
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'User creation failed', details: err.message });
  }
});


router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ error: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ message: 'Logged in successfully', user: { id: user._id, email: user.email } });

    });
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    res.redirect('/dashboard.html');
  }
);

module.exports = router;
