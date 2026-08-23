import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomSplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Icon Card Container */}
      <View style={styles.cardContainer}>
        <Image
          source={require('../assets/AQUAFLOW LOGO.jpg')} // Ensure path matches your assets directory
          style={styles.logoImage}
          resizeMode="cover"
        />
      </View>

      {/* App Title */}
      <Text style={styles.appTitle}>AquaFlow</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // Sky blue theme background
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: 200,
    height: 200,
    borderRadius: 36, // Rounded squircle edges
    overflow: 'hidden',
    
    // Shadow settings for iOS & Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF', // Text color for the app title
    textAlign: 'center',
  },
});