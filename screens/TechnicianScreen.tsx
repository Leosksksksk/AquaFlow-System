import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { FaultReport } from '../types/report';
import TechnicianReportCard from '../components/TechnicianReportCard';
import { escalateStaleReports } from '../utils/escalation';

interface Props {
  onBack?: () => void;
  techName?: string;
}

export default function TechnicianScreen({ onBack, techName = '' }: Props) {
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    await escalateStaleReports();

    const { data, error } = await supabase
      .from('fault_reports')
      .select('*')
      .neq('status', 'Resolved')
      .order('created_at', { ascending: false });

    if (!error) setReports(data as FaultReport[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // Show escalated reports AND tasks assigned to the logged-in technician
  const visibleReports = reports.filter(
    (r) =>
      r.escalated ||
      (techName.trim() !== '' &&
        r.assigned_technician?.toLowerCase().trim() === techName.toLowerCase().trim())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AquaFlow</Text>
          <Text style={styles.headerSubtitle}>Technician View</Text>
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.switchText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Technician identity banner */}
      {techName.trim() !== '' && (
        <View style={styles.identityBar}>
          <Text style={styles.identityIcon}>👷</Text>
          <View>
            <Text style={styles.identityLabel}>Logged in as</Text>
            <Text style={styles.identityName}>{techName}</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visibleReports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />}
          renderItem={({ item }) => <TechnicianReportCard report={item} onUpdated={fetchReports} />}
          ListHeaderComponent={
            visibleReports.length > 0 ? (
              <Text style={styles.sectionHeader}>
                📋 {visibleReports.length} Assigned Job{visibleReports.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.empty}>
                {techName.trim()
                  ? 'No jobs assigned to you right now. Great work!'
                  : 'No tasks available.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    backgroundColor: '#16a34a',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSubtitle: { color: '#dcfce7', fontSize: 12, marginTop: 2 },
  switchText: { color: '#fff', fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
  identityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
    gap: 12,
  },
  identityIcon: { fontSize: 28 },
  identityLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  identityName: { fontSize: 16, color: '#15803d', fontWeight: '700', marginTop: 1 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  list: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  empty: { textAlign: 'center', color: '#888', fontSize: 14, lineHeight: 20 },
});