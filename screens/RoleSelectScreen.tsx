import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../types/report';

interface Props {
  onSelectRole: (role: UserRole) => void;
}

export default function RoleSelectScreen({ onSelectRole }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cbd5e1', // Matches the light aqua/cyan background vibe
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
    backgroundColor: '#fff',
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
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f766e',
    marginTop: 4,
    textAlign: 'center',
  },
  sdgTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
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
});