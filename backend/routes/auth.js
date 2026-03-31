import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google Token and Login/Register
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify the Google JWT token
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find the user, or safely create them if they don't exist
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({
        googleId,
        email,
        username: name,
        picture
      });
      await user.save();
    }

    // We send back the exact same Google Token, so the frontend can store it 
    // and use it as the Bearer token for future requests! No custom JWTs needed.
    res.json({ token, user });
    
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    res.status(401).json({ error: 'Invalid Google Token' });
  }
});

// Since we are verifying the Google Token natively on every request, `/me` just decodes it.
// The actual middleware handles this, but here is an explicit endpoint for frontend bootstrap:
router.get('/me', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token provided' });

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    const user = await User.findOne({ googleId: payload.sub });
    
    if(!user) return res.status(404).json({ msg: 'User not found in DB' });

    res.json(user);
  } catch (err) {
    res.status(401).json({ msg: 'Google Token is expired or invalid' });
  }
});

export default router;
