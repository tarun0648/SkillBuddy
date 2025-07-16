import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from './atoms/ProgressBar';

const ProgressOverview = ({ 
  progressBreakdown, 
  xpProgress, 
  onRefresh, 
  isLoading = false 
}) => {
  const {
    profile,
    socialLinks,
    resume,
    analysis,
    interview,
    overall
  } = progressBreakdown;

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#00ff00'; // Green
    if (percentage >= 60) return '#ffaa00'; // Orange
    if (percentage >= 40) return '#ff8800'; // Dark Orange
    return '#ff4444'; // Red
  };

  const getProgressIcon = (percentage) => {
    if (percentage >= 80) return 'checkmark-circle';
    if (percentage >= 60) return 'ellipse';
    if (percentage >= 40) return 'alert-circle';
    return 'close-circle';
  };

  const renderProgressCard = (item, key) => (
    <View key={key} style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View style={styles.progressIconContainer}>
          <Text style={styles.progressIcon}>{item.icon}</Text>
          <Ionicons 
            name={getProgressIcon(item.percentage)} 
            size={16} 
            color={getProgressColor(item.percentage)} 
            style={styles.statusIcon}
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>{item.label}</Text>
          <Text style={styles.progressDescription}>{item.description}</Text>
        </View>
        <Text style={[styles.progressPercentage, { color: getProgressColor(item.percentage) }]}>
          {item.percentage}%
        </Text>
      </View>
      <ProgressBar percent={item.percentage} />
    </View>
  );

  const renderXPProgress = () => (
    <View style={styles.xpCard}>
      <View style={styles.xpHeader}>
        <Text style={styles.xpIcon}>⭐</Text>
        <View style={styles.xpInfo}>
          <Text style={styles.xpLabel}>Level {xpProgress.level}</Text>
          <Text style={styles.xpDescription}>
            {xpProgress.totalXP} XP • {xpProgress.xpToNextLevel} XP to next level
          </Text>
        </View>
        <Text style={styles.xpProgressPercentage}>
          {xpProgress.xpProgressPercentage}%
        </Text>
      </View>
      <ProgressBar percent={xpProgress.xpProgressPercentage} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={isLoading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color="#00ff00" 
            style={[styles.refreshIcon, isLoading && styles.refreshIconSpinning]} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Progress */}
        <View style={styles.overallProgressCard}>
          <View style={styles.overallHeader}>
            <Text style={styles.overallIcon}>{overall.icon}</Text>
            <View style={styles.overallInfo}>
              <Text style={styles.overallLabel}>{overall.label}</Text>
              <Text style={styles.overallDescription}>{overall.description}</Text>
            </View>
            <Text style={[styles.overallPercentage, { color: getProgressColor(overall.percentage) }]}>
              {overall.percentage}%
            </Text>
          </View>
          <ProgressBar percent={overall.percentage} />
        </View>

        {/* XP Progress */}
        {renderXPProgress()}

        {/* Individual Progress Cards */}
        {renderProgressCard(profile, 'profile')}
        {renderProgressCard(socialLinks, 'socialLinks')}
        {renderProgressCard(resume, 'resume')}
        {renderProgressCard(analysis, 'analysis')}
        {renderProgressCard(interview, 'interview')}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: '#00ff00',
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  refreshIcon: {
    opacity: 1,
  },
  refreshIconSpinning: {
    opacity: 0.5,
  },
  scrollContainer: {
    maxHeight: 400,
  },
  overallProgressCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  overallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  overallInfo: {
    flex: 1,
  },
  overallLabel: {
    fontSize: 18,
    color: '#00ff00',
    fontWeight: '600',
  },
  overallDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  overallPercentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  xpCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  xpInfo: {
    flex: 1,
  },
  xpLabel: {
    fontSize: 16,
    color: '#ffd700',
    fontWeight: '600',
  },
  xpDescription: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  xpProgressPercentage: {
    fontSize: 16,
    color: '#ffd700',
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  progressIcon: {
    fontSize: 20,
  },
  statusIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  progressDescription: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProgressOverview; 