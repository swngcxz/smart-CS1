import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import apiClient from "@/utils/apiConfig";
import { CLOUDINARY_CONFIG } from "@/config/cloudinary";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useProfile();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Initialize form with profile data or fallback to auth user data
  useEffect(() => {
    console.log('[EDIT-PROFILE] Profile data:', profile);
    console.log('[EDIT-PROFILE] Auth user data:', authUser);
    
    if (profile) {
      console.log('[EDIT-PROFILE] Using profile data');
      setName(profile.fullName || "");
      setEmail(profile.email || "");
      setPhone(profile.contactNumber || profile.phone || "");
      setAddress(profile.address || "");
      
      // Set profile image if available
      if (profile.profileImagePath) {
        const imageUrl = profile.profileImagePath.startsWith('http') 
          ? profile.profileImagePath 
          : `${apiClient.defaults.baseURL}/${profile.profileImagePath}`;
        setProfileImage(imageUrl);
      }
    } else if (authUser) {
      // Fallback to auth user data if profile is not available
      console.log('[EDIT-PROFILE] Using auth user data as fallback:', authUser);
      setName(authUser.fullName || "");
      setEmail(authUser.email || "");
      setPhone(authUser.phone || authUser.contactNumber || "");
      setAddress(authUser.address || "");
    }
  }, [profile, authUser]);

  // Also check if we have auth user data but no profile data, and use it directly
  useEffect(() => {
    if (authUser && !profile && !profileLoading) {
      console.log('[EDIT-PROFILE] Using auth user data directly since profile is not loading');
      setName(authUser.fullName || "");
      setEmail(authUser.email || "");
      setPhone(authUser.phone || authUser.contactNumber || "");
      setAddress(""); // Address should come from userInfo, not authUser
    }
  }, [authUser, profile, profileLoading]);

  const handleSave = async () => {
    if (!isAuthenticated || !authUser) {
      Alert.alert("Error", "Please log in to update your profile");
      return;
    }

    try {
      setSaving(true);

      const userId = authUser.id || (authUser as any)._id;
      console.log('[EDIT-PROFILE] Saving profile data for user:', userId);

      // Update user basic info (name, phone) in users table
      const userUpdateData = {
        fullName: name,
        contactNumber: phone,
        phone: phone,
      };

      console.log('[EDIT-PROFILE] Updating user data:', userUpdateData);
      await apiClient.patch('/auth/me', userUpdateData);

      // Update user info (address) in userInfo table
      const userInfoUpdateData = {
        address: address,
      };

      console.log('[EDIT-PROFILE] Address value being sent:', address);
      console.log('[EDIT-PROFILE] Updating userInfo data:', userInfoUpdateData);
      const response = await apiClient.patch('/api/userinfo/profile-fields', userInfoUpdateData);
      console.log('[EDIT-PROFILE] UserInfo response:', response.data);

      if (response.data && response.data.success) {
        console.log('[EDIT-PROFILE] Profile updated successfully');
        Alert.alert("Success", "Profile updated successfully.", [
          { 
            text: "OK", 
            onPress: () => {
              refreshProfile();
    router.replace("/(tabs)/settings");
            }
          }
        ]);
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } catch (error: any) {
      console.error('[EDIT-PROFILE] Error updating profile:', error);
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      setImageUploading(true);
      
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
        quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Upload image to server
        await uploadProfileImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      if (!isAuthenticated || !authUser) {
        Alert.alert("Error", "Please log in to upload image");
        return;
      }

      console.log('[EDIT-PROFILE] Uploading image to Cloudinary:', imageUri);

      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile-${Date.now()}.jpg`,
      } as any);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', 'mobile_uploads');

      // Upload to Cloudinary
      const cloudinaryResponse = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!cloudinaryResponse.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      console.log('[EDIT-PROFILE] Cloudinary upload successful:', cloudinaryData);

      // Save the Cloudinary URL to userInfo
      const userId = authUser.id || (authUser as any)._id;
      const updateData = {
        profileImagePath: cloudinaryData.secure_url,
        profileImageName: cloudinaryData.public_id,
        profileImageOriginalName: cloudinaryData.original_filename,
        profileImageSize: cloudinaryData.bytes,
        profileImageMimeType: cloudinaryData.format,
      };

      console.log('[EDIT-PROFILE] Saving image data to server:', updateData);
      
      const response = await apiClient.patch('/api/userinfo/profile-fields', updateData);

      if (response.data && response.data.success) {
        console.log('[EDIT-PROFILE] Profile image saved to database successfully');
        refreshProfile();
      } else {
        Alert.alert("Error", "Failed to save profile image to database");
      }
    } catch (error: any) {
      console.error('[EDIT-PROFILE] Error uploading profile image:', error);
      Alert.alert("Error", "Failed to upload profile image. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/settings")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={48} color="#721c24" />
          <Text style={styles.errorText}>Please log in to edit your profile</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show UI immediately with loading indicator

  // Show error if no profile data and no auth user data is available
  if (!authUser) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/settings")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={48} color="#721c24" />
          <Text style={styles.errorText}>No user data found</Text>
          <Text style={styles.errorSubtext}>Please try refreshing or contact support</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refreshProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/settings")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Profile</Text>
      </View>

      {/* Profile Picture */}
      <View style={styles.profileWrapper}>
        {profileImage ? (
        <Image
            source={{ uri: profileImage }}
          style={styles.profileImage}
            onError={() => console.log('Failed to load profile image')}
          />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Ionicons name="person" size={40} color="#ccc" />
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.editIcon, imageUploading && styles.editIconDisabled]} 
          onPress={pickImage}
          disabled={imageUploading}
        >
          {imageUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
          <Ionicons name="camera" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {profileLoading && (
        <View style={styles.loadingHeader}>
          <ActivityIndicator size="small" color="#2e7d32" />
          <Text style={styles.loadingHeaderText}>Loading profile...</Text>
        </View>
      )}

      {/* Form */}
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholder="Enter your name"
          editable={!saving}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={email}
          editable={false}
          placeholder="Email cannot be changed"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          editable={!saving}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput 
          style={styles.input} 
          value={address} 
          onChangeText={(text) => {
            console.log('[EDIT-PROFILE] Address changed to:', text);
            setAddress(text);
          }}
          placeholder="Enter your address"
          editable={!saving}
        />

        <TouchableOpacity 
          style={[styles.button, saving && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const PROFILE_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingTop: 60,
  },
  headerContainer: {
    position: "relative",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 13,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  profileWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    borderWidth: 2,
    borderColor: "#2e7d32",
    backgroundColor: "#ccc",
  },
  editIcon: {
    position: "absolute",
    right: PROFILE_SIZE / 4 - 10,
    bottom: 0,
    backgroundColor: "#2e7d32",
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  form: {
    paddingHorizontal: 30,
    alignItems: "center",
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
    borderRadius: 8,
  },
  loadingHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#721c24",
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  profilePlaceholder: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  editIconDisabled: {
    backgroundColor: "#ccc",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
    borderColor: "#e0e0e0",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
