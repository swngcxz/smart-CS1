import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BinAlertModalProps {
  visible: boolean;
  onClose: () => void;
  binData: any;
  onOptionA: () => void; // Modal with data
  onOptionB: () => void; // Redirect to bin details
}

const { width } = Dimensions.get('window');

export default function BinAlertModal({ 
  visible, 
  onClose, 
  binData, 
  onOptionA, 
  onOptionB 
}: BinAlertModalProps) {
  if (!binData) return null;

  const getStatusColor = (level: number) => {
    if (level >= 90) return "#f44336";
    if (level >= 80) return "#ff9800";
    return "#4caf50";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons 
                name="warning" 
                size={24} 
                color={getStatusColor(binData.level)} 
              />
              <Text style={styles.headerTitle}>Bin Alert</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.alertCard}>
              <Text style={styles.binName}>{binData.name}</Text>
              <Text style={styles.binLocation}>{binData.location || 'Central Plaza'}</Text>
              
              <View style={styles.levelContainer}>
                <Text style={styles.levelText}>Bin Level: {binData.level}%</Text>
                <View style={[styles.levelBar, { backgroundColor: getStatusColor(binData.level) }]} />
              </View>

              <Text style={styles.alertMessage}>
                This bin has exceeded 85% capacity and requires immediate attention.
              </Text>
            </View>

            <Text style={styles.optionsTitle}>Choose your action:</Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionButton, styles.optionA]}
                onPress={onOptionA}
              >
                <Ionicons name="information-circle" size={24} color="#4caf50" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Option A</Text>
                  <Text style={styles.optionDescription}>
                    View detailed bin information and start pickup workflow
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, styles.optionB]}
                onPress={onOptionB}
              >
                <Ionicons name="map" size={24} color="#2196f3" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Option B</Text>
                  <Text style={styles.optionDescription}>
                    Go to bin details page with map and pickup button
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  alertCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  binName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  binLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  levelContainer: {
    marginBottom: 12,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  levelBar: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionA: {
    backgroundColor: '#f0f8f0',
    borderColor: '#4caf50',
  },
  optionB: {
    backgroundColor: '#f0f6ff',
    borderColor: '#2196f3',
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});
