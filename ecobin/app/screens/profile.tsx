import React from 'react';
import { 
  Image, 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function ProfileScreen() {
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const { 
    profile, 
    loading, 
    error, 
    refreshProfile, 
    getProfileImageUrl, 
    getFormattedJoinDate, 
    getUserInitials 
  } = useProfile();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout 
        }
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view your profile</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileImageUrl = getProfileImageUrl();
  const joinDate = getFormattedJoinDate();
  const userInitials = getUserInitials();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshProfile} />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {profileImageUrl ? (
          <Image
            source={{ uri: profileImageUrl }}
            style={styles.avatar}
            onError={() => console.log('Failed to load profile image')}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        )}
        
        <Text style={styles.name}>{profile?.fullName || 'Unknown User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        
        {profile?.emailVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
      </View>

      {/* Profile Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.value}>
            {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Janitor'}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, styles.statusValue]}>
            {profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : 'Active'}
          </Text>
        </View>

        {profile?.contactNumber && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Contact:</Text>
            <Text style={styles.value}>{profile.contactNumber}</Text>
          </View>
        )}

        {profile?.location && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{profile.location}</Text>
          </View>
        )}

        {profile?.address && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{profile.address}</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.label}>Joined:</Text>
          <Text style={styles.value}>{joinDate}</Text>
        </View>

        {profile?.lastActivity && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Last Activity:</Text>
            <Text style={styles.value}>{profile.lastActivity}</Text>
          </View>
        )}
      </View>

      {/* Incomplete Profile Warning */}
      {(!profile?.contactNumber && !profile?.address && !profile?.location) && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Incomplete Profile</Text>
          <Text style={styles.warningText}>
            Your profile is missing some information. Consider updating your contact details and address.
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>⚠️ Profile Update Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  verifiedBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  statusValue: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    margin: 20,
    padding: 15,
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    margin: 20,
    padding: 15,
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
    textAlign: 'center',
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    margin: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
