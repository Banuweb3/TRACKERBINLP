

# Trackerbi

A comprehensive analytics platform for BPO call quality analysis with user authentication, database storage, and AI-powered insights.

## Features

- **Audio Analysis**: Record or upload audio files for transcription and analysis
- **Multi-language Support**: Supports multiple source languages with automatic translation
- **AI-Powered Insights**: Comprehensive analysis including sentiment analysis, keyword extraction, and coaching feedback
- **User Authentication**: Secure user registration and login system
- **Session Management**: Save and retrieve analysis sessions with full history
- **Modern UI**: Beautiful glass morphism design with responsive layout

## Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **Gemini API Key** (for AI analysis)

## Setup Instructions

### 1. Frontend Setup

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the frontend:
   ```bash
   npm run dev
   ```

### 2. Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Configure your environment:
   - Copy `.env.example` to `.env`
   - Update the database credentials in `.env`:
     ```
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=your_mysql_username
     DB_PASSWORD=your_mysql_password
     DB_NAME=bpo_analytics
     ```
   - Set a secure JWT secret:
     ```
     JWT_SECRET=your_super_secret_jwt_key_here
     ```

4. Set up the MySQL database:
   ```bash
   # Create the database and tables
   node scripts/initDatabase.js
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Usage

1. **Sign Up/Sign In**: Create an account or log in to save your analysis results
2. **Choose Input Method**: Record audio directly or upload an audio file
3. **Select Language**: Choose the source language of your audio
4. **Analyze**: The system will transcribe, translate (if needed), and provide comprehensive analysis
5. **View History**: Access your previous analysis sessions from the History panel
6. **Review Results**: View transcription, translation, sentiment analysis, keywords, and coaching feedback

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Analysis
- `POST /api/analysis/sessions` - Create analysis session
- `GET /api/analysis/sessions` - Get user sessions
- `GET /api/analysis/sessions/:id` - Get specific session
- `POST /api/analysis/sessions/:id/results` - Store analysis results
- `PUT /api/analysis/sessions/:id` - Update session
- `DELETE /api/analysis/sessions/:id` - Delete session
- `GET /api/analysis/results/search` - Search analysis results
- `GET /api/analysis/stats` - Get user statistics

## Database Schema

The application uses MySQL with the following main tables:
- `users` - User accounts and profiles
- `analysis_sessions` - Analysis session metadata
- `analysis_results` - Detailed analysis data
- `user_sessions` - JWT token management

## Technologies Used

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for build tooling

### Backend
- Node.js with Express
- MySQL with connection pooling
- JWT for authentication
- bcrypt for password hashing
- Rate limiting and security middleware

### AI Services
- Google Gemini API for transcription, translation, and analysis
"# TRACKERBINLP" 
"# TRACKERBINLP" 
"# TRACKERBINLP" 
"# newtrackernlp" 
