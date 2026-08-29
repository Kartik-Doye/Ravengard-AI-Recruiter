export const sendWelcomeEmail = async (email: string, name?: string) => {
  console.log(`Sending welcome email to ${name || email}...`);
};
