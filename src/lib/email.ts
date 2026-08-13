import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (toEmail: string, candidateName: string) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass'
      }
    });
    
    let isTest = false;
    if (!process.env.SMTP_HOST) {
      // Generate test account if not configured
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      isTest = true;
    }

    const info = await transporter.sendMail({
      from: '"Traineer" <noreply@traineer.ai>',
      to: toEmail,
      subject: 'Welcome to Traineer!',
      text: `Hi ${candidateName},\n\nWelcome to Traineer! Your registration was successful. You can now begin your assessment.\n\nBest,\nThe Traineer Team`,
      html: `<h3>Hi ${candidateName},</h3><p>Welcome to <strong>Traineer!</strong></p><p>Your registration was successful. You can now begin your assessment.</p><br/><p>Best,<br/>The Traineer Team</p>`,
    });

    if (isTest) {
      console.log('Test email sent. Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};
