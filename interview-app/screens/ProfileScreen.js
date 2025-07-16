// screens/ProfileScreen.js (No JWT Token Verification)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../services/Zuststand';
import { useXPStore } from '../services/xpStore';
import apiService from '../services/apiService';
import AnimatedBackground from '../components/AnimatedBackground';
import { useProgress } from '../hooks/useProgress';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUserProfile, logout, isAuthenticated, refreshUserData } = useAuthStore();
  const { profileCompletionPercentage, loadProgressData } = useProgress();
  const { 
    totalXP, 
    level, 
    currentLevelXP, 
    xpToNextLevel, 
    getProgressPercentage, 
    getCurrentBadge,
    loadXPData 
  } = useXPStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    profession: '',
    career_choices: [],
    college_name: '',
    college_email: '',
  });

  const professionOptions = ['Student', 'Graduate', 'Post Graduate', 'Professional', 'Switch Career'];
  const careerOptions = ['Software Developer', 'Data Analyst', 'Digital Marketer', 'UI/UX Designer', 'Product Manager'];

  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  // Add focus effect to reload data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated() && user?.id) {
        loadProfileData();
      }
    }, [user?.id])
  );

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile data
      const response = await apiService.getProfile();
      console.log('Profile response:', response);
      
      const profile = response.user?.profile || {};
      setProfileData({
        name: profile.name || '',
        profession: profile.profession || '',
        career_choices: profile.career_choices || [],
        college_name: profile.college_name || '',
        college_email: profile.college_email || '',
      });
      
      // Load progress data
      await loadProgressData();
      
      // Load XP data
      await loadXPData();
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!profileData.name.trim()) {
        Alert.alert('Error', 'Name is required.');
        return;
      }
      
      if (!profileData.profession) {
        Alert.alert('Error', 'Please select your profession.');
        return;
      }
      
      if (!profileData.career_choices || profileData.career_choices.length === 0) {
        Alert.alert('Error', 'Please select at least one career choice.');
        return;
      }
      
      if (!profileData.college_name.trim() || !profileData.college_email.trim()) {
        Alert.alert('Error', 'College name and email are required.');
        return;
      }
      
      // Update profile
      await updateUserProfile(profileData);
      
      // Refresh user data to ensure everything is updated
      await refreshUserData();
      
      // Reload progress data
      await loadProgressData();
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Intro' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate anyway since logout should always work locally
      navigation.reset({
        index: 0,
        routes: [{ name: 'Intro' }],
      });
    }
  };

  const handleCareerChoiceToggle = (choice) => {
    setProfileData(prev => {
      const currentChoices = prev.career_choices || [];
      const isSelected = currentChoices.includes(choice);
      
      let newChoices;
      if (isSelected) {
        newChoices = currentChoices.filter(c => c !== choice);
      } else {
        if (currentChoices.length >= 3) {
          Alert.alert('Limit Reached', 'You can select up to 3 career choices.');
          return prev;
        }
        newChoices = [...currentChoices, choice];
      }
      
      return {
        ...prev,
        career_choices: newChoices
      };
    });
  };

  const navigateToSocialLinks = () => {
    navigation.navigate('SocialLinks');
  };

  const navigateToResume = () => {
    // Navigate to resume upload screen
    navigation.navigate('ResumeUpload');
  };

  if (!isAuthenticated()) {
    return (
      <SafeAreaView style={styles.container}>
        <AnimatedBackground intensity="medium" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please login to view your profile.</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && !isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <AnimatedBackground intensity="medium" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#00ff00" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutModal(true)}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff0000" />
          </TouchableOpacity>
        </View>

        {/* Profile Stats */}
        <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalXP}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profileCompletionPercentage}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>XP Progress</Text>
            <Text style={styles.progressValue}>{getProgressPercentage()}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getProgressPercentage()}%` }
                ]} 
              />
            </View>
          </View>
          <Text style={styles.progressDetails}>
            {currentLevelXP} / 100 XP • Level {level}
          </Text>
        </View>

        {/* Profile Form */}
        <View style={styles.formContainer}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your full name"
              placeholderTextColor="#666"
              editable={isEditing}
            />
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email || ''}
              editable={false}
            />
          </View>

          {/* Profession */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profession</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {professionOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      profileData.profession === option && styles.optionButtonSelected
                    ]}
                    onPress={() => setProfileData(prev => ({ ...prev, profession: option }))}
                  >
                    <Text style={[
                      styles.optionText,
                      profileData.profession === option && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profileData.profession}
                editable={false}
                placeholder="Select your profession"
                placeholderTextColor="#666"
              />
            )}
          </View>

          {/* Career Choices */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Career Interests (Max 3)</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {careerOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      profileData.career_choices.includes(option) && styles.optionButtonSelected
                    ]}
                    onPress={() => handleCareerChoiceToggle(option)}
                  >
                    <Text style={[
                      styles.optionText,
                      profileData.career_choices.includes(option) && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.selectedChoicesContainer}>
                {profileData.career_choices.length > 0 ? (
                  profileData.career_choices.map((choice, index) => (
                    <View key={index} style={styles.selectedChoice}>
                      <Text style={styles.selectedChoiceText}>{choice}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.placeholderText}>No career interests selected</Text>
                )}
              </View>
            )}
          </View>

          {/* College Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>College/University</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.college_name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, college_name: text }))}
              placeholder="Enter your college/university name"
              placeholderTextColor="#666"
              editable={isEditing}
            />
          </View>

          {/* College Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>College Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profileData.college_email}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, college_email: text }))}
              placeholder="Enter your college email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isEditing}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Social Links Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={navigateToSocialLinks}
          >
            <Ionicons name="link-outline" size={20} color="#00ff00" />
            <Text style={styles.actionButtonText}>Social Links</Text>
          </TouchableOpacity>

          {/* Resume Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={navigateToResume}
          >
            <Ionicons name="document-text-outline" size={20} color="#00ff00" />
            <Text style={styles.actionButtonText}>Resume</Text>
          </TouchableOpacity>
        </View>

        {/* Edit/Save Button */}
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingButtonContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.primaryButtonText}>
                {isEditing ? 'Saving...' : 'Loading...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button (only show when editing) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setIsEditing(false);
              loadProfileData(); // Reload original data
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleLogout}
              >
                <Text style={styles.modalConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#00ff00',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00ff00',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#000',
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  optionButtonSelected: {
    backgroundColor: '#00ff00',
  },
  optionText: {
    color: '#00ff00',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#000',
  },
  selectedChoicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectedChoice: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  selectedChoiceText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff00',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: '#00ff00',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: '#666',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff0000',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff0000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  modalCancelText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#ff0000',
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalConfirmText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressSection: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressValue: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 5,
  },
  progressDetails: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});