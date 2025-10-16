import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { usePassword } from "@/hooks/usePassword";
import ErrorModal from "@/components/ErrorModal";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { loading, error, changePassword, clearError } = usePassword();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalData, setErrorModalData] = useState({
        title: '',
        message: '',
        type: 'error' as 'error' | 'warning' | 'info'
    });

    const displayErrorModal = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'error') => {
        setErrorModalData({ title, message, type });
        setShowErrorModal(true);
    };

    const hideErrorModal = () => {
        setShowErrorModal(false);
        setErrorModalData({ title: '', message: '', type: 'error' });
    };

    const handleChangePassword = async () => {
        // Clear any previous errors
        clearError();

        if (!currentPassword || !newPassword || !confirmPassword) {
            displayErrorModal("Missing Information", "Please fill out all fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            displayErrorModal("Password Mismatch", "New passwords do not match. Please try again.");
            return;
        }

        if (newPassword.length < 8) {
            displayErrorModal("Weak Password", "New password must be at least 8 characters long.");
            return;
        }

        try {
            const result = await changePassword({
                currentPassword,
                newPassword,
            });

            if (result.success) {
                Alert.alert("Success", result.message, [
                    {
                        text: "OK",
                        onPress: () => {
                            // Clear form
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            // Navigate back to settings
                            router.replace("/(tabs)/settings");
                        },
                    },
                ]);
            } else {
                // Handle different types of errors with appropriate modals
                if (result.message.includes('weak') || result.message.includes('stronger')) {
                    displayErrorModal("Weak Password", "Please choose a stronger password with a mix of letters, numbers, and symbols.");
                } else if (result.message.includes('incorrect')) {
                    displayErrorModal("Invalid Password", "Current password is incorrect. Please try again.");
                } else {
                    displayErrorModal("Password Change Failed", result.message);
                }
            }
        } catch (error) {
            displayErrorModal("Unexpected Error", "An unexpected error occurred. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => router.replace("/(tabs)/settings")}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Change Password</Text>
            </View>

            {/* Form */}
            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showCurrentPassword}
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                        <Ionicons
                            name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showNewPassword}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                        <Ionicons
                            name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!showConfirmPassword}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        <Ionicons
                            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>


                <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.buttonText}>Changing Password...</Text>
                        </View>
                    ) : (
                        <Text style={styles.buttonText}>Save Password</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Error Modal */}
            <ErrorModal
                visible={showErrorModal}
                title={errorModalData.title}
                message={errorModalData.message}
                type={errorModalData.type}
                onClose={hideErrorModal}
            />
        </View>
    );
}

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
    buttonDisabled: {
        opacity: 0.6,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    passwordContainer: {
        position: "relative",
        width: "100%",
        marginBottom: 20,
    },
    passwordInput: {
        width: "100%",
        height: 45,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingRight: 45,
        backgroundColor: "#fff",
    },
    eyeIcon: {
        position: "absolute",
        right: 12,
        top: 12,
        padding: 2,
    },
});
