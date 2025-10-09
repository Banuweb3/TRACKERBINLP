/**
 * Facebook Account Model
 * Stores user-specific Facebook tokens and account data
 */

import { pool } from '../config/database.js';

export class FacebookAccount {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.facebookUserId = data.facebook_user_id;
    this.accessToken = data.access_token;
    this.tokenExpiry = data.token_expiry;
    this.refreshToken = data.refresh_token;
    this.accountType = data.account_type; // 'page' or 'ad_account'
    this.accountId = data.account_id;
    this.accountName = data.account_name;
    this.permissions = data.permissions ? JSON.parse(data.permissions) : [];
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create new Facebook account connection
   */
  static async create(userId, facebookData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(`
        INSERT INTO facebook_accounts (
          user_id, facebook_user_id, access_token, token_expiry, 
          refresh_token, account_type, account_id, account_name, 
          permissions, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        facebookData.facebookUserId,
        facebookData.accessToken,
        facebookData.tokenExpiry,
        facebookData.refreshToken || null,
        facebookData.accountType,
        facebookData.accountId,
        facebookData.accountName,
        JSON.stringify(facebookData.permissions || []),
        true
      ]);

      return await this.findById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Find Facebook account by ID
   */
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM facebook_accounts WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? new FacebookAccount(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  /**
   * Find all Facebook accounts for a user
   */
  static async findByUserId(userId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM facebook_accounts WHERE user_id = ? AND is_active = true ORDER BY created_at DESC',
        [userId]
      );
      return rows.map(row => new FacebookAccount(row));
    } finally {
      connection.release();
    }
  }

  /**
   * Find active Facebook accounts by type for user
   */
  static async findByUserAndType(userId, accountType) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM facebook_accounts WHERE user_id = ? AND account_type = ? AND is_active = true',
        [userId, accountType]
      );
      return rows.map(row => new FacebookAccount(row));
    } finally {
      connection.release();
    }
  }

  /**
   * Update access token
   */
  async updateToken(accessToken, tokenExpiry) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE facebook_accounts SET access_token = ?, token_expiry = ?, updated_at = NOW() WHERE id = ?',
        [accessToken, tokenExpiry, this.id]
      );
      
      this.accessToken = accessToken;
      this.tokenExpiry = tokenExpiry;
      return this;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return false;
    return new Date() >= new Date(this.tokenExpiry);
  }

  /**
   * Deactivate account
   */
  async deactivate() {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE facebook_accounts SET is_active = false, updated_at = NOW() WHERE id = ?',
        [this.id]
      );
      this.isActive = false;
      return this;
    } finally {
      connection.release();
    }
  }

  /**
   * Convert to JSON (excluding sensitive data)
   */
  toJSON() {
    return {
      id: this.id,
      accountType: this.accountType,
      accountId: this.accountId,
      accountName: this.accountName,
      permissions: this.permissions,
      isActive: this.isActive,
      tokenExpired: this.isTokenExpired(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
