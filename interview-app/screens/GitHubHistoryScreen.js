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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../services/Zuststand';
import AnimatedBackground from '../components/AnimatedBackground';
import PageLayout from '../components/layouts/PageLayout';
import apiService from '../services/apiService';

// Color constants matching app theme
const COLORS = {
  primary: '#00ff00',        // Green (main brand color)
  secondary: '#00cc00',      // Darker Green
  accent: '#33ff33',         // Light Green
  background: '#000000',     // Black (main background)
  surface: '#1a1a1a',        // Dark Grey (card backgrounds)
  light: '#FFFFFF',          // Pure White
  white: '#FFFFFF',          // Pure White
  offWhite: '#F5F5F5',       // Off White
  cream: '#F8F8F8',          // Cream White
  dark: '#000000',           // Black
  gray: '#888888',           // Medium Gray (text secondary)
  lightGray: '#CCCCCC',      // Light Gray
  darkGray: '#2a2a2a',       // Dark Gray for borders/dividers
  primaryDark: '#009900',    // Darker primary for gradients
  primaryLight: '#66ff66',   // Lighter primary for gradients
  warning: '#ffcc00',        // Warning color
};

export default function GitHubHistoryScreen() {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();
  
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigation.navigate('Login');
      return;
    }
    loadAnalyses();
  }, [isAuthenticated, user]);

  const loadAnalyses = async () => {
    try {
      const response = await apiService.getUserProfileAnalyses('github');
      
      if (response.success) {
        setAnalyses(response.data.analyses || []);
      } else {
        setError('Failed to load analyses');
      }
    } catch (error) {
      console.error('Load analyses error:', error);
      setError('Failed to load analyses');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return COLORS.primary;
      case 'processing': return COLORS.warning;
      case 'failed': return '#ff4444';
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'processing': return 'time';
      case 'failed': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewAnalysis = (analysisId) => {
    navigation.navigate('GitHubAnalysisResults', { analysisId });
  };

  const handleNewAnalysis = () => {
    navigation.navigate('GitHubUpload');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AnimatedBackground intensity="medium" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading analyses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AnimatedBackground intensity="medium">
      <PageLayout message={'GitHub Analysis History\nView your past analyses\nClick on any analysis\nTo see detailed results'} higher={true}>
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.title}>GitHub Analysis History</Text>
              <TouchableOpacity
                style={styles.newButton}
                onPress={handleNewAnalysis}
              >
                <Ionicons name="add" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.mainContent}>
              {error && (
                <View style={styles.errorSection}>
                  <Ionicons name="alert-circle" size={24} color="#ff4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {analyses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyCard}>
                    <Ionicons name="logo-github" size={64} color={COLORS.gray} />
                    <Text style={styles.emptyTitle}>No GitHub Analyses Yet</Text>
                    <Text style={styles.emptyDescription}>
                      Start your first GitHub profile analysis to see your results here.
                    </Text>
                    <TouchableOpacity
                      style={styles.newAnalysisButton}
                      onPress={handleNewAnalysis}
                    >
                      <Text style={styles.newAnalysisButtonText}>Start First Analysis</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.analysesContainer}>
                  {analyses.map((analysis, index) => (
                    <TouchableOpacity
                      key={analysis.analysis_id || index}
                      style={styles.analysisCard}
                      onPress={() => handleViewAnalysis(analysis.analysis_id)}
                    >
                      <View style={styles.analysisHeader}>
                        <View style={styles.analysisInfo}>
                          <Text style={styles.analysisTitle}>
                            Analysis #{analysis.analysis_id?.slice(-8) || 'N/A'}
                          </Text>
                          <Text style={styles.analysisDate}>
                            {formatDate(analysis.created_at)}
                          </Text>
                        </View>
                        <View style={styles.statusContainer}>
                          <Ionicons 
                            name={getStatusIcon(analysis.status)} 
                            size={20} 
                            color={getStatusColor(analysis.status)} 
                          />
                          <Text style={[styles.statusText, { color: getStatusColor(analysis.status) }]}>
                            {analysis.status}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.analysisDetails}>
                        <Text style={styles.usernameText}>
                          Username: {analysis.github_username || 'N/A'}
                        </Text>
                        {analysis.grade && (
                          <Text style={styles.gradeText}>
                            Grade: {analysis.grade}/100
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </PageLayout>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
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
    color: COLORS.primary,
    fontWeight: '700',
  },
  newButton: {
    padding: 10,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.light,
    fontSize: 16,
    marginTop: 15,
  },
  errorSection: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    minWidth: 300,
  },
  emptyTitle: {
    fontSize: 20,
    color: COLORS.light,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  newAnalysisButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newAnalysisButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  analysesContainer: {
    flex: 1,
  },
  analysisCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  analysisInfo: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 5,
  },
  analysisDate: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  analysisDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkGray,
  },
  usernameText: {
    fontSize: 16,
    color: COLORS.light,
  },
  gradeText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
}); 