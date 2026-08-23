import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ReportForm({ visible, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Function to open device camera
  const handleTakePhoto = async () => {
    // Request permission to access camera
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take photos of fault lines.');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 2. Submit report logic
  const handleSubmit = async () => {
    if (!title || !description || !reporterName) {
      Alert.alert('Error', 'Please fill in Title, Description, and Your Name.');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = null;

      // Handle photo upload to Supabase storage if image taken
      if (imageUri) {
        const fileName = `report_${Date.now()}.jpg`;

        // Fetch local image file and convert to ArrayBuffer for React Native compatibility
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer();

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('fault_photos')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Storage Upload Error:', uploadError.message);
        } else {
          // Retrieve Public URL
          const { data: publicUrlData } = supabase.storage
            .from('fault_photos')
            .getPublicUrl(fileName);

          photoUrl = publicUrlData.publicUrl;
        }
      }

      // Insert record to database
      const { error } = await supabase.from('fault_reports').insert([
        {
          title,
          description,
          location,
          reporter_name: reporterName,
          photo_url: photoUrl,
          status: 'Pending',
        },
      ]);

      if (error) throw error;

      // Reset Form & Close Modal
      setTitle('');
      setDescription('');
      setLocation('');
      setReporterName('');
      setImageUri(null);
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert('Submission Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Report a Fault Line</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Broken pipe near basketball court"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the fault line issue"
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Purok 3, Banban"
              placeholderTextColor="#94a3b8"
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#94a3b8"
              value={reporterName}
              onChangeText={setReporterName}
            />

            <Text style={styles.label}>Photo</Text>

            {/* Render Preview if photo is captured, else render Attach Photo button */}
            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.retakeBtnText}>📷 Retake Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={handleTakePhoto}
              >
                <Text style={styles.photoBtnText}>📷 Attach Photo (Take Picture)</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  photoBtn: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  photoBtnText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 14,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  retakeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  retakeBtnText: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    marginRight: 12,
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 15,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});