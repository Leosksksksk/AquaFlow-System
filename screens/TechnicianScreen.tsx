import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
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

// 1. Updated Props to only expect onBack
interface Props {
  onBack?: () => void;
}

// 2. Updated component signature
export default function TechnicianScreen({ onBack }: Props) {
  const [techName, setTechName] = useState('');
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
        {/* 3. Changed button to trigger onBack and act as a Log Out button */}
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.switchText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Your name (to see assigned jobs):</Text>
        <TextInput
          style={styles.filterInput}
          value={techName}
          onChangeText={setTechName}
          placeholder="e.g. Juan Dela Cruz"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0369a1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visibleReports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0369a1']} />}
          renderItem={({ item }) => <TechnicianReportCard report={item} onUpdated={fetchReports} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {techName.trim()
                ? 'No jobs assigned to you right now.'
                : 'Enter your name above to see your assigned jobs, or check escalated reports below.'}
            </Text>
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
  filterBar: { padding: 16, backgroundColor: '#fff' },
  filterLabel: { fontSize: 12, color: '#555', marginBottom: 6, fontWeight: '600' },
  filterInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14 },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, paddingHorizontal: 20 },
});