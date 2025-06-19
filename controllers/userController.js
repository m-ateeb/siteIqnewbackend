import User from '../models/User.js';

// Get authenticated user's profile
const getUserProfile = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            username: req.body.username,
            image: req.body.image,
            phoneNumber: req.body.phoneNumber,
            membership: req.body.membership
        };

        // Validate membership type
        if (updates.membership && !['premium', 'freemium'].includes(updates.membership)) {
            return res.status(400).json({
                success: false,
                message: "Invalid membership type"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id, // User is already attached from middleware
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-__v -createdAt -updatedAt');

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: "Profile updated successfully"
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({
            success: false,
            message: error.code === 11000 ? "Username already exists" : "Server error"
        });
    }
};

// Delete user permanently
const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);

        res.status(200).json({
            success: true,
            message: "User account deleted permanently"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get User's SEO Reports
const getUserSeoReports = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user.seoReports
        });
    } catch (error) {
        console.error("Error fetching SEO reports:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get User's Subscription Status
const getUserSubscription = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user.stripe
        });
    } catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

export {
    getUserProfile,
    updateUserProfile,
    deleteUser,
    getUserSeoReports,
    getUserSubscription
};
