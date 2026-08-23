import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../types/report';

interface Props {
  onSelectRole: (role: UserRole) => void;
}

export default function RoleSelectScreen({ onSelectRole }: Props) {
  return (
    <LinearGradient
      colors={['#053a5f', '#0369a1', '#0ea5e9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientRoot}
    >
      {/* Decorative water ripples — purely visual, no logic */}
      <View style={styles.rippleLarge} pointerEvents="none" />
      <View style={styles.rippleMedium} pointerEvents="none" />
      <View style={styles.rippleSmall} pointerEvents="none" />
      <View style={styles.rippleBottom} pointerEvents="none" />

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.content}>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="water" size={48} color="#0284c7" />
            </View>
            <Text style={styles.mainTitle}>Banban AquaFlow</Text>
            <Text style={styles.subtitle}>Barangay Banban Water Management</Text>
            <Text style={styles.sdgTag}>SDG 6: Clean Water and Sanitation</Text>
          </View>

          {/* Role Cards Container */}
          <View style={styles.cardsContainer}>

            {/* Resident Card */}
            <TouchableOpacity
              style={[styles.card, { backgroundColor: '#3b82f6' }]}
              activeOpacity={0.85}
              onPress={() => onSelectRole('Resident')}
            >
              <Ionicons name="people" size={40} color="#fff" style={styles.cardIcon} />
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>RESIDENT</Text>
                <Text style={styles.cardSubtitle}>
                  Check water schedule, report leaks, view updates
                </Text>
              </View>
            </TouchableOpacity>

            {/* Admin Card */}
            <TouchableOpacity
              style={[styles.card, { backgroundColor: '#16a34a' }]}
              activeOpacity={0.85}
              onPress={() => onSelectRole('Admin')}
            >
              <Ionicons name="shield-checkmark" size={40} color="#fff" style={styles.cardIcon} />
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>ADMIN</Text>
                <Text style={styles.cardSubtitle}>
                  Monitor network, Manage Distribution, Track Repairs
                </Text>
              </View>
            </TouchableOpacity>

            {/* Technician Card */}
            <TouchableOpacity
              style={[styles.card, { backgroundColor: '#b45309' }]}
              activeOpacity={0.85}
              onPress={() => onSelectRole('Technician')}
            >
              <Ionicons name="build" size={40} color="#fff" style={styles.cardIcon} />
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>TECHNICIAN</Text>
                <Text style={styles.cardSubtitle}>
                  View Work Queue, update repairs, manage inventory
                </Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>
         <Text style={styles.credit}>Developed by Junrel Alipogpog</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Decorative ripple circles
  rippleLarge: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  rippleMedium: {
    position: 'absolute',
    top: -20,
    right: 10,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rippleSmall: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rippleBottom: {
    position: 'absolute',
    bottom: -100,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e0f2fe',
    marginTop: 4,
    textAlign: 'center',
  },
  sdgTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#bae6fd',
    marginTop: 2,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 18,
    marginVertical: 'auto',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardIcon: {
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
    cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#f1f5f9',
    marginTop: 2,
  },
  credit: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    opacity: 100,
    fontWeight: '900',
    color: 'rgba(254, 255, 250, 0.65)',
  },
});