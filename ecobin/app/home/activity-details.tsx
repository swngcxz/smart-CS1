import BackButton from "@/components/BackButton";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '../../utils/axiosInstance';
import { useAccount } from '../../hooks/useAccount';

export default function ProofOfPickupScreen() {
  const { binId, location, activityLog, isReadOnly } = useLocalSearchParams();
  const router = useRouter();
  const { account } = useAccount();
  const [image, setImage] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("pending");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedBinCondition, setSelectedBinCondition] = useState("good");
  const [parsedActivityLog, setParsedActivityLog] = useState<any>(null);
  
  // Parse activity log data if provided
  console.log('📱 Mobile App - Raw activityLog param:', activityLog);
  console.log('📱 Mobile App - Raw isReadOnly param:', isReadOnly);
  
  const isReadOnlyMode = isReadOnly === "true";
  
  console.log('📱 Mobile App - Parsed activity log:', parsedActivityLog);
  console.log('📱 Mobile App - Is read only mode:', isReadOnlyMode);

  // Parse activity log data when activityLog param changes
  useEffect(() => {
    if (activityLog) {
      try {
        const parsed = JSON.parse(activityLog as string);
        setParsedActivityLog(parsed);
        
        // Set the actual status from the activity log data
        // Proper status logic: completed > in_progress > pending
        const actualStatus = (() => {
          if (parsed.bin_status === "done" || parsed.status === "done" || parsed.completed_at || parsed.proof_image || parsed.photos?.length > 0) {
            return "done"; // Task is completed (has proof)
          } else if (parsed.assigned_janitor_id) {
            return "in_progress"; // Janitor assigned but not completed
          } else {
            return "pending"; // No janitor assigned
          }
        })();
        setCurrentStatus(actualStatus);
        setSelectedStatus(actualStatus);
        
        console.log('📱 Mobile App - Successfully parsed activity log:', parsed);
        console.log('📱 Mobile App - Parsed bin_status:', parsed.bin_status);
        console.log('📱 Mobile App - Parsed status:', parsed.status);
        console.log('📱 Mobile App - Setting status to:', actualStatus);
      } catch (error) {
        console.error('📱 Mobile App - Failed to parse activity log:', error);
        setParsedActivityLog(null);
      }
    } else {
      setParsedActivityLog(null);
    }
  }, [activityLog]);

  // Populate form with existing data if in read-only mode
  useEffect(() => {
    if (isReadOnlyMode && parsedActivityLog) {
      console.log('📱 Mobile App - Loading completed activity data:', parsedActivityLog);
      setCurrentStatus(parsedActivityLog.status || "done");
      setSelectedStatus(parsedActivityLog.status || "done");
      setSelectedBinCondition(parsedActivityLog.bin_condition || "good");
      setRemarks(parsedActivityLog.completion_notes || "");
      
      // Handle different image field names from backend
      console.log('📱 Mobile App - Available image fields:', {
        proof_image: parsedActivityLog.proof_image,
        photos: parsedActivityLog.photos,
        completed_by_photos: parsedActivityLog.completed_by?.photos,
        all_fields: Object.keys(parsedActivityLog)
      });
      
      const imageUrl = parsedActivityLog.proof_image || 
                      parsedActivityLog.photos?.[0] || 
                      parsedActivityLog.completed_by?.photos?.[0] ||
                      null;
      setImage(imageUrl);
      console.log('📱 Mobile App - Setting image from activity log:', imageUrl);
    }
  }, [isReadOnlyMode, parsedActivityLog]);

  // Save state when component unmounts (modal closes)
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      // The database update should already be persisted from the pickup action
      console.log('📱 Mobile App - Activity details modal closing, state should be persisted');
    };
  }, []);

  // Fetch activity log data if not provided
  useEffect(() => {
    const fetchActivityLogData = async () => {
      if (!parsedActivityLog && binId && account?.id) {
        console.log('📱 Mobile App - No activity log data provided, fetching from API...');
        try {
          // Try to get the activity log by bin_id from all logs
          const response = await axiosInstance.get('/api/activitylogs');
          const activities = response.data.activities || [];
          const matchingLog = activities.find((log: any) => log.bin_id === binId);
          
          if (matchingLog) {
            console.log('📱 Mobile App - Found matching activity log:', matchingLog);
            // Update the parsedActivityLog state
            setParsedActivityLog(matchingLog);
            
            // Set the actual status from the fetched activity log data
            // Proper status logic: completed > in_progress > pending
            const actualStatus = (() => {
              if (matchingLog.bin_status === "done" || matchingLog.status === "done" || matchingLog.completed_at || matchingLog.proof_image || matchingLog.photos?.length > 0) {
                return "done"; // Task is completed (has proof)
              } else if (matchingLog.assigned_janitor_id) {
                return "in_progress"; // Janitor assigned but not completed
              } else {
                return "pending"; // No janitor assigned
              }
            })();
            setCurrentStatus(actualStatus);
            setSelectedStatus(actualStatus);
            console.log('📱 Mobile App - API matchingLog bin_status:', matchingLog.bin_status);
            console.log('📱 Mobile App - API matchingLog status:', matchingLog.status);
            console.log('📱 Mobile App - Setting status from API to:', actualStatus);
          } else {
            console.log('📱 Mobile App - No matching activity log found for bin:', binId);
          }
        } catch (error) {
          console.error('📱 Mobile App - Failed to fetch activity log:', error);
        }
      }
    };

    fetchActivityLogData();
  }, [binId, account?.id, parsedActivityLog]);

  const now = new Date();
  // 📅 Format date like "September 3, 2025"
  const currentDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // ⏰ Time in HH:MM AM/PM
  const currentTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "done":
        return styles.statusDone;
      case "in_progress":
        return styles.statusInProgress;
      case "cancelled":
        return styles.statusCancelled;
      case "pending":
      default:
        return styles.statusPending;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return "checkmark-circle";
      case "in_progress":
        return "time";
      case "cancelled":
        return "close-circle";
      case "pending":
      default:
        return "hourglass";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "done":
        return "COMPLETED";
      case "in_progress":
        return "IN PROGRESS";
      case "cancelled":
        return "CANCELLED";
      case "pending":
      default:
        return "PENDING";
    }
  };

  const handlePickup = async () => {
    setSubmitting(true);
    try {
      console.log('📱 Mobile App - Claiming pickup task for user:', account?.id);
      
      // Update the activity log to assign current user as janitor
      const updateData = {
        assigned_janitor_id: account?.id,
        assigned_janitor_name: account?.fullName || account?.email || 'Unknown User',
        bin_status: 'in_progress',
        status: 'in_progress',
        updated_at: new Date().toISOString()
      };

      // Find the activity log ID from the parsed data
      const activityId = parsedActivityLog?.id;
      if (!activityId) {
        throw new Error('Activity log ID not found');
      }

      console.log('📱 Mobile App - Updating activity log:', activityId, 'with data:', updateData);
      const response = await axiosInstance.put(`/api/activitylogs/${activityId}`, updateData);
      console.log('📱 Mobile App - Update response:', response.data);
      
      if (response.data.message && response.data.message.includes('successfully')) {
        console.log('✅ Activity log updated - Task claimed by user');
        
        // Update local state immediately
        setParsedActivityLog(prev => ({
          ...prev,
          assigned_janitor_id: account?.id,
          assigned_janitor_name: account?.fullName || account?.email || 'Unknown User',
          bin_status: 'in_progress',
          status: 'in_progress'
        }));
        
        setCurrentStatus('in_progress');
        setSelectedStatus('in_progress');
        
        Alert.alert(
          "Task Claimed",
          "You have successfully claimed this pickup task. The task status has been updated to 'In Progress'.",
          [{ text: "OK" }]
        );
      } else {
        throw new Error(response.data.message || 'Failed to claim task');
      }
    } catch (error) {
      console.error('Error claiming pickup task:', error);
      Alert.alert(
        "Error",
        "Failed to claim pickup task. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      Alert.alert('Error', 'Please upload a photo as proof of pickup');
      return;
    }

    setSubmitting(true);
    setCurrentStatus("in_progress");
    
    try {
      // Update activity log with selected status and bin condition
      const updateData = {
        status: selectedStatus,
        completion_notes: remarks || 'Task completed with proof of pickup',
        collection_time: new Date().toISOString(),
        bin_condition: selectedBinCondition,
        collected_weight: null, // Add this field as expected by backend
        photos: image ? [image] : [], // Backend expects array of photos
        user_id: account?.id,
        user_name: account?.fullName || account?.email,
      };

      console.log('📱 Mobile App - Updating activity log:', updateData);
      console.log('📱 Mobile App - Parsed activity log data:', parsedActivityLog);

      // Get the real activity log ID from the parsed activity log data
      const activityLogId = parsedActivityLog?.id || parsedActivityLog?.activity_id;
      
      console.log('📱 Mobile App - Activity log ID:', activityLogId);
      
      if (!activityLogId) {
        console.error('📱 Mobile App - No activity log ID found in:', parsedActivityLog);
        Alert.alert('Error', 'Activity log ID not found. Cannot update the task.');
        setSubmitting(false);
        return;
      }
      
      try {
        // Try to update the activity log via API
        console.log(`📱 Mobile App - Making PUT request to: /api/activitylogs/${activityLogId}`);
        const response = await axiosInstance.put(
          `/api/activitylogs/${activityLogId}`,
          updateData
        );
        console.log('📱 Mobile App - Activity log updated successfully:', response.data);
      } catch (apiError: any) {
        console.error('📱 Mobile App - API update failed:', apiError);
        console.error('📱 Mobile App - Error details:', {
          message: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data,
          url: apiError.config?.url
        });
        
        // Show specific error message to user
        Alert.alert(
          'Update Failed', 
          `Failed to update activity log: ${apiError.response?.data?.error || apiError.message}`,
          [{ text: 'OK' }]
        );
        setSubmitting(false);
        return;
      }

      setCurrentStatus("done");
      Alert.alert(
        'Success',
        `Task completed successfully! Status updated to ${selectedStatus.toUpperCase().replace('_', ' ')}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to activity logs and refresh
              router.replace("/home/activity-logs");
              // Force refresh by navigating to home first, then back to activity logs
              setTimeout(() => {
                router.push("/home/activity-logs");
              }, 100);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('📱 Mobile App - Error updating activity log:', error);
      setCurrentStatus("pending");
      Alert.alert(
        'Error',
        'Failed to update task status. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity 
          style={styles.scrollContainer} 
          activeOpacity={1} 
          onPress={dismissKeyboard}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
            nestedScrollEnabled={true}
            bounces={true}
          >
            <BackButton />

          <Text style={styles.title}>
            {isReadOnlyMode ? "Activity Details" : "Proof of Pickup"}
          </Text>
          
          {isReadOnlyMode && (
            <View style={styles.readOnlyIndicator}>
              <Ionicons name="lock-closed" size={16} color="#666" />
              <Text style={styles.readOnlyText}>Completed Activity - View Only</Text>
            </View>
          )}

          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, getStatusBadgeStyle(currentStatus)]}>
              <Ionicons 
                name={getStatusIcon(currentStatus) as any} 
                size={16} 
                color="#fff" 
                style={styles.statusIcon}
              />
              <Text style={styles.statusText}>{getStatusText(currentStatus)}</Text>
            </View>
          </View>

          {/* Janitor Assignment Info */}
          {parsedActivityLog?.assigned_janitor_name && (
            <View style={styles.janitorInfoContainer}>
              <Ionicons name="person" size={16} color="#666" />
              <Text style={styles.janitorLabel}>Assigned Janitor:</Text>
              <Text style={styles.janitorName}>{parsedActivityLog.assigned_janitor_name}</Text>
            </View>
          )}

          {/* Bin details */}
          <View style={styles.detailsBox}>
            <Text style={styles.detail}><Text style={styles.label}>Bin ID:</Text> {binId ?? "N/A"}</Text>
            <Text style={styles.detail}><Text style={styles.label}>Location:</Text> {location ?? "Unknown"}</Text>
            <Text style={styles.detail}><Text style={styles.label}>Date:</Text> {currentDate}</Text>
            <Text style={styles.detail}><Text style={styles.label}>Time:</Text> {currentTime}</Text>
          </View>

          {/* Completion details for done activities */}
          {isReadOnlyMode && parsedActivityLog && (
            <View style={styles.completionDetailsBox}>
              <Text style={styles.completionTitle}>Completion Details</Text>
              {parsedActivityLog.collection_time && (
                <Text style={styles.detail}>
                  <Text style={styles.label}>Completed:</Text> {new Date(parsedActivityLog.collection_time).toLocaleString()}
                </Text>
              )}
              {parsedActivityLog.user_name && (
                <Text style={styles.detail}>
                  <Text style={styles.label}>Completed by:</Text> {parsedActivityLog.user_name}
                </Text>
              )}
              {parsedActivityLog.checklist && (
                <View style={styles.checklistDisplay}>
                  <Text style={styles.label}>Checklist:</Text>
                  {Object.entries(parsedActivityLog.checklist).map(([key, value]) => (
                    <View key={key} style={styles.checklistItem}>
                      <Ionicons 
                        name={value ? "checkmark-circle" : "close-circle"} 
                        size={16} 
                        color={value ? "#4CAF50" : "#F44336"} 
                      />
                      <Text style={styles.checklistText}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Status Selection */}
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionLabel}>Status *</Text>
            <View style={styles.buttonRow}>
              {['pending', 'in_progress', 'done'].map((status) => {
                // Status selection restrictions based on current status
                let isDisabled = isReadOnlyMode;
                
                if (currentStatus === 'pending') {
                  // Pending: Only allow pending selection, disable others
                  isDisabled = status !== 'pending';
                } else if (currentStatus === 'in_progress') {
                  // In progress: Allow in_progress and done, disable pending
                  isDisabled = status === 'pending';
                } else if (currentStatus === 'done') {
                  // Done: Only allow done selection, disable others
                  isDisabled = status !== 'done';
                }
                
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      selectedStatus === status && styles.statusButtonSelected,
                      isDisabled && styles.disabledButton
                    ]}
                    onPress={() => !isDisabled && setSelectedStatus(status)}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      selectedStatus === status && styles.statusButtonTextSelected,
                      isDisabled && styles.disabledButtonText
                    ]}>
                      {status.toUpperCase().replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Status validation message */}
            {currentStatus === 'pending' && (
              <Text style={styles.validationMessage}>
                ⚠️ Pending task - Click "Pick-up" to claim and change status
              </Text>
            )}
            {currentStatus === 'in_progress' && (
              <Text style={styles.validationMessage}>
                ✅ Task in progress - Can be marked as done when completed
              </Text>
            )}
            {currentStatus === 'done' && (
              <Text style={styles.validationMessage}>
                ✅ Task is completed - status cannot be changed
              </Text>
            )}
          </View>

          {/* Bin Condition Selection - Disabled for pending tasks */}
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionLabel}>Bin Condition</Text>
            <View style={styles.buttonRow}>
              {[
                { value: 'good', label: 'Good', color: '#4CAF50' },
                { value: 'fair', label: 'Fair', color: '#FF9800' },
                { value: 'poor', label: 'Poor', color: '#F44336' }
              ].map((condition) => {
                const isDisabled = isReadOnlyMode || currentStatus === 'pending';
                return (
                  <TouchableOpacity
                    key={condition.value}
                    style={[
                      styles.conditionButton,
                      selectedBinCondition === condition.value && styles.conditionButtonSelected,
                      isDisabled && styles.disabledButton
                    ]}
                    onPress={() => !isDisabled && setSelectedBinCondition(condition.value)}
                    disabled={isDisabled}
                  >
                    <View style={[
                      styles.conditionDot,
                      { backgroundColor: condition.color }
                    ]} />
                    <Text style={[
                      styles.conditionButtonText,
                      selectedBinCondition === condition.value && styles.conditionButtonTextSelected,
                      isDisabled && styles.disabledButtonText
                    ]}>
                      {condition.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {currentStatus === 'pending' && (
              <Text style={styles.validationMessage}>
                ⚠️ Bin condition can only be set after claiming the task
              </Text>
            )}
          </View>

          <Text style={styles.instructions}>
            {isReadOnlyMode ? "Proof of pickup image:" : "Upload a clear photo after marking this bin as collected."}
          </Text>

          {/* Upload Image - Disabled for pending tasks */}
          <TouchableOpacity 
            style={[
              styles.imageBox, 
              (isReadOnlyMode || currentStatus === 'pending') && styles.readOnlyImageBox
            ]} 
            onPress={(!isReadOnlyMode && currentStatus !== 'pending') ? pickImage : undefined}
            disabled={isReadOnlyMode || currentStatus === 'pending'}
          >
            {image ? (
              <Image 
                source={{ uri: image }} 
                style={styles.image}
                onError={(error) => {
                  console.log('📱 Mobile App - Image load error:', error);
                  console.log('📱 Mobile App - Failed to load image URL:', image);
                }}
                onLoad={() => {
                  console.log('📱 Mobile App - Image loaded successfully:', image);
                }}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Ionicons name="image-outline" size={48} color="#ccc" />
                <Text style={styles.noImageText}>
                  {isReadOnlyMode ? "No image available" : "Tap to add image"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          {currentStatus === 'pending' && (
            <Text style={styles.validationMessage}>
              ⚠️ Photo can only be uploaded after claiming the task
            </Text>
          )}


          {/* Remarks Textbox - Disabled for pending tasks */}
          <TextInput
            style={[
              styles.textInput, 
              (isReadOnlyMode || currentStatus === 'pending') && styles.readOnlyTextInput
            ]}
            placeholder={
              isReadOnlyMode ? "No remarks provided" : 
              currentStatus === 'pending' ? "Remarks can only be added after claiming the task..." :
              "Write any messages..."
            }
            placeholderTextColor="#888"
            value={remarks}
            onChangeText={(!isReadOnlyMode && currentStatus !== 'pending') ? setRemarks : undefined}
            multiline
            returnKeyType="done"
            onSubmitEditing={dismissKeyboard}
            blurOnSubmit={true}
            editable={!isReadOnlyMode && currentStatus !== 'pending'}
          />

          {/* Action buttons - only show if not in read-only mode */}
          {!isReadOnlyMode && (
            <View style={styles.buttonContainer}>
              {/* Pick-up button - only show for pending tasks */}
              {currentStatus === 'pending' && (
                <TouchableOpacity
                  style={[
                    styles.pickupButton,
                    submitting && styles.disabled
                  ]}
                  onPress={handlePickup}
                  disabled={submitting}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.pickupButtonText}>Pick-up</Text>
                </TouchableOpacity>
              )}
              
              {/* Confirm button */}
              <TouchableOpacity
                style={[
                  styles.button, 
                  (!image || submitting) && styles.disabled
                ]}
                onPress={handleSubmit}
                disabled={!image || submitting}
              >
                <Text style={styles.buttonText}>
                  {submitting ? 'Submitting...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          </ScrollView>
        </TouchableOpacity>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfdfd",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 120, // Increased padding to ensure button is visible
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
    color: "#2e7d32",
  },
  detailsBox: {
    backgroundColor: "#e8f5e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  detail: { fontSize: 15, marginBottom: 8, color: "#333" },
  label: { fontWeight: "bold", color: "#1b5e20" },
  instructions: {
    fontSize: 14,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
  },
  imageBox: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: "#aaa",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    alignSelf: "center",
    marginBottom: 20,
    backgroundColor: "#fafafa",
  },
  // ⬆️ made bigger plus sign
  plus: { fontSize: 60, color: "#999" },
  image: { width: "100%", height: "100%", borderRadius: 15},
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  textInput: {
    minHeight: 90,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 20,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  button: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  pickupButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  pickupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { backgroundColor: "#bbb" },


  // Status indicator styles
  statusContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  janitorInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  janitorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  janitorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDone: {
    backgroundColor: '#4CAF50',
  },
  statusInProgress: {
    backgroundColor: '#FF9800',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusPending: {
    backgroundColor: '#9E9E9E',
  },

  // Selection styles
  selectionContainer: {
    marginBottom: 20,
  },
  selectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextSelected: {
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#999',
  },
  validationMessage: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  conditionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  conditionButtonSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#f0f9ff',
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  conditionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  conditionButtonTextSelected: {
    color: '#2196F3',
  },

  // Read-only styles
  readOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  readOnlyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  readOnlyButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  readOnlyButtonText: {
    color: '#999',
  },
  readOnlyImageBox: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
  },
  readOnlyTextInput: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    color: '#666',
  },

  // Completion details styles
  completionDetailsBox: {
    backgroundColor: "#e8f5e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 10,
  },
  checklistDisplay: {
    marginTop: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checklistText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});
