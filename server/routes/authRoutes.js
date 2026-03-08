const express = require('express');
const router = express.Router();

// Temporary storage (for testing before MongoDB is set up)
let users = [];

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    console.log('Signup attempt:', { name, email, phone });

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists (for testing)
    const existingUser = users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user object
    const newUser = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      phone,
      password: password, // In production, hash this password!
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    // Add to array (temporary)
    users.push(newUser);
    console.log('User created:', newUser.email);

    // Return success response (without password)
    const { password: _, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: userResponse
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Get all users (for testing only - remove in production)
router.get('/users', (req, res) => {
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json({
    success: true,
    count: users.length,
    users: usersWithoutPasswords
  });
});

// Login route
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email,password)
    // Find user
    const user = users.find(u => u.email === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password (simple comparison for testing)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Return user data (without password)
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

module.exports = router;