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
  const [validationError, setValidationError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  const { 
    requestPasswordReset, 
    verifyOtp, 
    resetPassword, 
    loading, 
    error, 
    clearError 
  } = usePasswordReset();


  const showSuccessModalWithMessage = (message: string) => {
    setShowSuccessModal(true);
  };

  const hideSuccessModal = () => {
    setShowSuccessModal(false);
    router.replace("/(auth)/login");
  };

  const handleSubmit = async () => {
    clearError();
    setValidationError("");
    setEmailError(false);

    if (!email.trim()) {
      setValidationError("Please enter your email address");
      setEmailError(true);
      return;
    }

    if (!email.includes("@")) {
      setValidationError("Please enter a valid email address");
      setEmailError(true);
      return;
    }

    const result = await requestPasswordReset(email.trim());
    
    if (result.success) {
      setStep(2); // Move to OTP step
    } else {
      setValidationError(result.message);
    }
  };

  const handleVerifyOtp = async () => {
    clearError();
    setValidationError("");
    setOtpError(false);

    if (!otp.trim()) {
      setValidationError("Please enter the OTP code");
      setOtpError(true);
      return;
    }

    if (otp.length !== 6) {
      setValidationError("OTP must be 6 digits");
      setOtpError(true);
      return;
    }

    const result = await verifyOtp(email, otp.trim());
    
    if (result.success) {
      setStep(3); // Move to new password step
    } else {
      setValidationError(result.message);
      setOtpError(true);
    }
  };

  const handleResetPassword = async () => {
    clearError();
    setValidationError("");
    setNewPasswordError(false);
    setConfirmPasswordError(false);

    if (!newPassword.trim()) {
      setValidationError("Please enter a new password");
      setNewPasswordError(true);
      return;
    }

    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      setNewPasswordError(true);
      return;
    }

    if (!confirmPassword.trim()) {
      setValidationError("Please confirm your new password");
      setConfirmPasswordError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      setNewPasswordError(true);
      setConfirmPasswordError(true);
      return;
    }

    const result = await resetPassword(email, otp, newPassword);
    
    if (result.success) {
      showSuccessModalWithMessage("Password reset successful! You can now log in with your new password.");
    } else {
      setValidationError(result.message);
      setNewPasswordError(true);
      setConfirmPasswordError(true);
    }
  };

  const handleResendOtp = async () => {
    clearError();
    setValidationError("");
    const result = await requestPasswordReset(email.trim());
    
    if (result.success) {
      showSuccessModalWithMessage("New OTP code sent to your email");
    } else {
      setValidationError(result.message);
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
          <Text style={styles.label}>Email</Text>
            <TextInput 
              placeholder="Enter your email" 
              style={[styles.input, emailError && styles.inputError]}
              placeholderTextColor="#999"
              value={email} 
              onChangeText={(text) => {
                setEmail(text);
                if (validationError) setValidationError("");
                if (emailError) setEmailError(false);
              }} 
              keyboardType="email-address" 
            />
            
            {/* Error Display */}
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}
          </View>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <View style={styles.InputContainer}>
            <Text style={styles.label}>OTP Code</Text>
            <TextInput
              style={[styles.otpInput, otpError && styles.inputError]}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                if (validationError) setValidationError("");
                if (otpError) setOtpError(false);
              }}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
            />
            <TouchableOpacity onPress={handleResendOtp} style={styles.resendButton}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
            
            {/* Error Display */}
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}
          </View>
        )}

        {/* Step 3: New Password Input */}
        {step === 3 && (
          <View style={styles.InputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput 
              placeholder="Enter new password" 
              style={[styles.input, newPasswordError && styles.inputError]}
              placeholderTextColor="#999"
              value={newPassword} 
              onChangeText={(text) => {
                setNewPassword(text);
                if (validationError) setValidationError("");
                if (newPasswordError) setNewPasswordError(false);
              }} 
              secureTextEntry={true}
            />
            <Text style={[styles.label, { marginTop: 15 }]}>Confirm Password</Text>
            <TextInput 
              placeholder="Confirm new password" 
              style={[styles.input, confirmPasswordError && styles.inputError]}
              placeholderTextColor="#999"
              value={confirmPassword} 
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (validationError) setValidationError("");
                if (confirmPasswordError) setConfirmPasswordError(false);
              }} 
              secureTextEntry={true}
            />
            
            {/* Error Display */}
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}
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
          </TouchableOpacity>
        )}
      </ScrollView>


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
              <Text style={styles.modalMessage}>Password reset successful! You can now log in with your new password.</Text>
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
  label: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    fontSize: 13,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    fontFamily: "Poppins_400Regular",
  },
  inputError: {
    borderColor: "#f44336",
    borderWidth: 1,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    fontSize: 15,
    color: "#000",
    fontFamily: "Poppins_400Regular",
  },
  
  resendButton: {
    alignSelf: "flex-end",
    marginTop: 5,
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
  errorText: {
    color: "#f44336",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    flex: 1,
    marginRight: 12, 
    marginTop: -20,
  },
});
