import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import { useAuthStore } from '../services/Zuststand';
import ConfettiAnimation from '../components/ConfettiAnimation';
import PeppyImage from '../components/atoms/PeppyImage';
import AnimatedBackground from '../components/AnimatedBackground';
import PageLayout from '../components/layouts/PageLayout';

const { width, height } = Dimensions.get('window');

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

const ResumeUploadScreen = ({ navigation }) => {
  const { user, isLoggedIn } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [extractionResults, setExtractionResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [storageVerification, setStorageVerification] = useState(null);
  const [isVerifyingStorage, setIsVerifyingStorage] = useState(false);
  const [resumeSummary, setResumeSummary] = useState(null);
  const [resumeQuality, setResumeQuality] = useState(null);
  const [resumeKeywords, setResumeKeywords] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [linkedinResult, setLinkedinResult] = useState(null);
  const [githubResult, setGithubResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const fileInputRef = useRef(null);
  const pollingTimeoutRef = useRef(null);

  const allowedFileTypes = [
    'application/pdf'
  ];

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadLatestResume = async () => {
      if (!isLoggedIn || !user) return;
      try {
        apiService.setUserId(user.id);
        const userResumes = await apiService.getUserResumes();
        if (userResumes.resumes && userResumes.resumes.length > 0) {
          // Use the most recent resume
          const latestResume = userResumes.resumes[0];
          setSelectedFile({
            name: latestResume.filename || 'Resume.pdf',
            size: latestResume.file_size || 0,
            uri: '', // No local URI, but we can show name/size
          });
          setResumeId(latestResume.id);
          setUploadSuccess(true);
          // Optionally, fetch processing status
          checkProcessingStatus(latestResume.id);
          // Automatically fetch and show summary for latest resume
          await fetchAllResumeData(latestResume.id);
          setShowSummary(true);
        }
      } catch (error) {
        // Fallback: try to load from AsyncStorage
        try {
          const hasResume = await AsyncStorage.getItem('hasResume');
          if (hasResume && JSON.parse(hasResume)) {
            // Show a placeholder resume if we can't get details
            setSelectedFile({ name: 'Resume.pdf', size: 0, uri: '' });
            setUploadSuccess(true);
          }
        } catch (e) {}
      }
    };
    loadLatestResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  const allowedExtensions = ['.pdf'];

  const validateFile = (file) => {
    if (!file) return false;
    
    const isValidType = allowedFileTypes.includes(file.mimeType);
    const isValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    return isValidType && isValidExtension;
  };

  const getFileSize = (size) => {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedFileTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        if (validateFile(file)) {
          setSelectedFile(file);
        } else {
          Alert.alert(
            'Invalid File Type',
            'Please select a PDF file.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a resume file first.');
      return;
    }

    if (!isLoggedIn || !user) {
      Alert.alert('Authentication Required', 'Please login to upload your resume.');
      return;
    }

    // Additional validation
    if (!selectedFile.uri) {
      Alert.alert('File Error', 'Selected file is invalid. Please choose a different file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('Starting resume upload for user:', user?.id);
      console.log('Selected file details:', selectedFile);

      // Create form data
      const formData = new FormData();
      formData.append('resume', {
        uri: selectedFile.uri,
        type: 'application/pdf',
        name: selectedFile.name,
      });

      // Add job description if needed (optional)
      formData.append('job_description', '');

      console.log('FormData prepared for upload');

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to backend
      const response = await apiService.uploadResume(formData);
      console.log('Resume upload response:', response);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Store resume ID for future reference
      setResumeId(response.resume_id);
      setUploadSuccess(true);

      // Update resume status in AsyncStorage
      try {
        await AsyncStorage.setItem('hasResume', JSON.stringify(true));
        console.log('Resume status updated in storage');
      } catch (error) {
        console.log('Error updating resume status in storage:', error);
      }

      // Show confetti animation
      setShowConfetti(true);

      // Hide confetti after 3 seconds and start polling for status
      setTimeout(() => {
        setShowConfetti(false);
        // Start polling for processing status
        checkProcessingStatus(response.resume_id);
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(0);
      setIsUploading(false);
            Alert.alert('Upload Failed', error.message || 'Failed to upload resume. Please try again.');
    }
  };

  const removeFile = () => {
    // Only allow replacing, not removing
    // setSelectedFile(null);
    // setUploadProgress(0);
  };

  const checkProcessingStatus = async (resumeId) => {
    if (!resumeId) return;
    
    setIsCheckingStatus(true);
    let pollCount = 0;
    const maxPolls = 30; // Poll for up to 10 minutes (30 * 20 seconds)
    const pollInterval = 20000; // 20 seconds
    
    const pollStatus = async () => {
      try {
        const status = await apiService.getResumeStatus(resumeId);
        setProcessingStatus(status);
        
        console.log(`Poll ${pollCount + 1}: Status = ${status.status}`);
        
        // If processing is completed, fetch results and stop polling
        if (status.status === 'completed') {
          console.log('Processing completed! Fetching results...');
          const results = await apiService.getResumeResults(resumeId);
          setExtractionResults(results);
          setShowResults(true);
          
          // Also fetch all resume data for summary
          await fetchAllResumeData(resumeId);
          
          setIsCheckingStatus(false);
          return; // Stop polling
        }
        
        // If processing failed, stop polling
        if (status.status === 'failed') {
          console.log('Processing failed:', status.error_message);
          setIsCheckingStatus(false);
          Alert.alert('Processing Failed', status.error_message || 'Resume processing failed. Please try again.');
          return; // Stop polling
        }
        
        // Continue polling if still processing
        pollCount++;
        if (pollCount < maxPolls) {
          pollingTimeoutRef.current = setTimeout(pollStatus, pollInterval);
        } else {
          console.log('Max polling time reached');
          setIsCheckingStatus(false);
          Alert.alert('Processing Timeout', 'Resume processing is taking longer than expected. Please check back later.');
        }
        
      } catch (error) {
        console.error('Error checking processing status:', error);
        if (error.message && error.message.includes('Rate limit')) {
          setIsCheckingStatus(false);
          Alert.alert('Too Many Requests', 'You are checking too frequently. Please wait a minute and try again.');
          return; // Stop polling on rate limit error
        }
        pollCount++;
        if (pollCount < maxPolls) {
          pollingTimeoutRef.current = setTimeout(pollStatus, pollInterval);
        } else {
          setIsCheckingStatus(false);
          Alert.alert('Error', 'Failed to check processing status. Please try again.');
        }
      }
    };
    
    // Start polling
    pollStatus();
  };

  const fetchExtractionResults = async (resumeId) => {
    if (!resumeId) return;
    
    try {
      const results = await apiService.getResumeResults(resumeId);
      setExtractionResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error fetching extraction results:', error);
      Alert.alert('Error', 'Failed to fetch extraction results. Please try again.');
    }
  };

  const fetchResumeSummary = async (resumeId) => {
    if (!resumeId) return;
    try {
      const summary = await apiService.getResumeSummary(resumeId);
      setResumeSummary(summary);
    } catch (error) {
      // console.error('Error fetching resume summary:', error);
      // Alert.alert('Summary Error', `Failed to fetch resume summary: ${error.message}`);
    }
  };

  const fetchResumeQuality = async (resumeId) => {
    if (!resumeId) return;
    try {
      const quality = await apiService.getResumeQuality(resumeId);
      setResumeQuality(quality);
    } catch (error) {
      // console.error('Error fetching resume quality:', error);
      // Alert.alert('Quality Error', `Failed to fetch resume quality: ${error.message}`);
    }
  };

  const fetchResumeKeywords = async (resumeId) => {
    if (!resumeId) return;
    try {
      const keywords = await apiService.getResumeKeywords(resumeId);
      setResumeKeywords(keywords);
    } catch (error) {
      // console.error('Error fetching resume keywords:', error);
      // Alert.alert('Keywords Error', `Failed to fetch resume keywords: ${error.message}`);
    }
  };

  const fetchResumeAnalysis = async (resumeId) => {
    if (!resumeId) return;
    try {
      const analysis = await apiService.getResumeAnalysis(resumeId);
      setResumeAnalysis(analysis);
    } catch (error) {
      // console.error('Error fetching resume analysis:', error);
      // Alert.alert('Analysis Error', `Failed to fetch resume analysis: ${error.message}`);
    }
  };

  const fetchAllResumeData = async (resumeId) => {
    if (!resumeId) return;
    
    try {
      console.log('Fetching all resume data for ID:', resumeId);
      // Fetch all resume data in parallel
      await Promise.all([
        fetchResumeSummary(resumeId),
        fetchResumeQuality(resumeId),
        fetchResumeKeywords(resumeId),
        fetchResumeAnalysis(resumeId)
      ]);
      
      console.log('All resume data fetched successfully');
      setShowSummary(true);
    } catch (error) {
      console.error('Error fetching resume data:', error);
      Alert.alert('Data Error', `Failed to fetch resume data: ${error.message}`);
    }
  };

  const handleShowSummary = async () => {
    if (resumeId) {
      console.log('Manually triggering summary display for resume ID:', resumeId);
      await fetchAllResumeData(resumeId);
    } else {
      Alert.alert('No Resume', 'Please upload a resume first.');
    }
  };

  const verifyResumeStorage = async (resumeId) => {
    if (!resumeId) return;
    
    setIsVerifyingStorage(true);
    try {
      // Get resume details from backend
      const resumeDetails = await apiService.getResumeStatus(resumeId);
      
      if (resumeDetails && resumeDetails.status) {
        // Check if resume exists in database
        const verification = {
          resumeId: resumeId,
          existsInDatabase: true,
          status: resumeDetails.status,
          filename: resumeDetails.filename || 'Unknown',
          createdAt: resumeDetails.created_at || 'Unknown',
          filePath: resumeDetails.file_path || 'Unknown',
          fileSize: resumeDetails.file_size || 0,
          processingStatus: resumeDetails.processing_status || 'unknown'
        };
        
        // Try to get user resumes to verify it's listed
        try {
          const userResumes = await apiService.getUserResumes();
          const resumeExists = userResumes.resumes?.some(resume => resume.id === resumeId);
          verification.listedInUserResumes = resumeExists || false;
          verification.totalUserResumes = userResumes.resumes?.length || 0;
        } catch (error) {
          // Handle Firebase index error gracefully
          if (error.message && error.message.includes('index')) {
            verification.listedInUserResumes = 'Database index issue - resume likely listed';
            verification.totalUserResumes = 'Unknown (index error)';
          } else {
            verification.listedInUserResumes = 'Error checking';
            verification.totalUserResumes = 'Unknown';
          }
          console.error('Error checking user resumes:', error);
        }
        
        setStorageVerification(verification);
        
        // Create user-friendly status messages
        const userListStatus = typeof verification.listedInUserResumes === 'boolean' 
          ? (verification.listedInUserResumes ? 'Listed' : 'Not Listed')
          : verification.listedInUserResumes;
        
        const totalResumes = typeof verification.totalUserResumes === 'number'
          ? verification.totalUserResumes.toString()
          : verification.totalUserResumes;
        
        Alert.alert(
          'Storage Verification Complete',
          `Resume ID: ${resumeId}\n` +
          `Status: ${verification.status}\n` +
          `Filename: ${verification.filename}\n` +
          `Database: ${verification.existsInDatabase ? 'Stored' : 'Not Found'}\n` +
          `User List: ${userListStatus}\n` +
          `Total User Resumes: ${totalResumes}\n` +
          `File Size: ${(verification.fileSize / 1024 / 1024).toFixed(2)} MB`,
          [{ text: 'OK' }]
        );
      } else {
        setStorageVerification({
          resumeId: resumeId,
          existsInDatabase: false,
          error: 'Resume not found in database'
        });
        
        Alert.alert(
          'Storage Verification Failed',
          'Resume not found in backend database.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error verifying resume storage:', error);
      setStorageVerification({
        resumeId: resumeId,
        existsInDatabase: false,
        error: error.message
      });
      
      Alert.alert(
        'Verification Error',
        `Failed to verify resume storage: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsVerifyingStorage(false);
    }
  };

  const handleLinkedInAnalyze = async () => {
    if (!linkedinUrl) return Alert.alert('Enter LinkedIn URL');
    setLinkedinLoading(true);
    setLinkedinResult(null);
    try {
      const res = await apiService.analyzeLinkedInProfile(linkedinUrl);
      setLinkedinResult(res);
    } catch (e) {
      Alert.alert('LinkedIn Analysis Failed', e.message);
    } finally {
      setLinkedinLoading(false);
    }
  };

  const handleGitHubAnalyze = async () => {
    if (!githubUsername) return Alert.alert('Enter GitHub username');
    setGithubLoading(true);
    setGithubResult(null);
    try {
      const res = await apiService.analyzeGitHubProfile(githubUsername);
      setGithubResult(res);
    } catch (e) {
      Alert.alert('GitHub Analysis Failed', e.message);
    } finally {
      setGithubLoading(false);
    }
  };

  const UploadArea = () => (
    <View style={styles.uploadAreaContainer}>
      <TouchableOpacity
        style={[
          styles.uploadArea,
          dragActive && styles.uploadAreaActive,
          selectedFile && styles.uploadAreaFilled,
          uploadSuccess && styles.uploadAreaSuccess
        ]}
        onPress={!uploadSuccess ? pickDocument : null}
        activeOpacity={0.8}
      >
        {!selectedFile ? (
          <View style={styles.uploadContent}>
            <View style={styles.uploadIconContainer}>
              <Ionicons name="cloud-upload-outline" size={48} color="#6B7280" />
            </View>
            <Text style={styles.uploadTitle}>Upload Your Resume</Text>
            <Text style={styles.uploadSubtitle}>
              Drag and drop your resume here or click to browse
            </Text>
            <Text style={styles.uploadFormats}>
              Supported formats: PDF only
            </Text>
            <TouchableOpacity style={styles.browseButton} onPress={pickDocument}>
              <Text style={styles.browseButtonText}>Browse Files</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.filePreview}>
            <View style={styles.fileIconContainer}>
              <Ionicons 
                name={uploadSuccess ? "checkmark-circle" : "document-text"} 
                size={64} 
                color={uploadSuccess ? COLORS.primary : COLORS.primary} 
              />
            </View>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: COLORS.light }] } numberOfLines={1}>
                {selectedFile?.name || 'Resume.pdf'}
              </Text>
              <Text style={[styles.fileSize, { color: COLORS.light }] }>
                {getFileSize(selectedFile?.size || 0)}
              </Text>
            </View>
            {!uploadSuccess && (
              <TouchableOpacity style={styles.removeButton} onPress={removeFile}>
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
      
      {/* Upload Button - only show when file is selected and not uploaded */}
      {selectedFile && !uploadSuccess && (
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleUpload}
          disabled={isUploading}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Upload Resume'}
          </Text>
        </TouchableOpacity>
      )}
      {/* Show success message below the border */}
      {uploadSuccess && (
        <View style={styles.successMessageContainer}>
          <Text style={styles.successMessageText}>
            Uploaded Successfully
          </Text>
        </View>
      )}
      
    </View>
  );



  const ExtractionResults = () => {
    if (!showResults || !extractionResults) return null;

    // Use dynamic analysis fields from backend
    const analysis = extractionResults.analysis || {};
    const { match_label, match_score, summary, strengths, gaps } = analysis;

    return (
      <View style={styles.extractionResults}>
        <Text style={styles.resultsTitle}>Resume Analysis Summary</Text>
        {match_label && (
          <Text style={styles.matchLabel}>Match: {match_label}{typeof match_score === 'number' ? ` (${match_score}%)` : ''}</Text>
        )}
        {summary && (
          <Text style={styles.summaryText}>{summary}</Text>
        )}
        {strengths && strengths.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            {strengths.map((s, i) => (
              <Text key={i} style={styles.strengthText}>• {s}</Text>
            ))}
          </View>
        )}
        {gaps && gaps.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Areas for Improvement</Text>
            {gaps.map((g, i) => (
              <Text key={i} style={styles.gapText}>• {g}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (resumeId) {
      setShowSummary(false); // Hide summary while refreshing
      setShowResults(false); // Hide extraction results while refreshing
      await checkProcessingStatus(resumeId);
    } else {
      Alert.alert('No Resume', 'Please upload a resume first.');
    }
  };

    return (
    <AnimatedBackground intensity="medium">
      {showConfetti ? (
        <ConfettiAnimation 
          successText="Resume Uploaded Successfully!"
          subText="Your resume is being processed for personalized interview questions"
        />
      ) : (
        <PageLayout message={'Upload your resume\nClick on View Summary\nAfter processing is done\nTo see the analysis'} higher={true}>
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <UploadArea />
              </View>



        {/* Resume Summary */}
        {/* <ResumeSummary /> */}

        {/* After upload success, show a View Summary button */}
        {uploadSuccess && resumeId && (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#00ff00', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 }}
              onPress={() => navigation.navigate('AnalysisScreen', { resumeId })}
            >
              <Text style={{ color: '#181c20', fontWeight: '700', fontSize: 16 }}>
                {processingStatus?.status === 'completed' ? 'View Summary' : 'View Summary (Processing...)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Only show ExtractionResults if showResults is true and not after upload */}
        {!uploadSuccess && <ExtractionResults />}

        {storageVerification && (
          <View style={styles.storageVerification}>
            <Text style={styles.verificationTitle}>Storage Verification</Text>
            <View style={styles.verificationCard}>
              <Text style={styles.verificationText}>
                Resume ID: {storageVerification.resumeId}
              </Text>
              <Text style={styles.verificationText}>
                Database: {storageVerification.existsInDatabase ? 'Stored' : 'Not Found'}
              </Text>
              {storageVerification.listedInUserResumes !== undefined && (
                <Text style={styles.verificationText}>
                  User List: {typeof storageVerification.listedInUserResumes === 'boolean' 
                    ? (storageVerification.listedInUserResumes ? 'Listed' : 'Not Listed')
                    : storageVerification.listedInUserResumes}
                </Text>
              )}
              {storageVerification.totalUserResumes && (
                <Text style={styles.verificationText}>
                  Total User Resumes: {storageVerification.totalUserResumes}
                </Text>
              )}
              {storageVerification.fileSize > 0 && (
                <Text style={styles.verificationText}>
                  File Size: {(storageVerification.fileSize / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
              {storageVerification.error && (
                <Text style={styles.verificationError}>
                  Error: {storageVerification.error}
                </Text>
              )}
            </View>
          </View>
        )}

        {!isLoggedIn && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              Please login to upload your resume and get personalized interview questions
            </Text>
          </View>
        )}

            </View>
          </View>
        </PageLayout>
      )}
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
    padding: 20,
    paddingTop: 30, // Match Step1Name padding
  },
  centerSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingTop: 120, // Match Step1Name centerSection padding
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: COLORS.gray,
    lineHeight: 24,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: COLORS.darkGray,
    borderStyle: 'solid',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: 24,
    minHeight: 200,
  },
  uploadAreaActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  uploadAreaFilled: {
    borderStyle: 'solid',
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.light,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadFormats: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '500',
  },
  filePreview: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center', // ensure vertical centering
    flexWrap: 'wrap',     // allow wrapping
    borderWidth: 2,
    borderColor: COLORS.darkGray,
    borderStyle: 'solid',
    borderRadius: 12,
    padding: 32,
    backgroundColor: COLORS.surface,
    marginBottom: 24,
    minHeight: 200,
  },
  fileIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.light,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 16,
    color: COLORS.gray,
  },
  removeButton: {
    padding: 4,
  },
  successMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  successMessageText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  uploadButtonContainer: {
    marginBottom: 32,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.gray,
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  skipSection: {
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
  },
  loginPrompt: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 24,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 14,
    color: COLORS.light,
    textAlign: 'center',
    lineHeight: 20,
  },

  viewResultsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewResultsButtonText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  extractionResults: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  resultSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: COLORS.darkGray,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.light,
    marginBottom: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: '500',
  },
  moreSkillsText: {
    fontSize: 12,
    color: COLORS.gray,
    alignSelf: 'center',
    marginTop: 4,
  },
  jobCard: {
    backgroundColor: COLORS.darkGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 13,
    color: COLORS.light,
    marginBottom: 2,
  },
  jobDuration: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  jobDescription: {
    fontSize: 12,
    color: COLORS.lightGray,
    lineHeight: 16,
  },
  educationCard: {
    backgroundColor: COLORS.darkGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  educationDegree: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  educationSchool: {
    fontSize: 13,
    color: COLORS.light,
    marginBottom: 2,
  },
  educationYear: {
    fontSize: 12,
    color: COLORS.gray,
  },
  analysisCard: {
    backgroundColor: COLORS.darkGray,
    padding: 12,
    borderRadius: 8,
  },
  matchScore: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  matchLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00ff00',
    marginBottom: 8,
    textAlign: 'center',
  },
  strengthsContainer: {
    marginTop: 8,
  },
  strengthsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light,
    marginBottom: 4,
  },
  strengthText: {
    color: '#00ff00',
    fontSize: 14,
    marginBottom: 2,
  },
  questionsCount: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  viewQuestionsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewQuestionsButtonText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  closeResultsButton: {
    backgroundColor: COLORS.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeResultsButtonText: {
    color: COLORS.light,
    fontSize: 14,
    fontWeight: '600',
  },
  completedActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  verifyStorageButton: {
    backgroundColor: COLORS.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  verifyStorageButtonText: {
    color: COLORS.light,
    fontSize: 14,
    fontWeight: '600',
  },
  viewSummaryButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  viewSummaryButtonText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  resumeSummary: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: COLORS.darkGray,
    padding: 12,
    borderRadius: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  topSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 2,
    justifyContent: 'flex-end',
  },
  topSkillTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topSkillText: {
    fontSize: 10,
    color: COLORS.dark,
    fontWeight: '500',
  },
  recentCompaniesContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  recentCompanyText: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'right',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  qualityCard: {
    backgroundColor: COLORS.darkGray,
    padding: 12,
    borderRadius: 8,
  },
  qualityScore: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  qualityLabel: {
    fontSize: 14,
    color: COLORS.light,
    marginBottom: 8,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginBottom: 2,
  },
  keywordsCard: {
    backgroundColor: COLORS.darkGray,
    padding: 12,
    borderRadius: 8,
  },
  keywordsCount: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  keywordTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: '500',
  },
  missingKeywordsContainer: {
    marginTop: 8,
  },
  missingKeywordsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light,
    marginBottom: 4,
  },
  missingKeywordTag: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  missingKeywordText: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: '500',
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light,
  },
  analysisValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  recommendationsContainer: {
    marginTop: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginBottom: 2,
  },
  uploadAreaContainer: {
    marginBottom: 20,
    marginTop: '10%',
  },
  uploadAreaSuccess: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  uploadSuccessText: {
    fontSize: 16, // make it even larger
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 8, // more space above
    textAlign: 'center', // center the text
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  uploadButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  replaceButton: {
    backgroundColor: COLORS.darkGray,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  replaceButtonText: {
    color: COLORS.light,
    fontSize: 14,
    fontWeight: '600',
  },
  summarySection: {
    marginBottom: 24,
  },
  summarySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  storageVerification: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationCard: {
    backgroundColor: COLORS.darkGray,
    padding: 12,
    borderRadius: 8,
  },
  verificationText: {
    fontSize: 14,
    color: COLORS.light,
    marginBottom: 4,
  },
  verificationError: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 8,
    fontWeight: '500',
  },
  showSummaryButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  showSummaryButtonText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  improvementCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  improvementText: {
    color: '#00ff00',
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '500',
  },
  improvementCardEnhanced: {
    backgroundColor: '#222a22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcc00',
  },
  improvementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffcc00',
    marginLeft: 8,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  improvementTextEnhanced: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  profileAnalysisCard: {
    backgroundColor: '#181c20',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00cc00',
  },
  profileAnalysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00ff00',
    marginBottom: 12,
  },
  profileInput: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  profileButton: {
    backgroundColor: '#00ff00',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  profileButtonText: {
    color: '#181c20',
    fontWeight: '700',
    fontSize: 15,
  },
  profileResultCard: {
    backgroundColor: '#222a22',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffcc00',
  },
  profileResultTitle: {
    color: '#ffcc00',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  profileResultText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  gapText: {
    color: '#ffcc00',
    fontSize: 14,
    marginBottom: 2,
  },

  analysisTableContainer: {
    marginTop: 24,
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#00cc00',
  },
  analysisTableTitle: {
    color: '#00ff00',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  analysisTableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 4,
    marginBottom: 4,
  },
  analysisTableHeader: {
    flex: 1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  analysisTableRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  analysisTableCell: {
    flex: 1,
    color: '#00ff00',
    fontSize: 13,
    fontWeight: '600',
  },
  analysisTableCellDesc: {
    flex: 2,
    color: '#fff',
    fontSize: 13,
    marginLeft: 8,
  },
});

export default ResumeUploadScreen;
