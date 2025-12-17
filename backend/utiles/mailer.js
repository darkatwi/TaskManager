const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'taskmanagersystembywa@gmail.com',
    pass: 'dkzvhfeghqlegwyw'
  }
});

async function sendTaskReminderEmail(to, taskName, dueDate, comment) {
  const commentText = comment && comment.trim() !== '' ? `🗒️ Comments: ${comment}\n\n` : '';

  const mailOptions = {
    from: '"Task Manager System" <taskmanagersystembywa@gmail.com>',
    to,
    subject: `⏰ Upcoming Task: "${taskName}" is due soon`,
    text: `Hello,

This is a friendly reminder from your Task Manager system.

📝 Task: ${taskName}
📅 Due Date: ${dueDate}

${commentText}Please make sure to complete it on time. Let us know if you need any help or wish to reschedule.

Best regards,  
Task Manager Team`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send reminder:`, error);
  }
}

module.exports = sendTaskReminderEmail;
