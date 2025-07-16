import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../services/Zuststand';
import AnimatedBackground from '../components/AnimatedBackground';
import apiService from '../services/apiService';
import { useProgress } from '../hooks/useProgress';
import ProgressOverview from '../components/ProgressOverview';
import ProgressNotification from '../components/ProgressNotification';

// Import logo assets
const githubLogo = require('../assets/github.png');
const linkedinLogo = require('../assets/linkedin.png');
const instagramLogo = require('../assets/instagram.png');
const dribbbleLogo = require('../assets/dribble.png');
const resumeLogo = require('../assets/resume.png');
const communityLogo = require('../assets/community.png');
const websiteLogo = require('../assets/world-wide-web.png');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    progressBreakdown, 
    loadProgressData, 
    isLoading: progressLoading,
    error: progressError,
    recentRewards,
    ...xpProgress 
  } = useProgress();
  
  const [isLoading, setIsLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState({});
  const [showInputModal, setShowInputModal] = useState(false);
  const [currentInputType, setCurrentInputType] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [showRewardNotification, setShowRewardNotification] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);

  // Load social links from user profile
  useEffect(() => {
    if (user?.profile?.social_links) {
      setSocialLinks(user.profile.social_links);
    }
  }, [user?.profile?.social_links]);

  // Handle progress refresh
  const handleProgressRefresh = async () => {
    try {
      await loadProgressData();
    } catch (error) {
      console.error('Error refreshing progress:', error);
    }
  };

  // Show reward notification when new rewards are earned
  useEffect(() => {
    if (recentRewards && recentRewards.length > 0) {
      const latestReward = recentRewards[0];
      setCurrentReward(latestReward);
      setShowRewardNotification(true);
    }
  }, [recentRewards]);

  const handleCloseNotification = () => {
    setShowRewardNotification(false);
    setCurrentReward(null);
  };



  const handleStartInterview = () => {
    navigation.navigate('Questions');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleQuickAction = async (type) => {
    // Special handling for Resume
    if (type.toLowerCase() === 'resume') {
      navigation.navigate('ResumeUpload');
      return;
    }

    // Special handling for GitHub Analysis
    if (type.toLowerCase() === 'github') {
              navigation.navigate('GitHubUpload');
      return;
    }

    // Special handling for LinkedIn Analysis
    if (type.toLowerCase() === 'linkedin') {
      navigation.navigate('LinkedInUpload');
      return;
    }

    // Special handling for Community
    if (type.toLowerCase() === 'community') {
      navigation.navigate('Community');
      return;
    }
    
    // Check if we have a stored link first
    if (socialLinks[type.toLowerCase()]) {
      const url = socialLinks[type.toLowerCase()];
      Alert.alert(
        'Open Link', 
        `Would you like to open ${url}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => {
            // In a real app, you would use Linking.openURL(url)
            Alert.alert('Opening', `Opening ${url}`);
          }},
          { text: 'Edit', onPress: () => showInputPrompt(type) }
        ]
      );
    } else {
      showInputPrompt(type);
    }
  };

  const showInputPrompt = (type) => {
    setCurrentInputType(type);
    setInputValue('');
    setShowInputModal(true);
  };

  const handleSaveLink = () => {
    if (inputValue.trim()) {
      let formattedUrl = inputValue.trim();
      
      // Validate URL format before saving
      const validateSocialUrl = (type, url) => {
        if (!url) return false;
        
        const urlToValidate = url.startsWith('http') ? url : `https://${url}`;
        
              // GitHub validation - simple check for github in URL
      if (type === 'GitHub') {
        return urlToValidate.toLowerCase().includes('github');
      }
        
        // LinkedIn validation - allows letters, numbers, hyphens, and underscores for personal profiles
        if (type === 'LinkedIn') {
          const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in\/[a-zA-Z0-9_-]+\/?|company\/[a-zA-Z0-9_-]+\/?)$/;
          return linkedinRegex.test(urlToValidate);
        }
        
        // Instagram validation - allows letters, numbers, dots, and underscores
        if (type === 'Instagram') {
          const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/;
          return instagramRegex.test(urlToValidate);
        }
        
        // Dribbble validation - allows letters, numbers, and hyphens
        if (type === 'Dribbble') {
          const dribbbleRegex = /^https?:\/\/(www\.)?dribbble\.com\/[a-zA-Z0-9-]+\/?$/;
          return dribbbleRegex.test(urlToValidate);
        }
        
        // Resume validation - accepts any valid URL
        if (type === 'Resume') {
          try {
            new URL(urlToValidate);
            return true;
          } catch {
            return false;
          }
        }
        
        // Community validation - accepts any valid URL
        if (type === 'Community') {
          try {
            new URL(urlToValidate);
            return true;
          } catch {
            return false;
          }
        }
        
        // Website validation - more comprehensive domain validation
        if (type === 'Website') {
          const websiteRegex = /^https?:\/\/(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
          return websiteRegex.test(urlToValidate);
        }
        
        // Default URL validation for other types
        try {
          new URL(urlToValidate);
          return true;
        } catch {
          return false;
        }
      };
      
      // Format the URL based on the type
      switch (currentInputType) {
        case 'GitHub':
          if (!formattedUrl.startsWith('http')) {
            // Remove any leading slashes or @ symbols
            formattedUrl = formattedUrl.replace(/^[@\/]+/, '');
            formattedUrl = `https://github.com/${formattedUrl}`;
          }
          break;
        case 'LinkedIn':
          if (!formattedUrl.startsWith('http')) {
            // Remove any leading slashes, @ symbols, or "in/" prefixes
            formattedUrl = formattedUrl.replace(/^[@\/]+/, '').replace(/^in\//, '');
            formattedUrl = `https://www.linkedin.com/in/${formattedUrl}`;
          }
          break;
        case 'Instagram':
          if (!formattedUrl.startsWith('http')) {
            // Remove any leading slashes or @ symbols
            formattedUrl = formattedUrl.replace(/^[@\/]+/, '');
            formattedUrl = `https://www.instagram.com/${formattedUrl}`;
          }
          break;
        case 'Resume':
          if (!formattedUrl.startsWith('http')) {
            formattedUrl = `https://${formattedUrl}`;
          }
          break;
        case 'Dribbble':
          if (!formattedUrl.startsWith('http')) {
            // Remove any leading slashes or @ symbols
            formattedUrl = formattedUrl.replace(/^[@\/]+/, '');
            formattedUrl = `https://dribbble.com/${formattedUrl}`;
          }
          break;
        case 'Community':
          if (!formattedUrl.startsWith('http')) {
            formattedUrl = `https://${formattedUrl}`;
          }
          break;
        case 'Website':
          if (!formattedUrl.startsWith('http')) {
            formattedUrl = `https://${formattedUrl}`;
          }
          break;
      }
      
      // Validate the formatted URL
      if (!validateSocialUrl(currentInputType, formattedUrl)) {
        let errorMessage = `Please enter a valid ${currentInputType} URL.`;
        
        // Provide specific error messages for each platform
        switch (currentInputType) {
          case 'GitHub':
            errorMessage = 'Please enter a valid GitHub username or URL (e.g., "username" or "https://github.com/username")';
            break;
          case 'LinkedIn':
            errorMessage = 'Please enter a valid LinkedIn profile URL (e.g., "username" or "https://linkedin.com/in/username")';
            break;
          case 'Instagram':
            errorMessage = 'Please enter a valid Instagram username or URL (e.g., "username" or "https://instagram.com/username")';
            break;
          case 'Dribbble':
            errorMessage = 'Please enter a valid Dribbble username or URL (e.g., "username" or "https://dribbble.com/username")';
            break;
          case 'Resume':
            errorMessage = 'Please enter a valid resume URL (e.g., "https://example.com/resume.pdf")';
            break;
          case 'Community':
            errorMessage = 'Please enter a valid community URL (e.g., "https://example.com/community")';
            break;
          case 'Website':
            errorMessage = 'Please enter a valid website URL (e.g., "https://example.com")';
            break;
        }
        
        Alert.alert('Invalid URL', errorMessage);
        return;
      }
      
      setSocialLinks(prev => ({
        ...prev,
        [currentInputType.toLowerCase()]: formattedUrl
      }));
      
      Alert.alert('Success', `${currentInputType} link saved successfully!`);
    }
    setShowInputModal(false);
  };

  const getInputPlaceholder = (type) => {
    switch (type) {
      case 'GitHub':
        return 'Enter GitHub username or full URL';
      case 'LinkedIn':
        return 'Enter LinkedIn username or full URL';
      case 'Instagram':
        return 'Enter Instagram username or full URL';
      case 'Resume':
        return 'Enter resume URL';
      case 'Dribbble':
        return 'Enter Dribbble username or full URL';
      case 'Community':
        return 'Enter community URL';
      case 'Website':
        return 'Enter your website URL';
      default:
        return 'Enter URL';
    }
  };

  // Navigation handlers
  const handleNavigation = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        // Already on home, maybe refresh or scroll to top
        break;
      case 'community':
        navigation.navigate('Community');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium" />
      
      {/* Progress Reward Notification */}
      <ProgressNotification
        reward={currentReward}
        visible={showRewardNotification}
        onClose={handleCloseNotification}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Profile Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Skillbuddy!</Text>
          
          {/* Profile Section - Now more prominent */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={28} color="#000" />
              </View>
              <View style={styles.profileTextContainer}>
                {isAuthenticated && user ? (
                  <>
                    <Text style={styles.profileGreeting}>Hello,</Text>
                    <Text style={styles.profileName}>{user.name}!</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.profileGreeting}>Your career coach</Text>
                    <Text style={styles.profileName}>is ready</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Overview */}
        {isAuthenticated && user && (
          <ProgressOverview
            progressBreakdown={progressBreakdown}
            xpProgress={xpProgress}
            onRefresh={handleProgressRefresh}
            isLoading={progressLoading}
          />
        )}

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartInterview}
          >
            <Text style={styles.buttonText}>Start Practice Interview 🚀</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                socialLinks.github && styles.quickActionCardActive
              ]}
              onPress={() => handleQuickAction('GitHub')}
            >
              <Image source={githubLogo} style={styles.quickActionImage} />
              <Text style={styles.quickActionLabel}>GitHub</Text>
              {socialLinks.github && <View style={styles.linkIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                socialLinks.linkedin && styles.quickActionCardActive
              ]}
              onPress={() => handleQuickAction('LinkedIn')}
            >
              <Image source={linkedinLogo} style={styles.quickActionImage} />
              <Text style={styles.quickActionLabel}>LinkedIn</Text>
              {socialLinks.linkedin && <View style={styles.linkIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                socialLinks.instagram && styles.quickActionCardActive
              ]}
              onPress={() => handleQuickAction('Instagram')}
            >
              <Image source={instagramLogo} style={styles.quickActionImage} />
              <Text style={styles.quickActionLabel}>Instagram</Text>
              {socialLinks.instagram && <View style={styles.linkIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                socialLinks.dribbble && styles.quickActionCardActive
              ]}
              onPress={() => handleQuickAction('Dribbble')}
            >
              <Image source={dribbbleLogo} style={styles.quickActionImage} />
              <Text style={styles.quickActionLabel}>Dribbble</Text>
              {socialLinks.dribbble && <View style={styles.linkIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                socialLinks.resume && styles.quickActionCardActive
              ]}
              onPress={() => handleQuickAction('Resume')}
            >
              <Image source={resumeLogo} style={styles.quickActionImage} />
              <Text style={styles.quickActionLabel}>Resume</Text>
              {socialLinks.resume && <View style={styles.linkIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                socialLinks.community && styles.quickActionCardActive
              ]}
              onPress={() => handleQuickAction('Community')}
            >
              <Image source={communityLogo} style={styles.quickActionImage} />
              <Text style={styles.quickActionLabel}>Community</Text>
              {socialLinks.community && <View style={styles.linkIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                socialLinks.website && styles.quickActionCardActive
              ]}
              onPress={() => handleQuickAction('Website')}
            >
              <Image source={websiteLogo} style={styles.quickActionImage} />
              <Text style={styles.quickActionLabel}>Website</Text>
              {socialLinks.website && <View style={styles.linkIndicator} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Why Skillbuddy?</Text>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Multiple Career Paths</Text>
            <Text style={styles.featureDescription}>
              Software Developer, Data Analyst, UI/UX Designer, Digital Marketer
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Realistic Questions</Text>
            <Text style={styles.featureDescription}>
              Practice with industry-standard interview questions
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Track Progress</Text>
            <Text style={styles.featureDescription}>
              Monitor your improvement over time
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('community')}
          >
            <Image source={communityLogo} style={styles.navIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, styles.navItemCenter]}
            onPress={() => handleNavigation('home')}
          >
            <Ionicons name="home" size={28} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('profile')}
          >
            <Ionicons name="person" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Input Modal */}
      <Modal
        visible={showInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add {currentInputType} Link</Text>
            <TextInput
              style={styles.input}
              placeholder={getInputPlaceholder(currentInputType)}
              placeholderTextColor="#666"
              value={inputValue}
              onChangeText={setInputValue}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowInputModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleSaveLink}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 100, // Increased padding to account for bottom nav
  },
  header: { 
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
  },
  profileSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00ff00',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileGreeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  profileName: {
    fontSize: 20,
    color: '#00ff00',
    fontWeight: '600',
  },

  actionsContainer: { marginBottom: 30 },
  primaryButton: {
    backgroundColor: '#00ff00',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginBottom: 40,
  },
  quickActionsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#1a1a1a',
    width: '30%',
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  quickActionCardActive: {
    borderColor: '#00ff00',
    borderWidth: 2,
  },
  quickActionImage: {
    width: 24,
    height: 24,
    marginBottom: 8,
  },
  quickActionLabel: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  linkIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00ff00',
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  featuresContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
  },
  featuresTitle: {
    fontSize: 22,
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  featureCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 16,
    color: '#00ff00',
    marginBottom: 5,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 25,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: '#00ff00',
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#666',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButtonCancel: {
    backgroundColor: '#666',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalButtonSave: {
    backgroundColor: '#00ff00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Bottom Navigation Styles
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
    minWidth: 50,
    minHeight: 50,
    position: 'relative',
  },
  navItemCenter: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: '#666',
  },
});