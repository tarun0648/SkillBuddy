import React, { memo } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import PeppyImage from '../atoms/PeppyImage';
import ChatBubble from '../molecules/ChatBubble';

const PageLayout = memo(({ children, message = "Hey there!", higher = false }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <PeppyImage higher={higher} />
        <View style={[styles.chatContainer, higher && { top: 30 } || { top: 80 }] }>
          <ChatBubble message={message} />
        </View>
        {children}
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  chatContainer: {
    position: 'absolute',
    left: 100,
    zIndex: 100,
  },
});

export default PageLayout;
