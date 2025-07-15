import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ProgressBar from '../../components/atoms/ProgressBar';
import AnimatedBackground from '../../components/AnimatedBackground';
import PageLayout from '../../components/layouts/PageLayout';
import GreenButton from '../../components/atoms/GreenButton';
import { MaterialCommunityIcons, FontAwesome5, Ionicons, Entypo, FontAwesome } from '@expo/vector-icons';
import { useOnboardingStore } from '../../services/onboardingStore';
import { useAuthStore } from '../../services/Zuststand';
import { useProgress } from '../../hooks/useProgress';

const { width, height } = Dimensions.get('window');

const categoryIcons = {
  Tech: { icon: <MaterialCommunityIcons name="laptop" size={32} color="#00b894" />, color: '#eafaf1' },
  Marketing: { icon: <MaterialCommunityIcons name="bullhorn" size={32} color="#fdcb6e" />, color: '#fff9e3' },
  Finance: { icon: <FontAwesome5 name="chart-line" size={32} color="#0984e3" />, color: '#eaf0fb' },
  Healthcare: { icon: <MaterialCommunityIcons name="hospital" size={32} color="#e17055" />, color: '#fff0ed' },
  Education: { icon: <Ionicons name="school" size={32} color="#6c5ce7" />, color: '#f3f0ff' },
  Engineering: { icon: <MaterialCommunityIcons name="cog" size={32} color="#636e72" />, color: '#f2f2f2' },
  Law: { icon: <MaterialCommunityIcons name="scale-balance" size={32} color="#fdcb6e" />, color: '#fff9e3' },
  Arts: { icon: <MaterialCommunityIcons name="palette" size={32} color="#e17055" />, color: '#fff0ed' },
  Hospitality: { icon: <MaterialCommunityIcons name="silverware-fork-knife" size={32} color="#00b894" />, color: '#eafaf1' },
  Sales: { icon: <FontAwesome5 name="handshake" size={32} color="#00b894" />, color: '#eafaf1' },
  HumanResources: { icon: <FontAwesome5 name="users" size={32} color="#6c5ce7" />, color: '#f3f0ff' },
  Operations: { icon: <MaterialCommunityIcons name="truck" size={32} color="#636e72" />, color: '#f2f2f2' },
  Media: { icon: <Entypo name="news" size={32} color="#fdcb6e" />, color: '#fff9e3' },
  Science: { icon: <MaterialCommunityIcons name="atom" size={32} color="#0984e3" />, color: '#eaf0fb' },
  Sports: { icon: <MaterialCommunityIcons name="soccer" size={32} color="#00b894" />, color: '#eafaf1' },
  Government: { icon: <FontAwesome5 name="landmark" size={32} color="#636e72" />, color: '#f2f2f2' },
  Others: { icon: <FontAwesome name="star" size={32} color="#e17055" />, color: '#fff0ed' },
};

const categoriesData = {
  Tech: [
    'Software Developer', 'Data Analyst', 'UI/UX Designer', 'Data Scientist',
    'DevOps Engineer', 'Cybersecurity Specialist', 'Network Engineer', 'Cloud Architect',
    'Mobile App Developer', 'QA Engineer', 'AI Engineer', 'Blockchain Developer'
  ],
  Marketing: [
    'Digital Marketer', 'Product Manager', 'Content Strategist', 'SEO Specialist',
    'Brand Manager', 'Market Research Analyst', 'Social Media Manager', 'Copywriter',
    'PR Specialist', 'Event Coordinator'
  ],
  Finance: [
    'Financial Analyst', 'Investment Banker', 'Accountant', 'Auditor',
    'Financial Planner', 'Tax Consultant', 'Risk Manager', 'Actuary',
    'Treasury Analyst', 'Credit Analyst'
  ],
  Healthcare: [
    'Doctor', 'Nurse', 'Pharmacist', 'Medical Lab Technician',
    'Physiotherapist', 'Dentist', 'Radiologist', 'Surgeon',
    'Healthcare Administrator', 'Occupational Therapist'
  ],
  Education: [
    'Teacher', 'Professor', 'Academic Counselor', 'Librarian',
    'School Principal', 'Special Education Teacher', 'Instructional Designer', 'Education Coordinator'
  ],
  Engineering: [
    'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Chemical Engineer',
    'Aerospace Engineer', 'Environmental Engineer', 'Biomedical Engineer', 'Industrial Engineer'
  ],
  Law: [
    'Lawyer', 'Legal Advisor', 'Paralegal', 'Judge',
    'Corporate Counsel', 'Legal Researcher', 'Compliance Officer'
  ],
  Arts: [
    'Graphic Designer', 'Animator', 'Musician', 'Actor',
    'Photographer', 'Painter', 'Art Director', 'Fashion Designer',
    'Film Director', 'Writer'
  ],
  Hospitality: [
    'Hotel Manager', 'Chef', 'Event Planner', 'Travel Agent',
    'Restaurant Manager', 'Bartender', 'Concierge', 'Housekeeping Supervisor'
  ],
  Sales: [
    'Sales Executive', 'Account Manager', 'Business Development Manager', 'Retail Manager',
    'Sales Analyst', 'Customer Relationship Manager', 'Telemarketer'
  ],
  HumanResources: [
    'HR Manager', 'Recruiter', 'Talent Acquisition Specialist', 'Training & Development Manager',
    'Compensation & Benefits Analyst', 'HR Generalist'
  ],
  Operations: [
    'Operations Manager', 'Logistics Coordinator', 'Supply Chain Analyst', 'Procurement Manager',
    'Warehouse Manager', 'Inventory Controller'
  ],
  Media: [
    'Journalist', 'News Anchor', 'Video Editor', 'Radio Jockey',
    'TV Producer', 'Content Creator', 'Photojournalist'
  ],
  Science: [
    'Research Scientist', 'Lab Technician', 'Biologist', 'Chemist',
    'Physicist', 'Environmental Scientist', 'Geologist'
  ],
  Sports: [
    'Athlete', 'Coach', 'Sports Manager', 'Fitness Trainer',
    'Sports Analyst', 'Physical Therapist', 'Referee'
  ],
  Government: [
    'Civil Servant', 'Policy Analyst', 'Diplomat', 'Urban Planner',
    'Customs Officer', 'Public Relations Officer'
  ],
  Others: [
    'Entrepreneur', 'Freelancer', 'Consultant', 'NGO Worker',
    'Real Estate Agent', 'Pilot', 'Flight Attendant', 'Merchant Navy Officer'
  ]
};

