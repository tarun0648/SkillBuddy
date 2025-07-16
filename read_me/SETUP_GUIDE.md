# SkillBuddy Setup Guide

This guide will walk you through setting up and running the SkillBuddy application, which includes a React Native frontend, Flask backend, and community services.

## 📋 Prerequisites

### System Requirements
- **Operating System**: macOS, Windows, or Linux
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 5GB free space
- **Network**: Internet connection for downloading dependencies

### Required Software

#### 1. Node.js and npm
- **Version**: Node.js 16.x or higher
- **Download**: https://nodejs.org/
- **Verify Installation**:
  ```bash
  node --version
  npm --version
  ```

#### 2. Python
- **Version**: Python 3.8 or higher
- **Download**: https://www.python.org/downloads/
- **Verify Installation**:
  ```bash
  python3 --version
  pip3 --version
  ```

#### 3. Git
- **Download**: https://git-scm.com/
- **Verify Installation**:
  ```bash
  git --version
  ```

#### 4. Expo CLI
```bash
npm install -g @expo/cli
```

#### 5. Development Tools (Choose One)

**For iOS Development:**
- **Xcode** (macOS only)
  - Download from Mac App Store
  - Install iOS Simulator
  - Install Command Line Tools: `xcode-select --install`

**For Android Development:**
- **Android Studio**
  - Download: https://developer.android.com/studio
  - Install Android SDK
  - Set up Android Virtual Device (AVD)

**For Web Development:**
- Any modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation Steps

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd skilbuddydev1-main
```

### Step 2: Set Up Backend Environment

#### 2.1 Main Backend (skill-buddy-backend)
```bash
cd skill-buddy-backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 2.2 Community Backend Services
```bash
cd community_backend

# Create virtual environment for each service
cd post_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
cd ..

cd like_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
cd ..

cd reply_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
cd ..
```

### Step 3: Set Up Frontend Environment
```bash
cd interview-app

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli
```

### Step 4: Configure Firebase (Required)

#### 4.1 Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file

#### 4.2 Set Up Firebase Configuration
1. Place the downloaded `serviceAccountKey.json` in the `skill-buddy-backend/` directory
2. Update Firebase configuration in `skill-buddy-backend/config/firebase_config.py` if needed

### Step 5: Environment Configuration

#### 5.1 Backend Environment Variables
Create a `.env` file in `skill-buddy-backend/`:
```env
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_CLIENT_ID=your-google-client-id
```

#### 5.2 Frontend API Configuration
Update the API base URL in `interview-app/services/apiService.js`:
```javascript
const API_BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
```

**To find your local IP:**
- **macOS/Linux**: `ifconfig` or `ip addr`
- **Windows**: `ipconfig`

## 🏃‍♂️ Running the Application

### Option 1: Quick Start (Recommended)
```bash
# Make the startup script executable
chmod +x start_dev.sh

# Run the development environment
./start_dev.sh
```

This will start:
- Main backend server on port 5000
- Frontend Expo development server

### Option 2: Manual Start

#### Start Main Backend
```bash
cd skill-buddy-backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

#### Start Community Services
```bash
cd community_backend
chmod +x start_community_services.sh
./start_community_services.sh
```

#### Start Frontend
```bash
cd interview-app
npm start
```

### Option 3: Individual Service Start

#### Main Backend Only
```bash
cd skill-buddy-backend
source venv/bin/activate
python app.py
```

#### Community Services Only
```bash
cd community_backend/post_service
source venv/bin/activate
python app.py
# Runs on port 5001

cd ../like_service
source venv/bin/activate
python app.py
# Runs on port 5002

cd ../reply_service
source venv/bin/activate
python app.py
# Runs on port 5003
```

#### Frontend Only
```bash
cd interview-app
npm start
```

## 📱 Accessing the Application

### Frontend Access
1. **Mobile Device**: Scan QR code with Expo Go app
2. **iOS Simulator**: Press `i` in terminal
3. **Android Emulator**: Press `a` in terminal
4. **Web Browser**: Press `w` in terminal

### Backend API Endpoints
- **Main Backend**: http://localhost:5000
- **Post Service**: http://localhost:5001
- **Like Service**: http://localhost:5002
- **Reply Service**: http://localhost:5003

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### 2. Python Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 3. Node.js/npm Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Expo Issues
```bash
# Clear Expo cache
expo start -c

# Reset Expo
expo r -c
```

#### 5. Firebase Connection Issues
- Verify `serviceAccountKey.json` is in the correct location
- Check Firebase project configuration
- Ensure internet connection is stable

#### 6. CORS Issues
- Update CORS configuration in `skill-buddy-backend/app.py`
- Ensure frontend is using the correct backend URL

### Network Configuration

#### For Local Development
- Use `localhost` or `127.0.0.1` for backend URLs
- Ensure all services are running on expected ports

#### For Network Access
- Update IP addresses in configuration files
- Configure firewall settings if needed
- Use your local network IP (e.g., `192.168.1.100`)

## 📊 Monitoring and Logs

### Backend Logs
- Check terminal output for each service
- Logs are also written to `skill-buddy-backend/logs/app.log`

### Frontend Logs
- Use Expo DevTools for debugging
- Check browser console for web version
- Use React Native Debugger for advanced debugging

### API Testing
Test backend endpoints using:
- **Postman**: Import `community_backend/postman_collection.json`
- **cURL**: Command line testing
- **Browser**: Direct URL access

## 🛠️ Development Workflow

### Making Changes
1. **Backend Changes**: Restart the respective service
2. **Frontend Changes**: Expo will hot-reload automatically
3. **Configuration Changes**: Restart affected services

### Testing
1. **API Testing**: Use Postman collection
2. **Frontend Testing**: Test on multiple devices/simulators
3. **Integration Testing**: Test complete user flows

## 📚 Additional Resources

### Documentation
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Firebase Documentation](https://firebase.google.com/docs)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Expo DevTools](https://docs.expo.dev/workflow/debugging/)

## 🆘 Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Verify all prerequisites are installed correctly
4. Ensure all services are running on the correct ports
5. Check network connectivity and firewall settings

## ✅ Verification Checklist

Before running the application, ensure:
- [ ] Node.js 16+ installed
- [ ] Python 3.8+ installed
- [ ] Expo CLI installed
- [ ] Firebase credentials configured
- [ ] All dependencies installed
- [ ] Virtual environments created
- [ ] Environment variables set
- [ ] API URLs configured correctly
- [ ] Ports 5000-5003 available

---

**Happy Coding! 🚀** 