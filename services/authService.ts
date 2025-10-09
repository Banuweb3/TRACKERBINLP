// Automatically detect API base URL
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // For local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }

    // For production on droplet
    if (hostname === '165.22.158.48') {
      return 'http://165.22.158.48:3001/api';
    }

    // For other production environments (use same host with port 3001)
    return `http://${hostname}:3001/api`;
  }

  // Fallback for SSR or other environments
  return ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api');
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 Auth API Base URL:', API_BASE_URL);

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load token and user from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearAuth();
      }
    }
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const result: AuthResponse = await response.json();
      this.setAuth(result.token, result.user);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login to:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📡 Login response status:', response.status);
      console.log('📡 Login response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response has content
      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          if (responseText) {
            const error = JSON.parse(responseText);
            errorMessage = error.error || error.message || 'Login failed';
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `Server error (${response.status}): ${responseText || 'No response body'}`;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let result: AuthResponse;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!result.token || !result.user) {
        throw new Error('Invalid response format: missing token or user data');
      }

      this.setAuth(result.token, result.user);
      console.log('✅ Login successful for user:', result.user.email);
      return result;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Verify token
  async verifyToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.clearAuth();
        return false;
      }

      const result = await response.json();
      this.user = result.user;
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuth();
      return false;
    }
  }

  // Get user profile
  async getProfile(): Promise<User> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch profile');
      }

      const result = await response.json();
      this.user = result.user;
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      return result.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const result = await response.json();
      this.user = result.user;
      localStorage.setItem('auth_user', JSON.stringify(this.user));
      return result.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Set authentication data
  private setAuth(token: string, user: User): void {
    this.token = token;
    this.user = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  // Clear authentication data
  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Get authorization headers with token validation
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Get authorization headers with automatic token refresh
  async getValidAuthHeaders(): Promise<Record<string, string>> {
    // First check if we have a token
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    // Verify token is still valid
    const isValid = await this.verifyToken();
    if (!isValid) {
      // Token is expired, clear it and throw error
      this.clearAuth();
      throw new Error('Token expired');
    }

    return this.getAuthHeaders();
  }
}

export const authService = new AuthService();
