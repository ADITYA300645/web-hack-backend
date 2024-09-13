import express from 'express';
import passport from 'passport';
import User from '../models/user.model.js';
import { Strategy as GitHubStrategy } from 'passport-github2';

const router = express.Router();

// GitHub authentication setup with Passport
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      let user = await User.findOne({ githubId: profile.id });
      if (!user) {
        user = new User({
          githubId: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          profileUrl: profile.profileUrl,
          avatarUrl: profile.photos[0]?.value,
          accessToken: accessToken,
          email: profile.emails?.[0]?.value,
        });
        await user.save();
      } else {
        user.accessToken = accessToken;
        await user.save();
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize and deserialize user info for session management
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Route for logging out the user
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

export default router;
