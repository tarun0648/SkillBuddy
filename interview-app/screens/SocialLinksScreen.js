// screens/SocialLinksScreen.js (Fixed for Backend Integration)
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../services/Zuststand';
import apiService from '../services/apiService';
import AnimatedBackground from '../components/AnimatedBackground';

export default function SocialLinksScreen() {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    github: '',
    linkedin: '',
    instagram: '',
    resume: '',
    portfolio: '',
  });

  useEffect(() => {
    if (isAuthenticated()) {
      loadSocialLinks();
    }
  }, []);

  const loadSocialLinks = async () => {
    try {
      setIsLoading(true);
      console.log('Loading social links for user:', user?.id);
      
      const response = await apiService.getProfile();
      console.log('Profile response for social links:', response);
      
      const currentSocialLinks = response.user?.profile?.social_links || {};
      setSocialLinks({
        github: currentSocialLinks.github || '',
        linkedin: currentSocialLinks.linkedin || '',
        instagram: currentSocialLinks.instagram || '',
        resume: currentSocialLinks.resume || '',
        portfolio: currentSocialLinks.portfolio || '',
      });
    } catch (error) {
      console.error('Error loading social links:', error);
      // Don't show error alert for loading, just use empty defaults
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated()) {
      Alert.alert('Authentication Required', 'Please login to save your social links.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Saving social links:', socialLinks);
      
      // Prepare social links data - send all links including empty ones
      const socialLinksData = {
        social_links: {
          github: socialLinks.github.trim(),
          linkedin: socialLinks.linkedin.trim(),
          instagram: socialLinks.instagram.trim(),
          resume: socialLinks.resume.trim(),
          portfolio: socialLinks.portfolio.trim(),
        }
      };
      
      console.log('Social links data to save:', socialLinksData);
      
      // Update profile with social links
      const response = await apiService.updateProfile(socialLinksData);
      console.log('Social links update response:', response);
      
      Alert.alert(
        'Success',
        'Social links updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating social links:', error);
      Alert.alert('Error', error.message || 'Failed to update social links. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (type) => {
    let url = '';
    
    switch (type) {
      case 'github':
        if (socialLinks.github) {
          url = socialLinks.github.startsWith('http') 
            ? socialLinks.github 
            : `https://github.com/${socialLinks.github}`;
        }
        break;
      case 'linkedin':
        if (socialLinks.linkedin) {
          url = socialLinks.linkedin.startsWith('http') 
            ? socialLinks.linkedin 
            : `https://www.linkedin.com/in/${socialLinks.linkedin}`;
        }
        break;
      case 'instagram':
        if (socialLinks.instagram) {
          const username = socialLinks.instagram.replace('@', '');
          url = `https://www.instagram.com/${username}`;
        }
        break;
      case 'resume':
        if (socialLinks.resume) {
          url = socialLinks.resume.startsWith('http') 
            ? socialLinks.resume 
            : `https://${socialLinks.resume}`;
        }
        break;
      case 'portfolio':
        if (socialLinks.portfolio) {
          url = socialLinks.portfolio.startsWith('http') 
            ? socialLinks.portfolio 
            : `https://${socialLinks.portfolio}`;
        }
        break;
    }
    
    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open this URL.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open URL.');
      }
    } else {
      Alert.alert('No Link', `Please add your ${type} link first.`);
    }
  };

  const validateUrl = (url) => {
    if (!url) return true; // Empty is valid
    
    // If it doesn't start with http, add it for validation
    const urlToValidate = url.startsWith('http') ? url : `https://${url}`;
    
    try {
      new URL(urlToValidate);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (key, value) => {
    setSocialLinks(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isAuthenticated()) {
    return (
      <SafeAreaView style={styles.container}>
        <AnimatedBackground intensity="medium" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please login to manage your social links.</Text>
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
          <Text style={styles.title}>Social Links</Text>
          <View style={styles.placeholder} />
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.userInfoText}>
              Updating links for: {user.email}
            </Text>
          </View>
        )}

        {/* Social Links Form */}
        <View style={styles.formContainer}>
          {/* GitHub */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>GitHub Profile</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  socialLinks.github && !validateUrl(socialLinks.github) && styles.inputError
                ]}
                value={socialLinks.github}
                onChangeText={(text) => handleInputChange('github', text)}
                placeholder="username or full URL"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('github')}
                disabled={isLoading}
              >
                <Ionicons name="open-outline" size={20} color="#00ff00" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Enter username or full GitHub URL</Text>
            {socialLinks.github && !validateUrl(socialLinks.github) && (
              <Text style={styles.errorText}>Please enter a valid URL</Text>
            )}
          </View>

          {/* LinkedIn */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>LinkedIn Profile</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  socialLinks.linkedin && !validateUrl(socialLinks.linkedin) && styles.inputError
                ]}
                value={socialLinks.linkedin}
                onChangeText={(text) => handleInputChange('linkedin', text)}
                placeholder="username or full URL"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('linkedin')}
                disabled={isLoading}
              >
                <Ionicons name="open-outline" size={20} color="#00ff00" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Enter username or full LinkedIn URL</Text>
            {socialLinks.linkedin && !validateUrl(socialLinks.linkedin) && (
              <Text style={styles.errorText}>Please enter a valid URL</Text>
            )}
          </View>

          {/* Instagram */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instagram Username</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={socialLinks.instagram}
                onChangeText={(text) => handleInputChange('instagram', text)}
                placeholder="@username"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('instagram')}
                disabled={isLoading}
              >
                <Ionicons name="open-outline" size={20} color="#00ff00" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Enter Instagram username (with or without @)</Text>
          </View>

          {/* Resume */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Resume Link</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  socialLinks.resume && !validateUrl(socialLinks.resume) && styles.inputError
                ]}
                value={socialLinks.resume}
                onChangeText={(text) => handleInputChange('resume', text)}
                placeholder="https://your-resume-link.com"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('resume')}
                disabled={isLoading}
              >
                <Ionicons name="open-outline" size={20} color="#00ff00" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Enter full URL to your resume</Text>
            {socialLinks.resume && !validateUrl(socialLinks.resume) && (
              <Text style={styles.errorText}>Please enter a valid URL</Text>
            )}
          </View>

          {/* Portfolio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Portfolio Website</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  socialLinks.portfolio && !validateUrl(socialLinks.portfolio) && styles.inputError
                ]}
                value={socialLinks.portfolio}
                onChangeText={(text) => handleInputChange('portfolio', text)}
                placeholder="https://your-portfolio.com"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('portfolio')}
                disabled={isLoading}
              >
                <Ionicons name="open-outline" size={20} color="#00ff00" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Enter full URL to your portfolio website</Text>
            {socialLinks.portfolio && !validateUrl(socialLinks.portfolio) && (
              <Text style={styles.errorText}>Please enter a valid URL</Text>
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingButtonContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 44,
  },
  userInfoContainer: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  userInfoText: {
    color: '#00ff00',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#000',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff0000',
  },
  actionButton: {
    padding: 14,
  },
  hint: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#00ff00',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});