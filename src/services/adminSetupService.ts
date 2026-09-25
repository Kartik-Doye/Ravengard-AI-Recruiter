import crypto from "crypto";

interface SetupTokenRecord {
  email: string;
  token: string;
  createdAt: Date;
}

const setupTokenStore = new Map<string, SetupTokenRecord>();

export class AdminSetupService {
  /**
   * Initializes or updates an active setup token for an administrator
   */
  public static generateSetupToken(email: string): string {
    const token = crypto.randomBytes(16).toString("hex");
    setupTokenStore.set(email.toLowerCase().trim(), {
      email: email.toLowerCase().trim(),
      token,
      createdAt: new Date()
    });
    return token;
  }

  /**
   * Retrieves active setup token for an administrator
   */
  public static getSetupToken(email: string): string | null {
    const record = setupTokenStore.get(email.toLowerCase().trim());
    return record ? record.token : null;
  }

  /**
   * Verifies and consumes a setup token
   */
  public static verifyAndConsumeToken(email: string, token: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const record = setupTokenStore.get(normalizedEmail);
    if (!record) return false;

    if (record.token === token.trim()) {
      setupTokenStore.delete(normalizedEmail);
      return true;
    }
    return false;
  }

  /**
   * Manually sets or overrides a token (useful for automated test suites)
   */
  public static setSetupToken(email: string, token: string): void {
    setupTokenStore.set(email.toLowerCase().trim(), {
      email: email.toLowerCase().trim(),
      token: token.trim(),
      createdAt: new Date()
    });
  }
}
