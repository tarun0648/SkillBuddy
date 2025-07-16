import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../services/Zuststand';
import AnimatedBackground from '../components/AnimatedBackground';
import PageLayout from '../components/layouts/PageLayout';
import apiService from '../services/apiService';

export default function GitHubAnalysisResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isAuthenticated } = useAuthStore();
  
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('overview');

  const analysisId = route.params?.analysisId;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigation.navigate('Login');
      return;
    }

    if (analysisId) {
      loadAnalysisResults();
    } else {
      setError('No analysis ID provided');
      setIsLoading(false);
    }
  }, [isAuthenticated, user, analysisId]);

  const loadAnalysisResults = async () => {
    try {
      console.log('Loading analysis results for:', analysisId);
      const response = await apiService.getProfileAnalysisResults(analysisId);
      
      console.log('Analysis results response:', response);
      
      if (response && response.status === 'completed') {
        console.log('Setting analysis results:', response);
        setAnalysisResults(response);
        setAnalysisStatus('completed');
      } else {
        console.log('Analysis not completed yet, status:', response?.status);
        setError('Analysis not completed yet');
        setAnalysisStatus('pending');
      }
    } catch (error) {
      console.error('Load results error:', error);
      setError('Failed to load analysis results');
      setAnalysisStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    loadAnalysisResults();
  };



  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff00';
    if (score >= 60) return '#ffaa00';
    return '#ff4444';
  };

  const renderTabButton = (tabName, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabName && styles.activeTabButton]}
      onPress={() => setActiveTab(tabName)}
    >
      <Ionicons name={icon} size={20} color={activeTab === tabName ? '#00ff00' : '#666'} />
      <Text style={[styles.tabButtonText, activeTab === tabName && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderOverview = () => {
    if (!analysisResults) return null;

    const results = analysisResults.analysis_results || {};
    const grade = analysisResults.grade || 0;

    return (
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>
          <Ionicons name="logo-github" size={32} color="#00ff00" />
          <Text style={styles.analysisTitle}>GitHub Profile Overview</Text>
        </View>
        
        {/* Grade Section */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Overall Grade</Text>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(grade) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(grade) }]}>{grade}/100</Text>
          </View>
        </View>

        {/* Strengths & Weaknesses */}
        {results.strengths && Array.isArray(results.strengths) && results.strengths.length > 0 && (
          <View style={styles.strengthsContainer}>
            <Text style={styles.strengthsTitle}>✅ Your Strengths</Text>
            {results.strengths.map((strength, index) => (
              <View key={index} style={styles.strengthItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ff00" />
                <Text style={styles.strengthText}>{String(strength || '')}</Text>
              </View>
            ))}
          </View>
        )}

        {results.weaknesses && Array.isArray(results.weaknesses) && results.weaknesses.length > 0 && (
          <View style={styles.weaknessesContainer}>
            <Text style={styles.weaknessesTitle}>⚠️ Areas for Improvement</Text>
            {results.weaknesses.map((weakness, index) => (
              <View key={index} style={styles.weaknessItem}>
                <Ionicons name="alert-circle" size={16} color="#ffaa00" />
                <Text style={styles.weaknessText}>{String(weakness || '')}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderScores = () => {
    if (!analysisResults) return null;

    const results = analysisResults.analysis_results || {};

    return (
      <View style={styles.qualityContainer}>
        <View style={styles.qualityHeader}>
          <Ionicons name="analytics" size={24} color="#00ff00" />
          <Text style={styles.qualityTitle}>Detailed Scores</Text>
        </View>
        
        <View style={styles.scoresSection}>
          {results.overall_score && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(results.overall_score) }]}>
                {results.overall_score}/100
              </Text>
            </View>
          )}
          {results.profile_completeness_score && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Profile Completeness</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(results.profile_completeness_score) }]}>
                {results.profile_completeness_score}/100
              </Text>
            </View>
          )}
          {results.repository_quality_score && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Repository Quality</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(results.repository_quality_score) }]}>
                {results.repository_quality_score}/100
              </Text>
            </View>
          )}
          {results.activity_consistency_score && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Activity Consistency</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(results.activity_consistency_score) }]}>
                {results.activity_consistency_score}/100
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSuggestions = () => {
    if (!analysisResults) return null;

    const suggestions = analysisResults.suggestions || {};

    const cleanSuggestionText = (text) => {
      if (!text) return '';
      
      // Remove JSON brackets, quotes, and extra formatting
      let cleaned = String(text)
        .replace(/[{}[\]]/g, '') // Remove brackets
        .replace(/"/g, '') // Remove quotes
        .replace(/,/g, '') // Remove commas
        .replace(/\\n/g, '\n') // Convert escaped newlines
        .replace(/\\/g, '') // Remove backslashes
        .trim();
      
      // Split by common separators and format as bullet points
      const points = cleaned.split(/[.;]/).filter(point => point.trim().length > 0);
      
      if (points.length > 1) {
        return points.map(point => `• ${point.trim()}`).join('\n');
      }
      
      return cleaned;
    };

    return (
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>
          <Ionicons name="bulb" size={32} color="#00ff00" />
          <Text style={styles.analysisTitle}>Recommendations</Text>
        </View>
        
        {Object.keys(suggestions).length > 0 ? (
          Object.entries(suggestions).map(([category, suggestion], index) => {
            let suggestionText = '';
            if (typeof suggestion === 'string') {
              suggestionText = cleanSuggestionText(suggestion);
            } else if (typeof suggestion === 'object' && suggestion !== null) {
              if (suggestion.description) {
                suggestionText = cleanSuggestionText(suggestion.description);
              } else if (suggestion.text) {
                suggestionText = cleanSuggestionText(suggestion.text);
              } else if (suggestion.message) {
                suggestionText = cleanSuggestionText(suggestion.message);
              } else {
                suggestionText = cleanSuggestionText(JSON.stringify(suggestion));
              }
            } else {
              suggestionText = cleanSuggestionText(String(suggestion || ''));
            }

            return (
              <View key={index} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <Ionicons name="bulb" size={20} color="#00ff00" />
                  <Text style={styles.suggestionCategory}>{category}</Text>
                </View>
                <Text style={styles.suggestionText}>{suggestionText}</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptySuggestions}>
            <Ionicons name="checkmark-circle" size={48} color="#00ff00" />
            <Text style={styles.emptySuggestionsText}>Great job! No specific recommendations at this time.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'scores':
        return renderScores();
      case 'suggestions':
        return renderSuggestions();
      default:
        return renderOverview();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AnimatedBackground intensity="medium" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.loadingText}>Loading analysis results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PageLayout message="Woof! Here's my analysis!">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
              {analysisStatus === 'pending' && (
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : analysisResults ? (
            <>
              {/* Tab Navigation */}
              <View style={styles.tabContainer}>
                {renderTabButton('overview', 'Overview', 'logo-github')}
                {renderTabButton('scores', 'Scores', 'analytics')}
                {renderTabButton('suggestions', 'Tips', 'bulb')}
              </View>

              {/* Tab Content */}
              {renderContent()}


            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="logo-github" size={48} color="#ff4444" />
              <Text style={styles.errorText}>No analysis results available.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181c20',
  },
  scrollView: {
    flex: 1,
    marginTop: 160,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00ff00',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: '#00ff00',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#333',
  },
  tabButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabButtonText: {
    color: '#00ff00',
  },
  analysisContainer: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00ff00',
    marginLeft: 12,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
  },
  strengthsContainer: {
    marginTop: 20,
    backgroundColor: '#1a3a1a',
    borderRadius: 8,
    padding: 16,
  },
  strengthsTitle: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  strengthText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  weaknessesContainer: {
    marginTop: 16,
    backgroundColor: '#3a2a1a',
    borderRadius: 8,
    padding: 16,
  },
  weaknessesTitle: {
    color: '#ffaa00',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  weaknessText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  qualityContainer: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  qualityTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00ff00',
    marginLeft: 12,
  },
  scoresSection: {
    marginBottom: 30,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionCard: {
    backgroundColor: '#1a3a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00ff00',
    marginLeft: 8,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  emptySuggestions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySuggestionsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },

});
