import User from '../models/User.js';
import { comparePassword } from '../services/hashingService.js';
import { generateToken } from '../middleware/authMiddleware.js';

/**
 * Auth Controller - Handles user registration, login, and authentication
 */

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password // Password will be hashed by pre-save hook
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, theme } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'preferences.theme': theme
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side token deletion)
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please delete token from client.'
  });
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  logout
};
