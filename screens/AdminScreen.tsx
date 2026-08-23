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
import AdminReportCard from '../components/AdminReportCard';
import { escalateStaleReports, ESCALATION_MINUTES } from '../utils/escalation';

interface Props {
  onBack?: () => void;
}

export default function AdminScreen({ onBack }: Props) {
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    // Check for reports the admin hasn't responded to in time, and escalate them
    await escalateStaleReports();

    const { data, error } = await supabase
      .from('fault_reports')
      .select('*')
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AquaFlow</Text>
          <Text style={styles.headerSubtitle}>Barangay Admin View</Text>
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.switchText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Reports auto-escalate to technicians if not assigned within {ESCALATION_MINUTES} minutes.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0369a1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0369a1']} />}
          renderItem={({ item }) => <AdminReportCard report={item} onUpdated={fetchReports} />}
          ListEmptyComponent={<Text style={styles.empty}>No reports submitted yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fffbeb' },
  header: {
    backgroundColor: '#d97706',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSubtitle: { color: '#fef3c7', fontSize: 12, marginTop: 2 },
  switchText: { color: '#fff', fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
  infoBar: { backgroundColor: '#fef3c7', padding: 10, paddingHorizontal: 16 },
  infoText: { fontSize: 12, color: '#92400e' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 60 },
});