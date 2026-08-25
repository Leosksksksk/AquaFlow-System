import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface Report {
  id: string;
  title: string;
  description: string;
  location: string | null;
  reporter_name: string;
  status: string;
  photo_url?: string | null;
}

interface Props {
  report: Report;
  onUpdated?: () => void;
}

export default function TechnicianReportCard({ report, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async (status: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('fault_reports')
      .update({
        status,
        resolved_at: status === 'Resolved' ? new Date().toISOString() : null,
      })
      .eq('id', report.id);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    if (onUpdated) onUpdated();
  };

  return (
    <View style={styles.card}>
      {report.photo_url ? (
        <Image
          source={{ uri: report.photo_url }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{report.title}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{report.status}</Text>
          </View>
        </View>

        {report.status === 'In Progress' && (
          <View style={[styles.progressBanner, { backgroundColor: '#dbeafe' }]}>
            <Text style={[styles.progressBannerText, { color: '#1d4ed8' }]}>
              🔧 You marked this as In Progress
            </Text>
          </View>
        )}
        {report.status === 'Resolved' && (
          <View style={[styles.progressBanner, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.progressBannerText, { color: '#166534' }]}>
              ✅ You marked this as Resolved
            </Text>
          </View>
        )}

        <Text style={styles.description}>{report.description}</Text>
        <Text style={styles.meta}>📍 {report.location}</Text>
        <Text style={styles.meta}>Reported by {report.reporter_name}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.progressBtn]}
            onPress={() => handleStatusChange('In Progress')}
            disabled={saving}
          >
            <Text style={styles.btnText}>Mark In Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.resolveBtn]}
            onPress={() => handleStatusChange('Resolved')}
            disabled={saving}
          >
            <Text style={styles.btnText}>Mark Resolved</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 12,
  },
  progressBanner: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  progressBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressBtn: {
    backgroundColor: '#e0f2fe',
  },
  resolveBtn: {
    backgroundColor: '#dcfce7',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
});