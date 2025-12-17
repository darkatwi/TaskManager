const express = require('express');
const router = express.Router();
const User = require('../models/user'); 

router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'email username status role');
    res.json(users);
  } catch (err) {
    console.error('Error fetching collaborators:', err);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(200).json(existingUser);
    }

    return res.status(404).json({ error: "User with this email does not exist" });
  } catch (err) {
    console.error('Error adding collaborator:', err);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

router.put('/:id/role', async (req, res) => {
  try {
    const collabId = req.params.id;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      collabId,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

module.exports = router;
