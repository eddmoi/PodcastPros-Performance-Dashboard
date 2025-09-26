import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface PasswordManager {
  verifyPassword(password: string): Promise<boolean>;
  changePassword(currentPassword: string, newPassword: string): Promise<boolean>;
  initializeFromEnv(): Promise<void>;
}

interface StoredPassword {
  hash: string;
  salt: string;
  origin: 'env' | 'dev'; // Track whether password came from env var or dev default
  createdAt: string; // ISO timestamp
  environment: string; // NODE_ENV when created
}

class SecurePasswordManager implements PasswordManager {
  private storedPassword: StoredPassword | null = null;
  private readonly passwordFile = path.join(process.cwd(), 'data', '.admin-password.json');

  constructor() {
    // Initialize password on startup
    this.initializeFromEnv().catch(console.error);
  }

  async initializeFromEnv(): Promise<void> {
    const envPassword = process.env.ADMIN_PASSWORD;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // First try to load from file if it exists, with production validation
    if (await this.loadFromFile()) {
      // In production, validate the password file origin
      if (isProduction && this.storedPassword?.origin === 'dev') {
        throw new Error('Development password file detected in production. Please set ADMIN_PASSWORD environment variable to initialize a secure production password.');
      }
      
      // In production, if ADMIN_PASSWORD is set, always reinitialize with env password
      if (isProduction && envPassword) {
        console.log('Production environment detected with ADMIN_PASSWORD set. Reinitializing password from environment variable.');
        await this.createPasswordFromEnvironment(envPassword);
        return;
      }
      
      console.log('Admin password loaded from secure storage');
      return;
    }

    // If no file exists, initialize from environment variable
    if (!envPassword) {
      // In production, fail fast - require ADMIN_PASSWORD to be set
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_PASSWORD environment variable is required in production. Please set a secure password.');
      }
      
      // For development/testing only, fall back to a secure default but warn about it
      const defaultPassword = 'admin123';
      console.warn('WARNING: ADMIN_PASSWORD not set. Using default password for development only. Set ADMIN_PASSWORD environment variable before deploying to production.');
      
      // Ensure data directory exists
      const dataDir = path.dirname(this.passwordFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Generate salt and hash the default password
      const salt = crypto.randomBytes(32).toString('hex');
      const hash = await this.hashPassword(defaultPassword, salt);
      
      this.storedPassword = { 
        hash, 
        salt, 
        origin: 'dev',
        createdAt: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      };
      
      // Save to file for persistence
      await this.saveToFile();
      console.log('Admin password initialized with default value for development');
      return;
    }
    
    if (envPassword.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters long for security.');
    }
    
    console.log('Initializing admin password from environment variable');
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.passwordFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Generate salt and hash the initial password
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = await this.hashPassword(envPassword, salt);
    
    this.storedPassword = { 
      hash, 
      salt, 
      origin: 'env',
      createdAt: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Save to file for persistence
    await this.saveToFile();
  }

  private async createPasswordFromEnvironment(envPassword: string): Promise<void> {
    if (envPassword.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters long for security.');
    }
    
    console.log('Initializing admin password from environment variable');
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.passwordFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Generate salt and hash the password
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = await this.hashPassword(envPassword, salt);
    
    this.storedPassword = { 
      hash, 
      salt, 
      origin: 'env',
      createdAt: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Save to file for persistence
    await this.saveToFile();
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      });
    });
  }

  async verifyPassword(password: string): Promise<boolean> {
    if (!this.storedPassword) {
      await this.initializeFromEnv();
    }
    
    if (!this.storedPassword) {
      return false;
    }

    const hash = await this.hashPassword(password, this.storedPassword.salt);
    return crypto.timingSafeEqual(
      Buffer.from(this.storedPassword.hash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    // Verify current password first
    const isCurrentValid = await this.verifyPassword(currentPassword);
    if (!isCurrentValid) {
      return false;
    }

    // Generate new salt and hash for the new password
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = await this.hashPassword(newPassword, salt);
    
    // Preserve origin but update other metadata
    this.storedPassword = { 
      hash, 
      salt, 
      origin: this.storedPassword?.origin || 'env', // Preserve origin, default to 'env'
      createdAt: new Date().toISOString(), // Update timestamp for password change
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Save to file for persistence
    await this.saveToFile();
    
    console.log('Admin password changed successfully');
    return true;
  }

  private async loadFromFile(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.passwordFile)) {
        return false;
      }
      
      const data = await fs.promises.readFile(this.passwordFile, 'utf8');
      this.storedPassword = JSON.parse(data);
      return true;
    } catch (error) {
      console.error('Failed to load password from file:', error);
      return false;
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      if (this.storedPassword) {
        await fs.promises.writeFile(
          this.passwordFile, 
          JSON.stringify(this.storedPassword, null, 2),
          { mode: 0o600 } // Restrict file permissions
        );
      }
    } catch (error) {
      console.error('Failed to save password to file:', error);
    }
  }
}

// Export singleton instance
export const passwordManager = new SecurePasswordManager();