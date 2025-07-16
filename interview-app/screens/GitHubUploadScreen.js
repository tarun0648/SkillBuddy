import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../services/Zuststand';
import AnimatedBackground from '../components/AnimatedBackground';
import PageLayout from '../components/layouts/PageLayout';
import apiService from '../services/apiService';

export default function GitHubUploadScreen() {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();
  
  const [githubUsername, setGithubUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigation.navigate('Login');
    }
  }, [isAuthenticated, user]);

  const validateGitHubUsername = (username) => {
    // Simple validation - just check if username is not empty
    return username.trim().length > 0;
  };

  const extractGitHubUsername = (input) => {
    const trimmed = input.trim();
    
    // If it's a GitHub URL, extract the username
    if (trimmed.includes('github.com/')) {
      const match = trimmed.match(/github\.com\/([^\/\?]+)/);
      return match ? match[1] : trimmed;
    }
    
    // If it's just a username, return as is
    return trimmed;
  };

  const handleAnalyzeGitHub = async () => {
    const trimmedUsername = githubUsername.trim();
    
    if (!trimmedUsername) {
      Alert.alert('Error', 'Please enter a GitHub username');
      return;
    }

    console.log('Validating GitHub username:', trimmedUsername);
    const isValid = validateGitHubUsername(trimmedUsername);
    console.log('Validation result:', isValid);

    if (!isValid) {
      Alert.alert('Error', 'Please enter a valid GitHub username.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResults(null);

    try {
      const cleanUsername = extractGitHubUsername(githubUsername);
      console.log('Extracted GitHub username:', cleanUsername);
      
      const response = await apiService.analyzeGitHub(cleanUsername);

      if (response && response.analysis_id) {
        setAnalysisId(response.analysis_id);
        setAnalysisStatus('pending');
        Alert.alert('Success', 'GitHub analysis started! Check back in a few minutes for results.');
        startStatusPolling(response.analysis_id);
      } else {
        setError(response?.error || 'Failed to start analysis');
      }
    } catch (error) {
      console.error('GitHub analysis error:', error);
      setError('Failed to start GitHub analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusPolling = (id) => {
    console.log('Starting status polling for analysis:', id);
    
    const pollInterval = setInterval(async () => {
      try {
        console.log('Polling status for analysis:', id);
        const response = await apiService.getProfileAnalysisStatus(id);
        
        if (response && response.status) {
          const status = response.status;
          console.log('Analysis status:', status);
          setAnalysisStatus(status);
          
          if (status === 'completed') {
            console.log('Analysis completed, fetching results...');
            clearInterval(pollInterval);
            fetchAnalysisResults(id);
          } else if (status === 'failed') {
            console.log('Analysis failed:', response.error_message);
            clearInterval(pollInterval);
            setError(response.error_message || 'Analysis failed');
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 5000); // Poll every 5 seconds for faster response

    // Clear interval after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('Status polling timeout');
    }, 300000);
  };

  const fetchAnalysisResults = async (id) => {
    try {
      console.log('Fetching analysis results for:', id);
      const response = await apiService.getProfileAnalysisResults(id);
      
      console.log('Analysis results response:', response);
      
      if (response && response.status === 'completed') {
        console.log('Analysis completed, navigating to results screen');
        // Navigate to results screen instead of showing results here
        navigation.navigate('GitHubAnalysisResults', { analysisId: id });
      } else {
        console.log('Analysis not completed yet, status:', response?.status);
        setError('Analysis not completed yet');
      }
    } catch (error) {
      console.error('Fetch results error:', error);
      setError('Failed to fetch analysis results');
    }
  };

  const handleViewResults = () => {
    if (analysisId) {
      navigation.navigate('GitHubAnalysisResults', { analysisId });
    }
  };

  return (
    <AnimatedBackground intensity="medium">
      <PageLayout message={'Upload your GitHub\nusername to get started\nwith profile analysis'} higher={true}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>GitHub Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your GitHub username"
              placeholderTextColor="#666"
              value={githubUsername}
              onChangeText={setGithubUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
              onPress={handleAnalyzeGitHub}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.analyzeButtonText}>Start Analysis</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Status Section */}
          {analysisStatus && (
            <View style={styles.statusSection}>
              <Text style={styles.statusTitle}>Analysis Status</Text>
              <View style={styles.statusCard}>
                {analysisStatus !== 'completed' && <ActivityIndicator color="#00ff00" />}
                <Text style={styles.statusText}>
                  {analysisStatus === 'pending' && 'Analysis queued...'}
                  {analysisStatus === 'processing' && 'Analyzing your GitHub profile...'}
                  {analysisStatus === 'completed' && '✅ Analysis completed!'}
                  {analysisStatus === 'failed' && '❌ Analysis failed'}
                </Text>
              </View>
              {analysisStatus === 'completed' && analysisId && (
                <TouchableOpacity
                  style={styles.viewResultsButton}
                  onPress={handleViewResults}
                >
                  <Text style={styles.viewResultsButtonText}>View Results</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Error Section */}
          {error && (
            <View style={styles.errorSection}>
              <Ionicons name="alert-circle" size={24} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}


        </View>
      </ScrollView>
      </PageLayout>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerSpacer: {
    width: 44,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    color: '#00ff00',
    fontWeight: '700',
  },
  historyButton: {
    padding: 10,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  infoTitle: {
    fontSize: 20,
    color: '#00ff00',
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    backgroundColor: '#1a1a1a',
    padding: 25,
    borderRadius: 15,
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    color: '#00ff00',
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: '#00ff00',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  statusSection: {
    backgroundColor: '#1a1a1a',
    padding: 25,
    borderRadius: 15,
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 18,
    color: '#00ff00',
    fontWeight: '600',
    marginBottom: 15,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
  errorSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  resultsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 25,
    borderRadius: 15,
  },
  resultsTitle: {
    fontSize: 22,
    color: '#00ff00',
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  gradeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gradeLabel: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 15,
  },
  gradeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  gradeText: {
    fontSize: 20,
    color: '#000',
    fontWeight: '700',
  },
  scoresSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#00ff00',
    fontWeight: '600',
    marginBottom: 15,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#fff',
  },
  scoreValue: {
    fontSize: 16,
    color: '#00ff00',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  suggestionItem: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  suggestionCategory: {
    fontSize: 16,
    color: '#00ff00',
    fontWeight: '600',
    marginBottom: 5,
  },
  suggestionText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  viewResultsButton: {
    backgroundColor: '#00ff00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  viewResultsButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
}); 