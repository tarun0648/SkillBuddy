import React, { useState } from 'react';
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
import ProgressBar from '../components/atoms/ProgressBar';

// Import logo assets
const githubLogo = require('../assets/github.png');
const linkedinLogo = require('../assets/linkedin.png');
const instagramLogo = require('../assets/instagram.png');
const dribbbleLogo = require('../assets/dribble.png');
const resumeLogo = require('../assets/resume.png');
const communityLogo = require('../assets/community.png');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, isLoggedIn } = useAuthStore();
  const { profileCompletionPercentage, xpProgressPercentage, currentLevel, totalXP } = useProgress();
  const [socialLinks, setSocialLinks] = useState({});
  const [showInputModal, setShowInputModal] = useState(false);
  const [currentInputType, setCurrentInputType] = useState('');
  const [inputValue, setInputValue] = useState('');

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
      
      // Format the URL based on the type
      switch (currentInputType) {
        case 'GitHub':
          if (!formattedUrl.startsWith('http')) {
            formattedUrl = `https://github.com/${formattedUrl}`;
          }
          break;
        case 'LinkedIn':
          if (!formattedUrl.startsWith('http')) {
            formattedUrl = `https://www.linkedin.com/in/${formattedUrl}`;
          }
          break;
        case 'Instagram':
          if (!formattedUrl.startsWith('http')) {
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
            formattedUrl = `https://dribbble.com/${formattedUrl}`;
          }
          break;
        case 'Community':
          if (!formattedUrl.startsWith('http')) {
            formattedUrl = `https://${formattedUrl}`;
          }
          break;
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
      default:
        return 'Enter URL';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                {isLoggedIn && user ? (
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

        {/* Progress Section */}
        {isLoggedIn && user && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <View style={styles.progressCards}>
              <View style={styles.progressCard}>
                <Text style={styles.progressLabel}>Profile Completion</Text>
                <ProgressBar percent={profileCompletionPercentage} />
                <Text style={styles.progressValue}>{profileCompletionPercentage}%</Text>
              </View>
              <View style={styles.progressCard}>
                <Text style={styles.progressLabel}>Level {currentLevel}</Text>
                <ProgressBar percent={xpProgressPercentage} />
                <Text style={styles.progressValue}>{totalXP} XP</Text>
              </View>
            </View>
          </View>
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
  scrollContent: { padding: 20, paddingTop: 30 },
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
  progressSection: {
    marginBottom: 30,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
  },
  progressTitle: {
    fontSize: 20,
    color: '#00ff00',
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  progressCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCard: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressValue: {
    fontSize: 16,
    color: '#00ff00',
    fontWeight: '600',
    marginTop: 5,
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
});