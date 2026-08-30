export const sendWelcomeEmail = async (email: string, name?: string, verificationLink?: string) => {
  console.log(`[EMAIL STUB] Sending welcome email to ${name || email}...`);
  if (verificationLink) {
    console.log(`[EMAIL STUB] Verification Link: ${verificationLink}`);
  }
};
