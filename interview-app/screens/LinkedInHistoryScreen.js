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
import apiService from '../services/apiService';

export default function LinkedInHistoryScreen() {
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
      const response = await apiService.get('/profile-analysis/user/analyses?type=linkedin');
      
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
      case 'completed': return '#00ff00';
      case 'processing': return '#ffaa00';
      case 'failed': return '#ff4444';
      default: return '#666';
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
    navigation.navigate('LinkedInAnalysis', { analysisId });
  };

  const handleNewAnalysis = () => {
    navigation.navigate('LinkedInAnalysis');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AnimatedBackground intensity="medium" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.loadingText}>Loading analyses...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>LinkedIn Analysis History</Text>
          <TouchableOpacity
            style={styles.newButton}
            onPress={handleNewAnalysis}
          >
            <Ionicons name="add" size={24} color="#00ff00" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {error && (
            <View style={styles.errorSection}>
              <Ionicons name="alert-circle" size={24} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {analyses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="logo-linkedin" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No LinkedIn Analyses Yet</Text>
              <Text style={styles.emptyDescription}>
                Start your first LinkedIn profile analysis to see your results here.
              </Text>
              <TouchableOpacity
                style={styles.newAnalysisButton}
                onPress={handleNewAnalysis}
              >
                <Text style={styles.newAnalysisButtonText}>Start First Analysis</Text>
              </TouchableOpacity>
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
                    <Text style={styles.urlText}>
                      Profile: {analysis.profile_url ? analysis.profile_url.split('/in/')[1]?.split('/')[0] || 'N/A' : 'N/A'}
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
  newButton: {
    padding: 10,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  newAnalysisButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  newAnalysisButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  analysesContainer: {
    flex: 1,
  },
  analysisCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
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
    color: '#00ff00',
    fontWeight: '600',
    marginBottom: 5,
  },
  analysisDate: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  urlText: {
    fontSize: 16,
    color: '#fff',
  },
  gradeText: {
    fontSize: 16,
    color: '#00ff00',
    fontWeight: '600',
  },
}); 