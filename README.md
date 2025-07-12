# Skill Buddy - Interview Practice App

A comprehensive interview practice application with a React Native frontend and Flask backend, featuring AI-powered interview questions and real-time feedback.

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **Backend**: Flask API with Firebase integration
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + JWT tokens

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (for mobile testing)

### Installation

1. **Clone and setup the project:**
   ```bash
   # The project is already set up with both frontend and backend
   ```

2. **Install dependencies:**
   ```bash
   # Backend dependencies (already installed)
   cd skill-buddy-backend
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Frontend dependencies (already installed)
   cd ../interview-app
   npm install
   ```

3. **Configure Firebase:**
   - Ensure `serviceAccountKey.json` is present in the backend directory
   - Update Firebase configuration in `skill-buddy-backend/config/firebase_config.py` if needed

### Running the Application

#### Option 1: Use the startup script (Recommended)
```bash
./start_dev.sh
```

This will start both the backend and frontend servers automatically.

#### Option 2: Manual startup

**Start Backend:**
```bash
cd skill-buddy-backend
source venv/bin/activate
python app.py
```

**Start Frontend (in a new terminal):**
```bash
cd interview-app
npm start
```

## 📱 Frontend (React Native)

### Features
- User authentication (login/signup)
- Career path selection
- Interactive interview sessions
- Real-time feedback and scoring
- Progress tracking and XP system
- Beautiful animations and UI

### Key Components
- `screens/`: Main application screens
- `components/`: Reusable UI components
- `services/`: API service layer
- `context/`: React context for state management
- `navigation/`: Navigation configuration

### API Configuration
The frontend is configured to connect to the backend at `http://192.168.1.4:5000/api`. Update this in `services/apiService.js` if your IP changes.

## 🔧 Backend (Flask)

### Features
- RESTful API endpoints
- Firebase integration
- JWT authentication
- Rate limiting
- CORS configuration
- Interview question management

### Key Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/interview/questions/{career_path}` - Get interview questions
- `POST /api/interview/start` - Start interview session
- `POST /api/interview/response` - Submit interview response
- `POST /api/interview/end` - End interview session

### Configuration
- Update CORS origins in `app.py` if needed
- Configure Firebase credentials in `config/firebase_config.py`
- Set environment variables for production deployment

## 🔗 API Integration

The frontend and backend are linked through:

1. **API Service Layer** (`interview-app/services/apiService.js`)
   - Handles all HTTP requests to the backend
   - Manages authentication tokens
   - Provides error handling and logging

2. **CORS Configuration** (`skill-buddy-backend/app.py`)
   - Allows requests from frontend development servers
   - Configured for both localhost and network IP addresses

3. **Authentication Flow**
   - Frontend sends credentials to backend
   - Backend validates with Firebase
   - JWT tokens are issued for subsequent requests

## 🛠️ Development

### Backend Development
```bash
cd skill-buddy-backend
source venv/bin/activate
python app.py
```

### Frontend Development
```bash
cd interview-app
npm start
```

### Testing the Connection
1. Start both servers
2. Open the Expo app on your device/simulator
3. Try to register/login - this will test the API connection
4. Check the backend console for incoming requests

## 📊 Monitoring

### Backend Logs
- Check the terminal where the backend is running
- Look for request logs and error messages
- Firebase connection status is logged on startup

### Frontend Logs
- Use Expo DevTools for debugging
- Check the browser console when using Expo web
- API requests are logged in the console

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure backend is running on port 5000
   - Check if IP address in `apiService.js` is correct
   - Verify CORS configuration

2. **Firebase Errors**
   - Check if `serviceAccountKey.json` is present
   - Verify Firebase project configuration
   - Ensure Firebase Admin SDK is properly initialized

3. **Frontend Build Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`
   - Reset Expo cache: `expo start -c`

4. **Backend Import Errors**
   - Ensure virtual environment is activated
   - Reinstall dependencies: `pip install -r requirements.txt`

## 🚀 Deployment

### Backend Deployment
- Configure for production (update CORS, secrets, etc.)
- Use Gunicorn for production server
- Set up environment variables

### Frontend Deployment
- Build for production: `expo build`
- Configure for app store deployment
- Update API endpoints for production

## 📝 Environment Variables

Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_ID=your-google-client-id
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Interviewing! 🎯** 