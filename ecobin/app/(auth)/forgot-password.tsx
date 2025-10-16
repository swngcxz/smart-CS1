import Input from "@/components/fields/Input";
import Label from "@/components/fields/Label";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput } from "react-native";
import { usePasswordReset } from "../../hooks/useAuth";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { 
    requestPasswordReset, 
    verifyOtp, 
    resetPassword, 
    loading, 
    error, 
    clearError 
  } = usePasswordReset();

  const showErrorModalWithMessage = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const hideErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
    clearError();
  };

  const showSuccessModalWithMessage = (message: string) => {
    setErrorMessage(message);
    setShowSuccessModal(true);
  };

  const hideSuccessModal = () => {
    setShowSuccessModal(false);
    setErrorMessage("");
    router.replace("/(auth)/login");
  };

  const handleSubmit = async () => {
    clearError();

    if (!email.trim()) {
      showErrorModalWithMessage("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      showErrorModalWithMessage("Please enter a valid email address");
      return;
    }

    const result = await requestPasswordReset(email.trim());
    
    if (result.success) {
      setStep(2); // Move to OTP step
    } else {
      showErrorModalWithMessage(result.message);
    }
  };

  const handleVerifyOtp = async () => {
    clearError();

    if (!otp.trim()) {
      showErrorModalWithMessage("Please enter the OTP code");
      return;
    }

    if (otp.length !== 6) {
      showErrorModalWithMessage("OTP must be 6 digits");
      return;
    }

    const result = await verifyOtp(email, otp.trim());
    
    if (result.success) {
      setStep(3); // Move to new password step
    } else {
      showErrorModalWithMessage(result.message);
    }
  };

  const handleResetPassword = async () => {
    clearError();

    if (!newPassword.trim()) {
      showErrorModalWithMessage("Please enter a new password");
      return;
    }

    if (!confirmPassword.trim()) {
      showErrorModalWithMessage("Please confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorModalWithMessage("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      showErrorModalWithMessage("Password must be at least 8 characters long");
      return;
    }

    const result = await resetPassword(email, otp, newPassword);
    
    if (result.success) {
      showSuccessModalWithMessage("Password reset successful! You can now log in with your new password.");
    } else {
      showErrorModalWithMessage(result.message);
    }
  };

  const handleResendOtp = async () => {
    clearError();
    const result = await requestPasswordReset(email.trim());
    
    if (result.success) {
      showSuccessModalWithMessage("New OTP code sent to your email");
    } else {
      showErrorModalWithMessage(result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 30,
          backgroundColor: "#fff",
        }}
      >
        {/* Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Title & Description */}
        <View style={styles.upperContainer}>
          <Text style={styles.logo}>
            {step === 1 && "Forgot Password"}
            {step === 2 && "Enter OTP Code"}
            {step === 3 && "Set New Password"}
          </Text>
          <Text style={styles.description}>
            {step === 1 && "Enter your email and we'll send you a 6-digit OTP code to reset your password."}
            {step === 2 && `We've sent a 6-digit code to ${email}. Please enter it below.`}
            {step === 3 && "Enter your new password below."}
          </Text>
        </View>

        {/* Step 1: Email Input */}
        {step === 1 && (
        <View style={styles.InputContainer}>
          <Label>Email</Label>
            <Input 
              placeholder="Enter your email" 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
            />
          </View>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <View style={styles.InputContainer}>
            <Label>OTP Code</Label>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
            />
            <TouchableOpacity onPress={handleResendOtp} style={styles.resendButton}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: New Password Input */}
        {step === 3 && (
          <View style={styles.InputContainer}>
            <Label>New Password</Label>
            <Input 
              placeholder="Enter new password" 
              value={newPassword} 
              onChangeText={setNewPassword} 
              secureTextEntry={true}
            />
            <Label style={{ marginTop: 15 }}>Confirm Password</Label>
            <Input 
              placeholder="Confirm new password" 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              secureTextEntry={true}
            />
        </View>
        )}

        {/* Submit Button */}
        <Button 
          color="#2e7d32" 
          variant="filled" 
          style={{ paddingVertical: 15, marginTop: 20 }} 
          onPress={
            step === 1 ? handleSubmit :
            step === 2 ? handleVerifyOtp :
            handleResetPassword
          }
          disabled={loading}
        >
          {loading ? "Processing..." : 
           step === 1 ? "Send OTP Code" :
           step === 2 ? "Verify OTP" :
           "Reset Password"}
        </Button>

        {/* Back Button for Steps 2 and 3 */}
        {(step === 2 || step === 3) && (
          <TouchableOpacity 
            onPress={() => setStep(step - 1)} 
            style={styles.backStepButton}
          >
            <Text style={styles.backStepText}>← Back</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={hideErrorModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Error</Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle" size={48} color="#f44336" />
              </View>
              <Text style={styles.modalMessage}>{errorMessage}</Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={hideErrorModal}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={hideSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Success</Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              </View>
              <Text style={styles.modalMessage}>{errorMessage}</Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={hideSuccessModal}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 25,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0,
    color: "#000",
  },
  upperContainer: {
    width: "100%",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  description: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    alignSelf: "center",
    marginTop: 10,
    color: "#666",
  },
  InputContainer: {
    width: "100%",
    marginTop: 5,
    gap: 5,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    fontSize: 18,
    color: "#000",
    fontFamily: "Poppins_400Regular",
    letterSpacing: 2,
  },
  resendButton: {
    alignSelf: "center",
    marginTop: 10,
  },
  resendText: {
    color: "#2e7d32",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textDecorationLine: "underline",
  },
  backStepButton: {
    alignSelf: "center",
    marginTop: 20,
    padding: 10,
  },
  backStepText: {
    color: "#2e7d32",
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    textAlign: "center",
  },
  modalBody: {
    padding: 20,
    alignItems: "center",
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 10,
  },
  modalButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
});
