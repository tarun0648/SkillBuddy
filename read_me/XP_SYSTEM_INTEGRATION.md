# XP System Integration Documentation

## Overview

The XP (Experience Points) system has been completely integrated with Zustand state management and backend persistence. This ensures that user progression data is properly stored, synced, and persists across app sessions.

## Architecture

### Backend Components

#### 1. XP Endpoints (`skill-buddy-backend/routes/user_routes.py`)

**GET `/user/xp`** - Retrieve user XP data
- Returns total XP, level, progress percentage, and recent gains
- Includes level progress calculation
- Returns recent XP gains history

**PUT `/user/xp`** - Update user XP
- Accepts `amount` (required) and `source` (optional)
- Validates positive XP amounts
- Updates total XP and recalculates level
- Maintains recent gains history (last 10)
- Returns updated XP data

#### 2. XP Data Structure

```json
{
  "total_xp": 250,
  "level": 3,
  "badges": [],
  "level_progress": {
    "current_level_xp": 50,
    "xp_needed_for_next_level": 50,
    "progress_percentage": 50.0
  },
  "recent_gains": [
    {
      "id": 1640995200000,
      "amount": 50,
      "source": "Interview Completion",
      "timestamp": "2022-01-01T00:00:00.000Z"
    }
  ]
}
```

### Frontend Components

#### 1. XP Store (`interview-app/services/xpStore.js`)

**State Management:**
- `totalXP`: Total experience points
- `level`: Current user level
- `currentLevelXP`: XP in current level
- `xpToNextLevel`: XP needed for next level
- `recentGains`: Array of recent XP gains
- `isLoading`: Loading state
- `error`: Error state

**Key Methods:**
- `loadXPData()`: Load XP data from backend and cache
- `addXP(amount, source)`: Add XP and sync with backend
- `calculateLevel(xp)`: Calculate level from XP
- `getXPRewards()`: Get XP rewards for different actions
- `getLevelBadge(level)`: Get badge info for level
- `clearXPData()`: Clear XP data on logout

#### 2. Updated Components

**App.js:**
- Initializes XP store with user ID
- Loads XP data on app startup

**ProfileScreen.js:**
- Displays XP progress bar
- Shows current level and progress
- Uses XP store for data

**HomeScreen.js:**
- Shows XP progress in dashboard
- Displays level and total XP
- Uses XP store for data

**InterviewResultsScreen.js:**
- Awards XP for interview completion
- Uses XP store for XP updates
- Shows XP animations

**useProgress.js:**
- Integrates with XP store
- Provides unified progress interface
- Handles both profile and XP progress

## Data Flow

### 1. App Startup
```
App.js → useAuthStore.checkLogin() → useXPStore.setUserId() → useXPStore.loadXPData()
```

### 2. XP Earning
```
User Action → InterviewResultsScreen → useXPStore.addXP() → API Call → Backend Update → Local State Update → Cache Update
```

### 3. XP Display
```
Component → useXPStore → Local State → UI Display
```

### 4. Data Persistence
```
Backend Database ← API Endpoints ← Frontend Store ← AsyncStorage Cache
```

## XP Rewards System

### Reward Structure
```javascript
{
  INTERVIEW_COMPLETE: 50-100 XP (random),
  PERFECT_INTERVIEW: 100-200 XP (random),
  FIRST_INTERVIEW: 150 XP,
  STREAK_BONUS: 20-50 XP (random),
  FEEDBACK_GIVEN: 25 XP,
  DAILY_LOGIN: 10 XP,
  PROFILE_COMPLETE: 50 XP,
  SOCIAL_LINKS_COMPLETE: 30 XP
}
```

### Level System
- **Level 1**: 0-99 XP
- **Level 2**: 100-199 XP
- **Level 3**: 200-299 XP
- And so on...

Each level requires 100 XP to progress.

## Badge System

### Badge Levels
1. **Rookie** (Level 1) - 🥉 Bronze
2. **Learner** (Level 2) - 📚 Blue
3. **Practitioner** (Level 3) - 💪 Green
4. **Professional** (Level 4) - 🎯 Orange
5. **Expert** (Level 5) - ⭐ Purple
6. **Master** (Level 6) - 🏆 Gold
7. **Champion** (Level 7) - 👑 Red
8. **Legend** (Level 8) - 🔥 Red
9. **Mythic** (Level 9) - 💎 Blue
10. **Godlike** (Level 10+) - 🌟 Dark

## Error Handling

### Backend Validation
- Positive XP amounts only
- Valid data types
- User authentication required
- Database error handling

### Frontend Fallbacks
- Offline XP tracking
- Local cache persistence
- Graceful degradation
- Error state management

## Testing

### Test Script: `test_xp_system.js`

**Test Coverage:**
1. User authentication
2. XP data retrieval
3. XP updates
4. XP persistence
5. Level calculation
6. Invalid input validation
7. Profile completion XP bonuses

**Run Tests:**
```bash
node test_xp_system.js
```

## Migration from Old System

### Changes Made:
1. **Replaced XPContext** with Zustand XP store
2. **Added backend XP endpoints** for persistence
3. **Integrated XP store** with auth system
4. **Updated all components** to use new store
5. **Added comprehensive testing**

### Benefits:
- ✅ XP data persists across app restarts
- ✅ Backend sync ensures data consistency
- ✅ Offline support with local caching
- ✅ Better error handling and validation
- ✅ Comprehensive testing coverage
- ✅ Improved performance with Zustand

## Usage Examples

### Adding XP
```javascript
import { useXPStore } from '../services/xpStore';

const { addXP } = useXPStore();

// Add XP for interview completion
await addXP(75, 'Interview Completion');
```

### Displaying XP Data
```javascript
import { useXPStore } from '../services/xpStore';

const { totalXP, level, getProgressPercentage } = useXPStore();

// Display XP progress
<Text>Level {level} - {totalXP} XP</Text>
<ProgressBar percent={getProgressPercentage()} />
```

### Getting XP Rewards
```javascript
import { useXPStore } from '../services/xpStore';

const { getXPRewards } = useXPStore();
const rewards = getXPRewards();

// Use specific reward
const interviewReward = rewards.INTERVIEW_COMPLETE;
```

## Configuration

### Backend Settings (`config/settings.py`)
```python
XP_REWARDS = {
    'registration': 10,
    'google_signin': 10,
    'profile_step_25': 10,
    'profile_step_50': 15,
    'profile_step_75': 20,
    'profile_complete': 50,
    'first_interview': 100,
    'interview_complete': 50,
    'daily_login': 5
}
```

### Frontend Configuration
XP rewards and level calculations can be customized in `xpStore.js`.

## Troubleshooting

### Common Issues:

1. **XP not updating**: Check network connection and API endpoints
2. **Level calculation wrong**: Verify XP calculation logic
3. **Data not persisting**: Check AsyncStorage permissions
4. **Backend errors**: Verify database connection and user authentication

### Debug Steps:
1. Check browser/device console for errors
2. Verify API endpoints are accessible
3. Test with provided test script
4. Check user authentication status
5. Verify database connectivity

## Future Enhancements

### Planned Features:
- XP leaderboards
- Achievement system
- XP multipliers for streaks
- Special event XP bonuses
- XP trading/gifting system
- Advanced badge system

### Technical Improvements:
- Real-time XP updates with WebSockets
- Advanced caching strategies
- XP analytics and insights
- Performance optimizations 