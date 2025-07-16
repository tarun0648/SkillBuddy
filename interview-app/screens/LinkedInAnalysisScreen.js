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
import apiService from '../services/apiService';

export default function LinkedInAnalysisScreen() {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();
  
  const [linkedinUrl, setLinkedinUrl] = useState('');
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

  const validateLinkedInUrl = (url) => {
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in\/[a-zA-Z0-9_-]+\/?|company\/[a-zA-Z0-9_-]+\/?)$/;
    return linkedinRegex.test(url);
  };

  const handleAnalyzeLinkedIn = async () => {
    if (!linkedinUrl.trim()) {
      Alert.alert('Error', 'Please enter a LinkedIn URL');
      return;
    }

    if (!validateLinkedInUrl(linkedinUrl.trim())) {
      Alert.alert('Error', 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResults(null);

    try {
      const response = await apiService.post('/profile-analysis/analyze/linkedin', {
        linkedin_url: linkedinUrl.trim()
      });

      if (response.success) {
        setAnalysisId(response.data.analysis_id);
        setAnalysisStatus('pending');
        Alert.alert('Success', 'LinkedIn analysis started! Check back in a few minutes for results.');
        startStatusPolling(response.data.analysis_id);
      } else {
        setError(response.error || 'Failed to start analysis');
      }
    } catch (error) {
      console.error('LinkedIn analysis error:', error);
      setError('Failed to start LinkedIn analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusPolling = (id) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiService.get(`/profile-analysis/status/${id}`);
        
        if (response.success) {
          const status = response.data.status;
          setAnalysisStatus(status);
          
          if (status === 'completed') {
            clearInterval(pollInterval);
            fetchAnalysisResults(id);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setError(response.data.error_message || 'Analysis failed');
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Clear interval after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const fetchAnalysisResults = async (id) => {
    try {
      const response = await apiService.get(`/profile-analysis/results/${id}`);
      
      if (response.success) {
        setAnalysisResults(response.data);
      } else {
        setError('Failed to fetch analysis results');
      }
    } catch (error) {
      console.error('Fetch results error:', error);
      setError('Failed to fetch analysis results');
    }
  };

  const handleViewHistory = () => {
    navigation.navigate('LinkedInHistory');
  };

  const renderAnalysisResults = () => {
    if (!analysisResults) return null;

    const results = analysisResults.analysis_results;
    const suggestions = analysisResults.suggestions;
    const grade = analysisResults.grade;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Analysis Results</Text>
        
        {/* Grade Section */}
        <View style={styles.gradeSection}>
          <Text style={styles.gradeLabel}>Overall Grade</Text>
          <View style={styles.gradeCircle}>
            <Text style={styles.gradeText}>{grade}/100</Text>
          </View>
        </View>

        {/* Profile Analysis */}
        {results.profile_analysis && (
          <View style={styles.scoresSection}>
            <Text style={styles.sectionTitle}>Profile Analysis</Text>
            {results.profile_analysis.overall_score && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Overall Score</Text>
                <Text style={styles.scoreValue}>{results.profile_analysis.overall_score}/100</Text>
              </View>
            )}
            {results.profile_analysis.completeness_score && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Profile Completeness</Text>
                <Text style={styles.scoreValue}>{results.profile_analysis.completeness_score}/100</Text>
              </View>
            )}
            {results.profile_analysis.headline_score && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Headline Quality</Text>
                <Text style={styles.scoreValue}>{results.profile_analysis.headline_score}/100</Text>
              </View>
            )}
            {results.profile_analysis.summary_score && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Summary Quality</Text>
                <Text style={styles.scoreValue}>{results.profile_analysis.summary_score}/100</Text>
              </View>
            )}
            {results.profile_analysis.experience_score && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Experience Presentation</Text>
                <Text style={styles.scoreValue}>{results.profile_analysis.experience_score}/100</Text>
              </View>
            )}
            {results.profile_analysis.skills_score && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Skills & Endorsements</Text>
                <Text style={styles.scoreValue}>{results.profile_analysis.skills_score}/100</Text>
              </View>
            )}
            {results.profile_analysis.network_score && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Network Building</Text>
                <Text style={styles.scoreValue}>{results.profile_analysis.network_score}/100</Text>
              </View>
            )}
            {results.profile_analysis.content_score && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Content Strategy</Text>
                <Text style={styles.scoreValue}>{results.profile_analysis.content_score}/100</Text>
              </View>
            )}
          </View>
        )}

        {/* Strengths & Weaknesses */}
        {results.strengths && results.strengths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            {results.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ff00" />
                <Text style={styles.listText}>{strength}</Text>
              </View>
            ))}
          </View>
        )}

        {results.weaknesses && results.weaknesses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas for Improvement</Text>
            {results.weaknesses.map((weakness, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="alert-circle" size={16} color="#ffaa00" />
                <Text style={styles.listText}>{weakness}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggestions */}
        {suggestions && Object.keys(suggestions).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {Object.entries(suggestions).map(([category, suggestion], index) => (
              <View key={index} style={styles.suggestionItem}>
                <Text style={styles.suggestionCategory}>{category}</Text>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#00ff00" />
          </TouchableOpacity>
          <Text style={styles.title}>LinkedIn Analysis</Text>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={handleViewHistory}
          >
            <Ionicons name="time" size={24} color="#00ff00" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="logo-linkedin" size={48} color="#0077b5" />
            <Text style={styles.infoTitle}>Analyze Your LinkedIn Profile</Text>
            <Text style={styles.infoDescription}>
              Get professional insights about your LinkedIn profile, networking strategy, 
              content effectiveness, and career optimization recommendations.
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>LinkedIn Profile URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://linkedin.com/in/your-username"
              placeholderTextColor="#666"
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
              onPress={handleAnalyzeLinkedIn}
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
                <ActivityIndicator color="#00ff00" />
                <Text style={styles.statusText}>
                  {analysisStatus === 'pending' && 'Analysis queued...'}
                  {analysisStatus === 'processing' && 'Analyzing your LinkedIn profile...'}
                  {analysisStatus === 'completed' && 'Analysis completed!'}
                  {analysisStatus === 'failed' && 'Analysis failed'}
                </Text>
              </View>
            </View>
          )}

          {/* Error Section */}
          {error && (
            <View style={styles.errorSection}>
              <Ionicons name="alert-circle" size={24} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Results Section */}
          {renderAnalysisResults()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
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
}); 