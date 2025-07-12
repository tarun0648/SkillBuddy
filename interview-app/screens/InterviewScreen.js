// screens/InterviewScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AnimatedBackground from '../components/AnimatedBackground';

// Mock interview questions for different career paths
const MOCK_QUESTIONS = {
  SoftwareDev: [
    {
      id: 1,
      category: 'Technical',
      difficulty: 'Medium',
      question: 'Can you explain the difference between REST and GraphQL APIs?'
    },
    {
      id: 2,
      category: 'Problem Solving',
      difficulty: 'Hard',
      question: 'How would you optimize a slow-running database query?'
    },
    {
      id: 3,
      category: 'System Design',
      difficulty: 'Hard',
      question: 'Design a scalable chat application architecture.'
    }
  ],
  DataAnalyst: [
    {
      id: 1,
      category: 'Tools',
      difficulty: 'Easy',
      question: 'What tools do you use for data visualization and why?'
    },
    {
      id: 2,
      category: 'Statistics',
      difficulty: 'Medium',
      question: 'Explain the difference between correlation and causation.'
    },
    {
      id: 3,
      category: 'Problem Solving',
      difficulty: 'Hard',
      question: 'How would you handle missing data in a large dataset?'
    }
  ],
  UIDesigner: [
    {
      id: 1,
      category: 'Research',
      difficulty: 'Medium',
      question: 'How do you approach user research for a new design project?'
    },
    {
      id: 2,
      category: 'Design Process',
      difficulty: 'Medium',
      question: 'Walk me through your design process from concept to final product.'
    },
    {
      id: 3,
      category: 'Accessibility',
      difficulty: 'Hard',
      question: 'How do you ensure your designs are accessible to users with disabilities?'
    }
  ],
  DigitalMarketer: [
    {
      id: 1,
      category: 'Strategy',
      difficulty: 'Medium',
      question: 'How would you run a successful paid advertising campaign?'
    },
    {
      id: 2,
      category: 'Analytics',
      difficulty: 'Medium',
      question: 'What metrics do you track to measure campaign success?'
    },
    {
      id: 3,
      category: 'Content',
      difficulty: 'Easy',
      question: 'How do you create engaging content for social media?'
    }
  ]
};

export default function InterviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { careerPath } = route.params || {};

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeInterview();
  }, []);

  const initializeInterview = () => {
    if (!careerPath) {
      Alert.alert('Error', 'No career path selected. Please go back and select one.');
      navigation.goBack();
      return;
    }

    // Load questions for the selected career path
    const careerQuestions = MOCK_QUESTIONS[careerPath] || MOCK_QUESTIONS.SoftwareDev;
    setQuestions(careerQuestions);
    setIsLoading(false);
  };

  const handleSubmitResponse = async () => {
    if (!currentResponse.trim()) {
      Alert.alert('Error', 'Please provide a response before continuing.');
      return;
    }

    setIsSubmitting(true);
    
    // Save the response
    const newResponse = {
      questionId: questions[currentQuestionIndex].id,
      question: questions[currentQuestionIndex].question,
      response: currentResponse,
      timestamp: new Date().toISOString()
    };
    
    setResponses(prev => [...prev, newResponse]);
    
    // Simulate network delay
    setTimeout(() => {
      // Check if this was the last question
      if (currentQuestionIndex + 1 >= questions.length) {
        // Interview completed
        Alert.alert(
          'Interview Complete!',
          'You have completed all questions. Thank you for your time!',
          [
            {
              text: 'View Results',
              onPress: () => navigation.navigate('InterviewResults', {
                careerPath,
                responses: [...responses, newResponse],
                questions
              }),
            },
          ]
        );
      } else {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentResponse('');
      }
      setIsSubmitting(false);
    }, 500);
  };

  const handleEndInterview = () => {
    Alert.alert(
      'End Interview',
      'Are you sure you want to end the interview? Your progress will be saved.',
      [
        {
          text: 'Continue',
          style: 'cancel',
        },
        {
          text: 'End Interview',
          onPress: () => {
            navigation.navigate('InterviewResults', {
              careerPath,
              responses,
              questions
            });
          },
        },
      ]
    );
  };

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex];
  };

  const getProgress = () => {
    return ((currentQuestionIndex / questions.length) * 100);
  };

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  if (isLoading || !currentQuestion) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <AnimatedBackground intensity="medium" />
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={styles.loadingText}>Loading interview...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mock Interview: {careerPath}</Text>
          <Text style={styles.progress}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionCategory}>{currentQuestion.category}</Text>
          <Text style={styles.questionDifficulty}>
            Difficulty: {currentQuestion.difficulty}
          </Text>
          <Text style={styles.question}>{currentQuestion.question}</Text>
        </View>

        {/* Response Input */}
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Your Response:</Text>
          <TextInput
            style={styles.responseInput}
            value={currentResponse}
            onChangeText={setCurrentResponse}
            multiline
            numberOfLines={6}
            placeholder="Type your answer here..."
            placeholderTextColor="#888888"
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmitResponse}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.buttonText}>
                {currentQuestionIndex + 1 === questions.length ? 'Finish' : 'Next Question'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={handleEndInterview}
          >
            <Text style={styles.outlineButtonText}>End Interview</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Helvetica',
    marginTop: 10,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica',
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  progress: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 2,
  },
  questionContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff00',
  },
  questionCategory: {
    fontSize: 14,
    fontFamily: 'Helvetica',
    color: '#00ff00',
    marginBottom: 5,
    fontWeight: '500',
  },
  questionDifficulty: {
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#fff',
    opacity: 0.8,
    marginBottom: 15,
  },
  question: {
    fontSize: 18,
    fontFamily: 'Helvetica',
    color: '#fff',
    lineHeight: 26,
  },
  responseContainer: {
    marginBottom: 30,
  },
  responseLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#fff',
    marginBottom: 10,
    fontWeight: '500',
  },
  responseInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#000',
    minHeight: 120,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  buttonContainer: {
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#00ff00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Helvetica',
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    color: '#00ff00',
    fontSize: 16,
    fontFamily: 'Helvetica',
    fontWeight: '600',
  },
});