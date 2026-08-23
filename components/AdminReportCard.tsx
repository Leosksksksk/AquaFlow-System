import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { FaultReport } from '../types/report';

const statusColors: Record<string, string> = {
  Pending: '#f59e0b',
  Assigned: '#8b5cf6',
  'In Progress': '#3b82f6',
  Resolved: '#22c55e',
};

interface TechnicianProfile {
  id: string;
  full_name: string;
}

interface Props {
  report: FaultReport;
  onUpdated: () => void;
}

export default function AdminReportCard({ report, onUpdated }: Props) {
  const [technician, setTechnician] = useState(report.assigned_technician ?? '');
  const [broadcast, setBroadcast] = useState('');
  const [saving, setSaving] = useState(false);

  // Technician picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);

  const openTechnicianPicker = async () => {
    setPickerVisible(true);
    setLoadingTechs(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'technician')
      .order('full_name', { ascending: true });

    setLoadingTechs(false);
    if (error) {
      Alert.alert('Error loading technicians', error.message);
      return;
    }
    setTechnicians((data as TechnicianProfile[]) ?? []);
  };

  const selectTechnician = (name: string) => {
    setTechnician(name);
    setPickerVisible(false);
  };

  const assignTechnician = async () => {
    if (!technician.trim()) {
      Alert.alert('Select a technician first.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('fault_reports')
      .update({
        assigned_technician: technician,
        status: 'Assigned',
        responded_at: new Date().toISOString(),
        escalated: false,
      })
      .eq('id', report.id);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else onUpdated();
  };

  const sendBroadcast = async () => {
    if (!broadcast.trim()) {
      Alert.alert('Enter a broadcast message first.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('fault_reports')
      .update({
        broadcast_message: broadcast,
        responded_at: new Date().toISOString(),
      })
      .eq('id', report.id);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else {
      setBroadcast('');
      onUpdated();
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Report', `Delete "${report.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('fault_reports').delete().eq('id', report.id);
          if (error) Alert.alert('Error', error.message);
          else onUpdated();
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      {report.photo_url && <Image source={{ uri: report.photo_url }} style={styles.image} />}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{report.title}</Text>
          <View style={[styles.badge, { backgroundColor: statusColors[report.status] }]}>
            <Text style={styles.badgeText}>{report.status}</Text>
          </View>
        </View>

        {report.escalated && (
          <View style={styles.escalatedBanner}>
            <Text style={styles.escalatedText}>⚠️ Auto-escalated to technicians (no admin response in time)</Text>
          </View>
        )}

        <Text style={styles.desc}>{report.description}</Text>
        {report.location ? <Text style={styles.meta}>📍 {report.location}</Text> : null}
        <Text style={styles.meta}>Reported by {report.reporter_name}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Assign Technician</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.pickerField} onPress={openTechnicianPicker}>
            <Text style={technician ? styles.pickerFieldText : styles.pickerFieldPlaceholder}>
              {technician || 'Select technician'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={assignTechnician} disabled={saving}>
            <Text style={styles.smallBtnText}>Assign</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Broadcast Update to Residents</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={broadcast}
            onChangeText={setBroadcast}
            placeholder="e.g. Repair scheduled tomorrow 9AM"
          />
         <TouchableOpacity style={[styles.smallBtn, styles.broadcastBtn]} onPress={sendBroadcast} disabled={saving}>
            <Text style={styles.smallBtnText}>Send</Text>
          </TouchableOpacity>
        </View> 

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Report</Text>
        </TouchableOpacity>
      </View>

      {/* Technician Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Technician</Text>

            {loadingTechs ? (
              <ActivityIndicator color="#0369a1" style={{ marginVertical: 24 }} />
            ) : technicians.length === 0 ? (
              <Text style={styles.emptyText}>
                No technician accounts found. Ask a technician to sign up first.
              </Text>
            ) : (
              <FlatList
                data={technicians}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.techRow}
                    onPress={() => selectTechnician(item.full_name)}
                  >
                    <Text style={styles.techName}>{item.full_name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  image: { width: '100%', height: 150 },
  content: { padding: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  escalatedBanner: { backgroundColor: '#fee2e2', padding: 8, borderRadius: 8, marginTop: 8 },
  escalatedText: { color: '#991b1b', fontSize: 12, fontWeight: '600' },
  desc: { color: '#444', marginTop: 6, fontSize: 14 },
  meta: { color: '#777', fontSize: 12, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 13, marginRight: 8 },
  pickerField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    justifyContent: 'center',
  },
  pickerFieldText: { fontSize: 13, color: '#111' },
  pickerFieldPlaceholder: { fontSize: 13, color: '#999' },
  smallBtn: { backgroundColor: '#0369a1', paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' },
  broadcastBtn: { backgroundColor: '#d97706' },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  deleteBtn: { marginTop: 14, alignItems: 'center', padding: 8 },
  deleteText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0369a1', marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 13, textAlign: 'center', marginVertical: 24 },
  techRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  techName: { fontSize: 15, color: '#111', fontWeight: '600' },
  modalCloseBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
  modalCloseText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
});