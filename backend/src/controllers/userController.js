import User from '../models/User.js';
import AccessLog from '../models/AccessLog.js';

/**
 * User Controller - Supports user search for secure sharing
 */

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const users = await User.find(
      {
        $and: [
          {
            $or: [
              { email: searchRegex },
              { username: searchRegex },
              { 'profile.firstName': searchRegex },
              { 'profile.lastName': searchRegex }
            ]
          },
          { _id: { $ne: userId } }
        ]
      },
      'username email profile'
    ).limit(20);

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.profile?.department || null,
      patientId: user.profile?.patientId || null,
      name: `${user.profile?.firstName || ''}${user.profile?.lastName ? ` ${user.profile.lastName}` : ''}`.trim()
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, 'username email role profile createdAt').sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const listPatients = async (req, res, next) => {
  try {
    const patients = await User.find({ role: 'patient' }, 'username email role profile createdAt').sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemActivity = async (req, res, next) => {
  try {
    const logs = await AccessLog.find({})
      .populate('userId', 'username email role')
      .populate('fileId', 'originalName recordType category')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot delete their own account from this endpoint.'
      });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
