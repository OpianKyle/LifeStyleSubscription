import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { storage } from '../storage';
import { sendEmail } from './email';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateTokens(userId: string): AuthTokens {
    const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    
    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): { userId: string } {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  }

  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async register(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);
    
    // Generate email verification token
    const emailVerificationToken = this.generateEmailVerificationToken();

    // Create user
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name,
      emailVerificationToken,
      role: 'USER'
    });

    // Send verification email
    const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : (process.env.FRONTEND_URL || 'http://localhost:5000');
    await sendEmail('verifyEmail', {
      name: user.name,
      verificationLink: `${baseUrl}/verify-email?token=${emailVerificationToken}`,
      expiresAt: '24 hours'
    }, user.email, 'Verify your LifeGuard account');

    return { user, message: 'Registration successful. Please check your email to verify your account.' };
  }

  static async login(email: string, password: string) {
    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error('Please verify your email before signing in');
    }

    // Check password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    return { user, tokens };
  }

  static async verifyEmail(token: string) {
    const user = await storage.verifyUserEmail(token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Send welcome email
    await sendEmail('welcome', {
      name: user.name
    }, user.email, 'Welcome to LifeGuard!');

    return user;
  }

  static async requestPasswordReset(email: string) {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('No account found with that email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await storage.setPasswordResetToken(email, resetToken, resetExpires);

    // Send password reset email
    await sendEmail('passwordReset', {
      name: user.name,
      resetLink: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`,
      expiresAt: '1 hour'
    }, user.email, 'Reset your LifeGuard password');

    return { message: 'Password reset email sent' };
  }

  static async resetPassword(token: string, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);
    const user = await storage.resetPassword(token, hashedPassword);
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    return user;
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = this.verifyToken(refreshToken);
      const user = await storage.getUserById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const tokens = this.generateTokens(user.id);
      return { user, tokens };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
