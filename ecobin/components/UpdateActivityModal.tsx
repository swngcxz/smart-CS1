import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '../utils/axiosInstance';
import { useAccount } from '../contexts/AccountContext';

interface UpdateActivityModalProps {
  visible: boolean;
  onClose: () => void;
  activityLog: any;
  onUpdate: () => void;
}

export default function UpdateActivityModal({ 
  visible, 
  onClose, 
  activityLog, 
  onUpdate 
}: UpdateActivityModalProps) {
  const { account } = useAccount();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: 'in_progress',
    completion_notes: '',
    collected_weight: '',
    bin_condition: 'good',
  });
  const [checklist, setChecklist] = useState({
    bin_emptied: false,
    area_cleaned: false,
    bin_checked: false,
    waste_disposed: false,
    photos_taken: false,
  });

  const handleUpdate = async () => {
    if (!activityLog?.id) {
      Alert.alert('Error', 'Activity log ID not found');
      return;
    }

    if (!formData.completion_notes.trim()) {
      Alert.alert('Error', 'Please enter completion notes');
      return;
    }

    // If status is 'done', validate checklist
    if (formData.status === 'done') {
      const completedTasks = Object.values(checklist).filter(Boolean).length;
      if (completedTasks < 3) {
        Alert.alert('Error', 'Please complete at least 3 checklist items before marking as done');
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = {
        status: formData.status,
        completion_notes: formData.completion_notes,
        collected_weight: formData.collected_weight ? parseFloat(formData.collected_weight) : null,
        collection_time: new Date().toISOString(),
        bin_condition: formData.bin_condition,
        checklist: formData.status === 'done' ? checklist : null,
        user_id: account?.id,
        user_name: account?.fullName || account?.email,
      };

      console.log('📱 Mobile App - Updating activity log:', activityLog.id, updateData);

      const response = await axiosInstance.put(
        `/api/activitylogs/${activityLog.id}`,
        updateData
      );

      console.log('📱 Mobile App - Activity log updated successfully:', response.data);

      Alert.alert(
        'Success',
        formData.status === 'done' 
          ? 'Activity completed successfully! Staff will be notified.' 
          : 'Activity updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              onUpdate();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('📱 Mobile App - Error updating activity log:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to update activity log'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      status: 'in_progress',
      completion_notes: '',
      collected_weight: '',
      bin_condition: 'good',
    });
    setChecklist({
      bin_emptied: false,
      area_cleaned: false,
      bin_checked: false,
      waste_disposed: false,
      photos_taken: false,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={dismissKeyboard}
        >
          <View style={styles.modalContainer}>
            <View style={styles.header}>
            <Text style={styles.title}>Update Activity</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Bin {activityLog?.bin_id}</Text>
              <Text style={styles.activityLocation}>📍 {activityLog?.bin_location}</Text>
              <Text style={styles.activityType}>Type: {activityLog?.activity_type}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status *</Text>
              <View style={styles.statusContainer}>
                {['pending', 'in_progress', 'done'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      formData.status === status && styles.statusButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, status })}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        formData.status === status && styles.statusButtonTextActive,
                      ]}
                    >
                      {status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Completion Notes *</Text>
              <TextInput
                style={styles.textArea}
                value={formData.completion_notes}
                onChangeText={(text) => setFormData({ ...formData, completion_notes: text })}
                placeholder="Describe what was done..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
                blurOnSubmit={true}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Collected Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.collected_weight}
                onChangeText={(text) => setFormData({ ...formData, collected_weight: text })}
                placeholder="Enter weight in kg"
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
                blurOnSubmit={true}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bin Condition</Text>
              <View style={styles.conditionContainer}>
                {[
                  { value: 'good', label: 'Good', color: '#4CAF50' },
                  { value: 'fair', label: 'Fair', color: '#FF9800' },
                  { value: 'poor', label: 'Poor', color: '#F44336' },
                ].map((condition) => (
                  <TouchableOpacity
                    key={condition.value}
                    style={[
                      styles.conditionButton,
                      formData.bin_condition === condition.value && styles.conditionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, bin_condition: condition.value })}
                  >
                    <View
                      style={[
                        styles.conditionDot,
                        { backgroundColor: condition.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.conditionButtonText,
                        formData.bin_condition === condition.value && styles.conditionButtonTextActive,
                      ]}
                    >
                      {condition.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Checklist for Done Status */}
            {formData.status === 'done' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Completion Checklist *</Text>
                <Text style={styles.checklistSubtext}>Complete at least 3 items to mark as done</Text>
                <View style={styles.checklistContainer}>
                  {[
                    { key: 'bin_emptied', label: 'Bin emptied completely', icon: 'trash-outline' },
                    { key: 'area_cleaned', label: 'Area around bin cleaned', icon: 'brush-outline' },
                    { key: 'bin_checked', label: 'Bin checked for damage', icon: 'eye-outline' },
                    { key: 'waste_disposed', label: 'Waste properly disposed', icon: 'recycle-outline' },
                    { key: 'photos_taken', label: 'Photos taken for proof', icon: 'camera-outline' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.checklistItem}
                      onPress={() => toggleChecklistItem(item.key as keyof typeof checklist)}
                    >
                      <View style={styles.checklistItemLeft}>
                        <View style={[
                          styles.checkbox,
                          checklist[item.key as keyof typeof checklist] && styles.checkboxChecked
                        ]}>
                          {checklist[item.key as keyof typeof checklist] && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <Ionicons 
                          name={item.icon as any} 
                          size={20} 
                          color={checklist[item.key as keyof typeof checklist] ? '#3b82f6' : '#666'} 
                          style={styles.checklistIcon}
                        />
                        <Text style={[
                          styles.checklistLabel,
                          checklist[item.key as keyof typeof checklist] && styles.checklistLabelChecked
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.checklistProgress}>
                  <Text style={styles.checklistProgressText}>
                    {Object.values(checklist).filter(Boolean).length} of 5 completed
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      { width: `${(Object.values(checklist).filter(Boolean).length / 5) * 100}%` }
                    ]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={dismissKeyboard}
            >
              <Ionicons name="keypad-outline" size={16} color="#666" />
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateButton, loading && styles.updateButtonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>Update Activity</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activityInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  activityLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  activityType: {
    fontSize: 14,
    color: '#666',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  conditionContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  conditionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
  conditionButtonActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  conditionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  conditionButtonTextActive: {
    color: '#3b82f6',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  updateButton: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Done button styles
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },

  // Checklist styles
  checklistSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  checklistContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  checklistItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checklistItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checklistIcon: {
    marginRight: 8,
  },
  checklistLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  checklistLabelChecked: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  checklistProgress: {
    marginTop: 8,
  },
  checklistProgressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
});
