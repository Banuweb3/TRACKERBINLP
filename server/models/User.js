import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.role = data.role;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.isActive = data.is_active;
  }

  // Create new user
  static async create({ username, email, password, firstName, lastName, role = 'user' }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const [result] = await pool.execute(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, firstName, lastName, role]
      );

      return await User.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
        [id]
      );
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
        [username]
      );
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get user with password for authentication
  static async findByEmailWithPassword(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async update(data) {
    try {
      const fields = [];
      const values = [];

      if (data.firstName !== undefined) {
        fields.push('first_name = ?');
        values.push(data.firstName);
      }
      if (data.lastName !== undefined) {
        fields.push('last_name = ?');
        values.push(data.lastName);
      }
      if (data.email !== undefined) {
        fields.push('email = ?');
        values.push(data.email);
      }

      if (fields.length === 0) return this;

      values.push(this.id);

      await pool.execute(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      return await User.findById(this.id);
    } catch (error) {
      throw error;
    }
  }

  // Get user's analysis sessions count
  async getAnalysisCount() {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM analysis_sessions WHERE user_id = ?',
        [this.id]
      );
      
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
