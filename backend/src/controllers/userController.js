import User from '../models/User.js';

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
