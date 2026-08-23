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
import ReportForm from '../components/ReportForm';

const statusColors: Record<string, string> = {
  Pending: '#f59e0b',
  Assigned: '#8b5cf6',
  'In Progress': '#3b82f6',
  Resolved: '#22c55e',
};

interface Props {
  onBack?: () => void;
}

export default function ResidentScreen({ onBack }: Props) {
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  const fetchReports = useCallback(async () => {
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
          <Text style={styles.headerSubtitle}>Resident View</Text>
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.switchText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setFormVisible(true)}>
        <Text style={styles.addBtnText}>+ Report a Fault Line</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0369a1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0369a1']} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.title}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: statusColors[item.status] }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.desc}>{item.description}</Text>
              {item.location ? <Text style={styles.meta}>📍 {item.location}</Text> : null}
              <Text style={styles.meta}>Reported by {item.reporter_name}</Text>
              {item.assigned_technician ? (
                <Text style={styles.meta}>🔧 Technician assigned: {item.assigned_technician}</Text>
              ) : null}
              {item.broadcast_message ? (
                <View style={styles.broadcastBox}>
                  <Text style={styles.broadcastLabel}>📢 Barangay Update</Text>
                  <Text style={styles.broadcastText}>{item.broadcast_message}</Text>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No reports yet. Be the first to report an issue.</Text>}
        />
      )}

      <ReportForm visible={formVisible} onClose={() => setFormVisible(false)} onSaved={fetchReports} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f9ff' },
  header: {
    backgroundColor: '#0369a1',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSubtitle: { color: '#e0f2fe', fontSize: 12, marginTop: 2 },
  switchText: { color: '#fff', fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
  addBtn: { backgroundColor: '#0369a1', margin: 16, padding: 14, borderRadius: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  desc: { color: '#444', marginTop: 6, fontSize: 14 },
  meta: { color: '#777', fontSize: 12, marginTop: 4 },
  broadcastBox: { backgroundColor: '#fef9c3', borderRadius: 8, padding: 10, marginTop: 10 },
  broadcastLabel: { fontSize: 11, fontWeight: '700', color: '#854d0e' },
  broadcastText: { fontSize: 13, color: '#713f12', marginTop: 2 },
  empty: { textAlign: 'center', color: '#888', marginTop: 60 },
});