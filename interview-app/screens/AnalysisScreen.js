import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';
import PeppyImage from '../components/atoms/PeppyImage';
import ChatBubble from '../components/molecules/ChatBubble';

const formatSummaryParagraph = (summary) => {
  if (!summary) return '';
  const safeList = (arr, noneMsg = 'N/A') =>
    Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : noneMsg;

  return [
    `Name: ${summary.name !== undefined ? summary.name : 'N/A'}`,
    `Current Role: ${summary.current_role !== undefined ? summary.current_role : 'N/A'}`,
    `Years of Experience: ${typeof summary.years_experience === 'number' ? summary.years_experience : 'N/A'}`,
    `Highest Education: ${summary.highest_education !== undefined ? summary.highest_education : 'N/A'}`,
    `Skills Count: ${typeof summary.skills_count === 'number' ? summary.skills_count : 'N/A'} (${safeList(summary.top_skills)})`,
    `Projects Count: ${typeof summary.projects_count === 'number' ? summary.projects_count : 'N/A'}`,
    `Work Experience: ${typeof summary.work_experience_count === 'number' ? summary.work_experience_count : 'N/A'}`,
    `Education: ${typeof summary.education_count === 'number' ? summary.education_count : 'N/A'}`,
    `Top Skills: ${safeList(summary.top_skills)}`,
    `Recent Companies: ${safeList(summary.recent_companies, 'None (student, no work experience)')}`
  ].join('\n');
};

const AnalysisScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [qualityAnalysis, setQualityAnalysis] = useState(null);
  const [improvementTips, setImprovementTips] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'quality', 'tips'
  
  // Update active tab when data loads
  useEffect(() => {
    if (!analysis && qualityAnalysis) {
      setActiveTab('quality');
    } else if (!analysis && !qualityAnalysis && improvementTips) {
      setActiveTab('tips');
    }
  }, [analysis, qualityAnalysis, improvementTips]);
  const resumeId = route.params?.resumeId;

  useEffect(() => {
    const fetchAnalysisData = async () => {
      setLoading(true);
      setError(null);
      try {
        let id = resumeId;
        if (!id) {
          // Fetch latest resume
          const userResumes = await apiService.getUserResumes();
          if (userResumes.resumes && userResumes.resumes.length > 0) {
            id = userResumes.resumes[0].id;
          }
        }
        if (!id) throw new Error('No resume found');

        // Fetch real data from API endpoints
        const [summaryResponse, qualityResponse, improvementsResponse] = await Promise.allSettled([
          apiService.getResumeSummary(id),
          apiService.getResumeQuality(id),
          apiService.getResumeImprovements(id)
        ]);

        // Handle summary data
        if (summaryResponse.status === 'fulfilled') {
          setAnalysis(summaryResponse.value.summary);
        } else {
          console.error('Failed to fetch summary:', summaryResponse.reason);
        }

        // Handle quality analysis data
        if (qualityResponse.status === 'fulfilled') {
          setQualityAnalysis(qualityResponse.value.quality_analysis);
        } else {
          console.error('Failed to fetch quality analysis:', qualityResponse.reason);
        }

        // Handle improvement suggestions data
        if (improvementsResponse.status === 'fulfilled') {
          setImprovementTips(improvementsResponse.value.suggestions);
        } else {
          console.error('Failed to fetch improvements:', improvementsResponse.reason);
        }

        // If no data was fetched successfully, show error
        if (summaryResponse.status === 'rejected' && 
            qualityResponse.status === 'rejected' && 
            improvementsResponse.status === 'rejected') {
          throw new Error('Failed to fetch analysis data from all endpoints');
        }

        // Show partial success message if some data was fetched
        const successCount = [
          summaryResponse.status === 'fulfilled',
          qualityResponse.status === 'fulfilled',
          improvementsResponse.status === 'fulfilled'
        ].filter(Boolean).length;
        
        if (successCount > 0 && successCount < 3) {
          console.log(`Successfully fetched ${successCount}/3 analysis components`);
        }

      } catch (e) {
        setError(e.message || 'Failed to fetch analysis data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysisData();
  }, [resumeId]);



  const renderQualityScore = () => {
    if (!qualityAnalysis) return null;
    
    const score = qualityAnalysis.quality_score || 0;
    const getScoreColor = (score) => {
      if (score >= 80) return '#00ff00';
      if (score >= 60) return '#ffaa00';
      return '#ff4444';
    };

    return (
      <View style={styles.qualityContainer}>
        <View style={styles.qualityHeader}>
          <Ionicons name="analytics" size={24} color="#00ff00" />
          <Text style={styles.qualityTitle}>Quality Analysis</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Overall Quality Score</Text>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>{score}/100</Text>
          </View>
        </View>
        {qualityAnalysis.feedback && qualityAnalysis.feedback.length > 0 && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackTitle}>Areas for Improvement:</Text>
            {qualityAnalysis.feedback.map((item, index) => (
              <View key={index} style={styles.feedbackItem}>
                <Ionicons name="alert-circle" size={16} color="#ffaa00" />
                <Text style={styles.feedbackText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderImprovementTips = () => {
    if (!improvementTips) return null;

    return (
      <View style={styles.tipsContainer}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb" size={24} color="#00ff00" />
          <Text style={styles.tipsTitle}>Improvement Tips</Text>
        </View>

        {/* Immediate Actions */}
        {improvementTips.immediate_actions && improvementTips.immediate_actions.length > 0 && (
          <View style={styles.tipSection}>
            <Text style={styles.sectionTitle}>🚀 Immediate Actions</Text>
            {improvementTips.immediate_actions.map((action, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipAction}>{action.action}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: action.priority === 'high' ? '#ff4444' : '#ffaa00' }]}>
                    <Text style={styles.priorityText}>{action.priority}</Text>
                  </View>
                </View>
                <Text style={styles.tipDescription}>{action.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Content Improvements */}
        {improvementTips.content_improvements && improvementTips.content_improvements.length > 0 && (
          <View style={styles.tipSection}>
            <Text style={styles.sectionTitle}>📝 Content Improvements</Text>
            {improvementTips.content_improvements.map((improvement, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipAction}>{improvement.suggestion}</Text>
                <Text style={styles.tipDescription}>{improvement.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skill Enhancements */}
        {improvementTips.skill_enhancements && improvementTips.skill_enhancements.length > 0 && (
          <View style={styles.tipSection}>
            <Text style={styles.sectionTitle}>💡 Skill Enhancements</Text>
            {improvementTips.skill_enhancements.map((enhancement, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipAction}>{enhancement.suggestion}</Text>
                <Text style={styles.tipDescription}>{enhancement.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Formatting Suggestions */}
        {improvementTips.formatting_suggestions && improvementTips.formatting_suggestions.length > 0 && (
          <View style={styles.tipSection}>
            <Text style={styles.sectionTitle}>🎨 Formatting Tips</Text>
            {improvementTips.formatting_suggestions.map((suggestion, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipAction}>{suggestion.suggestion}</Text>
                <Text style={styles.tipDescription}>{suggestion.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Career Advice */}
        {improvementTips.career_advice && improvementTips.career_advice.length > 0 && (
          <View style={styles.tipSection}>
            <Text style={styles.sectionTitle}>🎯 Career Tips</Text>
            {improvementTips.career_advice.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipAction}>{tip.tip}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
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

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <View style={styles.analysisContainer}>
            <View style={styles.analysisHeader}>
              <Ionicons name="document-text" size={32} color="#00ff00" />
              <Text style={styles.analysisTitle}>Resume Summary</Text>
            </View>
            <View style={styles.analysisContent}>
              <Text style={styles.analysisText}>{formatSummaryParagraph(analysis)}</Text>
            </View>
          </View>
        );
      case 'quality':
        return renderQualityScore();
      case 'tips':
        return renderImprovementTips();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Peppy Dog Avatar */}
      <PeppyImage />
      
      {/* Chat Bubble */}
      <View style={styles.chatContainer}>
        <ChatBubble message="Woof! Here is my analysis!" />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00ff00" />
              <Text style={styles.loadingText}>Analyzing your resume...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ff4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (analysis || qualityAnalysis || improvementTips) ? (
            <>
              {/* Tab Navigation */}
              <View style={styles.tabContainer}>
                {analysis && renderTabButton('summary', 'Summary', 'document-text')}
                {qualityAnalysis && renderTabButton('quality', 'Quality', 'analytics')}
                {improvementTips && renderTabButton('tips', 'Tips', 'bulb')}
              </View>

              {/* Tab Content */}
              {renderContent()}
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="document-text" size={48} color="#ff4444" />
              <Text style={styles.errorText}>No analysis available.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181c20',
  },
  chatContainer: {
    position: 'absolute',
    top: 80,
    left: 100,
    zIndex: 100,
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
  analysisContent: {
    flex: 1,
  },
  analysisText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'left',
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
  feedbackContainer: {
    marginTop: 16,
  },
  feedbackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  tipsContainer: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tipsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00ff00',
    marginLeft: 12,
  },
  tipSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipAction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tipDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AnalysisScreen; 