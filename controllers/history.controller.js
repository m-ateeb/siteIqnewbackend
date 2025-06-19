// controllers/websiteHistoryController.js
import WebsiteHistory from '../models/WebsiteHistory.js';

// ✅ CREATE a new website history record
const createHistory = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;

    const { url, seoReport, seoRecommendations, action } = req.body;

    if (!clerkUserId || !url || !action) {
      return res.status(400).json({ error: 'userId, url, and action are required.' });
    }

    const newHistory = new WebsiteHistory({
      userId,
      url,
      seoReport,
      seoRecommendations,
      action,
    });

    await newHistory.save();
    return res.status(201).json(newHistory);
  } catch (error) {
    console.error("❌ Error creating history record:", error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 📄 READ ALL histories for a user
const getUserHistory = async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const history = await WebsiteHistory.find({ clerkUserId }).sort({ createdAt: -1 });

    if (!history.length) {
      return res.status(404).json({ error: 'No history found for this user.' });
    }

    return res.status(200).json(history);
  } catch (error) {
    console.error("❌ Error fetching user history:", error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 📄 READ single history by ID
const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await WebsiteHistory.findById(id);
    if (!history) {
      return res.status(404).json({ error: 'History record not found.' });
    }

    return res.status(200).json(history);
  } catch (error) {
    console.error("❌ Error fetching history by ID:", error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ✏️ UPDATE a history record
const updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await WebsiteHistory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'History record not found.' });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating history:", error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 🗑️ DELETE a history record
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await WebsiteHistory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'History record not found.' });
    }

    return res.status(200).json({ message: 'History record deleted successfully.' });
  } catch (error) {
    console.error("❌ Error deleting history:", error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export {
  createHistory,
  getUserHistory,
  getHistoryById,
  updateHistory,
  deleteHistory
};
