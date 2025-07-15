// context/InterviewContext.js
import React, { createContext, useContext, useState } from 'react';
import apiService from '../services/apiService';

const InterviewContext = createContext({});

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

export const InterviewProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const startInterview = async (userId, careerPath) => {
    try {
      setIsLoading(true);
      
      // Get questions for the career path
      const questionsResponse = await apiService.getQuestions(careerPath);
      setQuestions(questionsResponse.questions);
      
      // Start interview session
      const sessionResponse = await apiService.startInterview(userId, careerPath);
      setCurrentSession(sessionResponse);
      
      setCurrentQuestionIndex(0);
      setResponses([]);
      
      return sessionResponse;
    } catch (error) {
      console.error('Error starting interview:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async (response) => {
    try {
      if (!currentSession || !questions[currentQuestionIndex]) {
        throw new Error('No active session or question');
      }

      const questionId = questions[currentQuestionIndex].id;
      
      await apiService.submitResponse(
        currentSession.session_id,
        questionId,
        response
      );

      // Update local state
      const newResponse = {
        question_id: questionId,
        response: response,
        timestamp: new Date().toISOString(),
      };
      
      setResponses(prev => [...prev, newResponse]);
      
      return newResponse;
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return true;
    }
    return false; // No more questions
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      return true;
    }
    return false; // Already at first question
  };

  const endInterview = async () => {
    try {
      if (!currentSession) {
        throw new Error('No active session');
      }

      await apiService.endInterview(currentSession.session_id);
      
      // Reset state
      setCurrentSession(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setResponses([]);
      
    } catch (error) {
      console.error('Error ending interview:', error);
      throw error;
    }
  };

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex] || null;
  };

  const getProgress = () => {
    if (questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const value = {
    currentSession,
    questions,
    currentQuestionIndex,
    responses,
    isLoading,
    startInterview,
    submitResponse,
    nextQuestion,
    previousQuestion,
    endInterview,
    getCurrentQuestion,
    getProgress,
    isInterviewActive: !!currentSession,
    totalQuestions: questions.length,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};