const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/user');
const sendTaskReminderEmail = require('../utiles/mailer');  

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const { title, dueDate, priority, status, assignedTo, comment } = req.body;  
    console.log("📥 Task Received:", req.body);

    const task = new Task({ title, dueDate, priority, status, assignedTo, comment });
    const newTask = await task.save();
    console.log("✅ Task saved to DB:", newTask);

    const user = await User.findById(assignedTo);
    console.log("👤 Assigned user:", user);

    if (user && user.email) {
      console.log(`📧 Sending email to ${user.email}...`);
      try {
        await sendTaskReminderEmail(user.email, title, dueDate, comment); 
        console.log("✅ Email sent to", user.email);
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
      }
    } else {
      console.log("⚠️ No user or user email to send reminder.");
    }

    res.status(201).json(newTask);
  } catch (err) {
    console.error("❌ Error in POST /tasks:", err);
    res.status(400).json({ message: err.message });
  }
});


router.get('/test-email', async (req, res) => {
  try {
    await sendTaskReminderEmail("your-email@gmail.com", "Test Task", "2025-06-21", "This is a test comment.");
    res.send("✅ Test email sent");
  } catch (err) {
    console.error("❌ Test email failed:", err);
    res.status(500).send("❌ Email sending failed");
  }
});

module.exports = router;
