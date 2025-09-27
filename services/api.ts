// API Configuration - Automatically detects environment
const getApiBaseUrl = (): string => {
  // Check if we're in production (not localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If accessing via IP or domain (not localhost), use relative URLs for proxy
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api';
    }
  }
  
  // For development, check environment variables
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);

// API Service Class
export class ApiService {
  private static baseUrl = API_BASE_URL;

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('📡 API Request:', url);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ API Success:', endpoint);
      return data;
    } catch (error) {
      console.error('❌ API Error:', endpoint, error);
      throw error;
    }
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }
}

// Auth API
export const authAPI = {
  register: (userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => ApiService.post('/auth/register', userData),

  login: (credentials: {
    email: string;
    password: string;
  }) => ApiService.post('/auth/login', credentials),

  logout: () => ApiService.post('/auth/logout', {}),
};

// Export default
export default ApiService;
