// components/ResumeUpload.js (Fixed for Backend Integration)
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import apiService from '../services/apiService';
import { useAuthStore } from '../services/Zuststand';

export default function ResumeUpload({ onUploadSuccess, onUploadError }) {
  const { user, isAuthenticated } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickDocument = async () => {
    try {
      console.log('Opening document picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        console.log('Selected file details:', {
          name: file.name,
          size: file.size,
          uri: file.uri,
          mimeType: file.mimeType
        });
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert(
            'File Too Large', 
            'Please select a file smaller than 10MB. Your file is ' + 
            Math.round(file.size / (1024 * 1024) * 100) / 100 + 'MB.'
          );
          return;
        }

        // Validate file type (only PDF as per backend)
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          Alert.alert(
            'Invalid File Type', 
            'Please select a PDF document only. Selected file: ' + file.name
          );
          return;
        }

        setSelectedFile(file);
        console.log('File selected successfully:', file.name);
        
        // Show success feedback
        Alert.alert(
          'File Selected Successfully! 📄',
          `File: ${file.name}\nSize: ${formatFileSize(file.size)}\n\nReady to upload!`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('Document picker was canceled or no file selected');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(
        'File Access Error', 
        'Failed to access files. Please check your device permissions and try again.\n\nError: ' + error.message
      );
    }
  };

  const uploadResume = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a resume file first.');
      return;
    }

    if (!isAuthenticated()) {
      Alert.alert('Authentication Required', 'Please login to upload your resume.');
      return;
    }

    // Additional validation
    if (!selectedFile.uri) {
      Alert.alert('File Error', 'Selected file is invalid. Please choose a different file.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

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

      // Success
      setTimeout(() => {
        setIsUploading(false);
        setSelectedFile(null);
        setUploadProgress(0);
        
        if (onUploadSuccess) {
          onUploadSuccess(response);
        }
        
        Alert.alert(
          'Upload Successful',
          `Your resume has been uploaded successfully! Resume ID: ${response.resume_id}`,
          [{ text: 'OK', style: 'default' }]
        );
      }, 500);

    } catch (error) {
      console.error('Resume upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      
      if (onUploadError) {
        onUploadError(error);
      }
      
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload resume. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isAuthenticated()) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#ff0000" />
          <Text style={styles.errorText}>Please login to upload your resume.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Upload Resume</Text>
        <Text style={styles.sectionDescription}>
          Upload your resume in PDF format (max 10MB)
        </Text>

        {/* User Info */}
        {user && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.userInfoText}>
              Uploading for: {user.email}
            </Text>
          </View>
        )}

        {/* File Selection */}
        {!selectedFile ? (
          <TouchableOpacity
            style={styles.filePickerButton}
            onPress={pickDocument}
            disabled={isUploading}
          >
            <Ionicons name="cloud-upload-outline" size={48} color="#00ff00" />
            <Text style={styles.filePickerText}>Choose PDF File</Text>
            <Text style={styles.filePickerSubtext}>Tap to access your device files</Text>
            <Text style={styles.filePickerSubtext}>PDF only • Max 10MB</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.selectedFileContainer}>
            <View style={styles.fileInfo}>
              <Ionicons name="document-text-outline" size={24} color="#00ff00" />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={removeSelectedFile}
                disabled={isUploading}
              >
                <Ionicons name="close-circle-outline" size={24} color="#ff0000" />
              </TouchableOpacity>
            </View>

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
            )}
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedFile || isUploading) && styles.uploadButtonDisabled
          ]}
          onPress={uploadResume}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={styles.uploadButtonText}>Uploading...</Text>
            </View>
          ) : (
            <Text style={styles.uploadButtonText}>Upload Resume</Text>
          )}
        </TouchableOpacity>

        {/* Guidelines */}
        <View style={styles.guidelinesContainer}>
          <Text style={styles.guidelinesTitle}>📋 Upload Guidelines:</Text>
          <Text style={styles.guidelineItem}>• File format: PDF only</Text>
          <Text style={styles.guidelineItem}>• Maximum file size: 10MB</Text>
          <Text style={styles.guidelineItem}>• Ensure your resume is up-to-date</Text>
          <Text style={styles.guidelineItem}>• Include contact information</Text>
          <Text style={styles.guidelineItem}>• Use clear, readable fonts</Text>
          <Text style={styles.guidelineItem}>• Include relevant work experience</Text>
        </View>

        {/* File Access Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 File Access Tips:</Text>
          <Text style={styles.tipItem}>• Tap "Choose PDF File" to access your device</Text>
          <Text style={styles.tipItem}>• You can select from Downloads, Documents, or other folders</Text>
          <Text style={styles.tipItem}>• If you don't see your file, check if it's in a different location</Text>
          <Text style={styles.tipItem}>• Make sure your resume is saved as a PDF file</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  uploadSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
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
  filePickerButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#00ff00',
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  filePickerText: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  filePickerSubtext: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  selectedFileContainer: {
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 15,
  },
  fileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileSize: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 3,
  },
  progressText: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
  },
  uploadButton: {
    backgroundColor: '#00ff00',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#666',
  },
  uploadButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guidelinesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
  },
  guidelinesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  guidelineItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  tipsContainer: {
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.2)',
  },
  tipsTitle: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  tipItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
});