// Helper to flatten all job roles with their category for search
const allJobRoles = Object.entries(categoriesData).flatMap(([category, roles]) =>
  roles.map(role => ({ role, category }))
);

export default function CareerChoicesScreen({ navigation }) {
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(categoriesData)[0]);
  const [searchText, setSearchText] = useState('');
  
  const { user } = useAuthStore();
  const { 
    onboardingData, 
    isLoading, 
    error, 
    saveStep3Data, 
    loadOnboardingData,
    setUserId,
    clearError 
  } = useOnboardingStore();
  
  const { getOnboardingProgress } = useProgress();

  useEffect(() => {
    // Set user ID in onboarding store when user is available
    if (user?.id) {
      setUserId(user.id);
    }
    
    // Load saved onboarding data (but don't pre-fill)
    loadOnboardingData();
    
    // Don't pre-select career choices - start with no selections
    setSelectedChoices([]);
  }, [user?.id]);

  useEffect(() => {
    // Clear error when component mounts
    clearError();
  }, []);

  const categoryKeys = Object.keys(categoriesData);

  const toggleSelection = (choice) => {
    if (selectedChoices.includes(choice)) {
      setSelectedChoices(selectedChoices.filter((c) => c !== choice));
    } else {
      if (selectedChoices.length < 3) {
        setSelectedChoices([...selectedChoices, choice]);
      } else {
        alert('You can select up to 3 options only.');
      }
    }
  };

  const handleNext = async () => {
    if (selectedChoices.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one career option to continue.');
      return;
    }

    try {
      await saveStep3Data(selectedChoices);
      navigation.navigate('Step4');
    } catch (error) {
      Alert.alert(
        'Error', 
        'Failed to save your career choices. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Render category carousel item (unchanged)
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.carouselCategoryItem,
        selectedCategory === item && styles.carouselCategoryItemSelected,
      ]}
      onPress={() => {
        setSelectedCategory(item);
        setSearchText('');
      }}
      accessible={true}
      accessibilityLabel={`Select ${item} category`}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.carouselCategoryText,
          selectedCategory === item && styles.carouselCategoryTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  // Modern, aesthetic job role card
  const renderJobRoleCard = (option, category) => (
    <TouchableOpacity
      key={option}
      style={[
        styles.jobCardModern,
        selectedChoices.includes(option) && styles.jobCardModernSelected,
      ]}
      onPress={() => toggleSelection(option)}
      accessible={true}
      accessibilityLabel={`Select ${option}`}
      accessibilityRole="button"
      activeOpacity={0.85}
    >
      <View style={[
        styles.jobCardModernIconWrapper,
        selectedChoices.includes(option) && styles.jobCardModernIconWrapperSelected,
      ]}>
        <MaterialCommunityIcons
          name="briefcase-outline"
          size={28}
          color={selectedChoices.includes(option) ? "#fff" : "#00b894"}
        />
      </View>
      <Text
        style={[
          styles.jobCardModernText,
          selectedChoices.includes(option) && styles.jobCardModernTextSelected,
        ]}
        numberOfLines={2}
      >
        {option}
      </Text>
      {searchText.length > 0 && (
        <View style={styles.jobCardModernTagWrapper}>
          <Text style={styles.jobCardModernTagText}>{category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Filtered job roles based on search
  let filteredJobRoles;
  if (searchText.trim().length > 0) {
    const lower = searchText.trim().toLowerCase();
    filteredJobRoles = allJobRoles.filter(({ role }) =>
      role.toLowerCase().includes(lower)
    );
  } else {
    filteredJobRoles = categoriesData[selectedCategory].map(role => ({
      role,
      category: selectedCategory
    }));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AnimatedBackground intensity="medium">
        <PageLayout message="What are your career choices?">
          <View style={styles.innerContainer}>
            
            
                            <View style={styles.progressContainer}>
                  <ProgressBar percent={getOnboardingProgress(3)} />
                </View>

            {/* Category Carousel */}
            <View style={styles.carouselContainer}>
              <FlatList
                data={categoryKeys}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselList}
              />
            </View>

            {/* Modern header: selection count and search bar */}
            <View style={styles.categoryDetailsContainer}>
              <View style={styles.selectionCountBar}>
                <Text style={styles.selectionCountText}>
                  {selectedChoices.length}/3 career options selected
                </Text>
                <Text style={styles.selectionCountSubText}>
                  {selectedChoices.length === 0
                    ? "Select at least 1 to continue"
                    : selectedChoices.length === 3
                    ? "Maximum 3 options"
                    : ""}
                </Text>
              </View>
              <View style={styles.searchBarWrapper}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={22}
                  color="#00b894"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchBarModern}
                  placeholder="Search career options..."
                  placeholderTextColor="#b2bec3"
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                  accessibilityLabel="Search career options"
                  underlineColorAndroid="transparent"
                />
              </View>
              <View style={styles.jobCardsScrollViewWrapper}>
                <ScrollView
                  style={styles.jobCardsScrollView}
                  contentContainerStyle={styles.jobCardsGrid}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {filteredJobRoles.length === 0 ? (
                    <Text style={styles.noResultsText}>No career options found.</Text>
                  ) : (
                    filteredJobRoles.map(({ role, category }) => (
                      // React.cloneElement(renderJobRoleCard(role, category), { key: `${role}-${category}` })
                      renderJobRoleCard(role, category)
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
          {/* Next button fixed at the bottom with some bottom distance */}
          <View style={styles.fixedButtonContainer}>
            <GreenButton
              title={isLoading ? "Saving..." : "Next"}
              onPress={handleNext}
              disabled={selectedChoices.length === 0 || isLoading}
            />
            {isLoading && (
              <ActivityIndicator 
                size="small" 
                color="#00ff00" 
                style={styles.loadingIndicator}
              />
            )}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        </PageLayout>
      </AnimatedBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'flex-start',
    width: '100%',
  },

  progressContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 10,
    width: '100%',
  },
  carouselContainer: {
    width: '100%',
    marginBottom: 10,
    marginTop: 120,
    minHeight: 50,
  },
  carouselList: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  carouselCategoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#222',
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  carouselCategoryItemSelected: {
    backgroundColor: '#00ff00',
    borderColor: '#00ff00',
  },
  carouselCategoryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  carouselCategoryTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },

  // --- Modern/Updated styles for selection count, search bar, and job cards ---
  categoryDetailsContainer: {
    flex: 1,
    width: '100%',
    marginBottom: 0,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  selectionCountBar: {
    width: width * 0.92,
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 0,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#181f1b',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  selectionCountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  selectionCountSubText: {
    color: '#00b894',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  searchBarWrapper: {
    width: width * 0.92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232a25',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#232a25',
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBarModern: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  jobCardsScrollViewWrapper: {
    flex: 1,
    width: '100%',
    maxHeight: height * 0.38,
    minHeight: 120,
  },
  jobCardsScrollView: {
    flex: 1,
    width: '100%',
  },
  jobCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: 20,
    paddingHorizontal: 2,
  },
  jobCardModern: {
    backgroundColor: '#181f1b',
    borderColor: '#232a25',
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    margin: 8,
    width: width * 0.42,
    minHeight: 110,
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    transition: 'all 0.2s',
  },
  jobCardModernSelected: {
    backgroundColor: '#00b894',
    borderColor: '#00b894',
    shadowOpacity: 0.18,
    elevation: 4,
  },
  jobCardModernIconWrapper: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#232a25',
    borderRadius: 100,
    width: 44,
    height: 44,
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 12,
    shadowColor: '#00b894',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  jobCardModernIconWrapperSelected: {
    backgroundColor: '#009e74',
  },
  jobCardModernText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 0,
    letterSpacing: 0.1,
  },
  jobCardModernTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  jobCardModernTagWrapper: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  jobCardModernTagText: {
    fontSize: 12,
    color: '#00b894',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  noResultsText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
    width: '100%',
  },
  fixedButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 10,
  },
});
