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

type Orientation = 'portrait' | 'landscape';

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
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [loading, setLoading] = useState(false);

  // Reads width/height from whatever the picker gave us so the preview
  // starts on the correct orientation; the user can still override it below.
  const applyPickerResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    if (asset.width && asset.height) {
      setOrientation(asset.width >= asset.height ? 'landscape' : 'portrait');
    }
  };

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

    applyPickerResult(result);
  };

  // 1b. Function to pick a photo from the device's album/gallery
  const handleChooseFromAlbum = async () => {
    // Request permission to access the photo library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Photo library access is required to attach a photo.');
      return;
    }

    // Launch the album/gallery picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    applyPickerResult(result);
  };

  const removePhoto = () => {
    setImageUri(null);
    setOrientation('portrait');
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
          photo_orientation: imageUri ? orientation : null,
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
      setOrientation('portrait');
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

            {/* Render Preview if photo is captured, else render the two attach buttons */}
            {imageUri ? (
              <View style={styles.previewContainer}>
                <View
                  style={[
                    styles.previewFrame,
                    orientation === 'portrait' ? styles.previewFramePortrait : styles.previewFrameLandscape,
                  ]}
                >
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeBtn} onPress={removePhoto}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.orientationRow}>
                  <Text style={styles.orientationLabel}>Orientation</Text>
                  <View style={styles.segmented}>
                    <TouchableOpacity
                      style={[styles.segBtn, orientation === 'portrait' && styles.segBtnActive]}
                      onPress={() => setOrientation('portrait')}
                    >
                      <Text style={[styles.segBtnText, orientation === 'portrait' && styles.segBtnTextActive]}>
                        Portrait
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.segBtn, orientation === 'landscape' && styles.segBtnActive]}
                      onPress={() => setOrientation('landscape')}
                    >
                      <Text style={[styles.segBtnText, orientation === 'landscape' && styles.segBtnTextActive]}>
                        Landscape
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.retakeRow}>
                  <TouchableOpacity style={styles.retakeBtn} onPress={handleTakePhoto}>
                    <Text style={styles.retakeBtnText}>📷 Retake Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.retakeBtn} onPress={handleChooseFromAlbum}>
                    <Text style={styles.retakeBtnText}>🖼️ Choose Different</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.photoActionsRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
                  <Text style={styles.photoBtnText}>📷 Take Picture</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={handleChooseFromAlbum}>
                  <Text style={styles.photoBtnText}>🖼️ Choose from Album</Text>
                </TouchableOpacity>
              </View>
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

  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  photoBtn: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  photoBtnText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 13,
  },

  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewFrame: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    marginBottom: 10,
  },
  previewFramePortrait: {
    width: 200,
    aspectRatio: 3 / 4,
    alignSelf: 'center',
  },
  previewFrameLandscape: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15,23,42,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 13,
  },

  orientationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  orientationLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 9,
    padding: 3,
    gap: 2,
  },
  segBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  segBtnActive: {
    backgroundColor: '#ffffff',
  },
  segBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
  segBtnTextActive: {
    color: '#0369a1',
  },

  retakeRow: {
    flexDirection: 'row',
    gap: 8,
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