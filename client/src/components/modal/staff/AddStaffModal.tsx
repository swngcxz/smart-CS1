import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AddStaffModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [role, setRole] = useState("janitor");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("active");
  
  // Validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateFullName = (name) => {
    if (!name.trim()) {
      return "Full name is required";
    }
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    if (!nameRegex.test(name.trim())) {
      return "Full name must be 2-50 characters and contain only letters and spaces";
    }
    const nameWords = name.trim().split(/\s+/);
    if (nameWords.length < 2) {
      return "Full name must include both first and last name";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    return "";
  };

  const validateContactNumber = (contactNumber) => {
    if (!contactNumber.trim()) {
      return "Contact number is required";
    }
    // Accept formats: +63XXXXXXXXXX, 09XXXXXXXXX, 9XXXXXXXXX
    const phPhoneRegex = /^(\+63|0)?9\d{9}$/;
    if (!phPhoneRegex.test(contactNumber.replace(/\s+/g, ''))) {
      return "Please enter a valid Philippines mobile number (e.g., +639123456789 or 09123456789)";
    }
    return "";
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    const nameError = validateFullName(name);
    if (nameError) newErrors["name"] = nameError;
    
    const emailError = validateEmail(email);
    if (emailError) newErrors["email"] = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors["password"] = passwordError;
    
    const contactError = validateContactNumber(contactNumber);
    if (contactError) newErrors["contactNumber"] = contactError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        fullName: name.trim(),
        email: email.trim(),
        password,
        contactNumber: contactNumber.replace(/\s+/g, ''),
        role,
        location: zone,
        status,
        lastActivity: "Just now",
      });
      
      // Reset form only on success
      setName("");
      setEmail("");
      setPassword("");
      setContactNumber("");
      setRole("janitor");
      setZone("");
      setStatus("active");
      setErrors({});
    } catch (error) {
      console.error("Error adding staff:", error);
      // Keep form data on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setName("");
    setEmail("");
    setPassword("");
    setContactNumber("");
    setRole("janitor");
    setZone("");
    setStatus("active");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Janitor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input 
              placeholder="Full Name (First Last)" 
              value={name} 
              onChange={(e) => {
                setName(e.target.value);
                if (errors["name"]) {
                  setErrors(prev => ({ ...prev, name: "" }));
                }
              }}
              className={errors["name"] ? "border-red-500" : ""}
            />
            {errors["name"] && (
              <Alert className="mt-1">
                <AlertDescription className="text-red-600 text-sm">
                  {errors["name"]}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Input 
              placeholder="Email" 
              type="email" 
              value={email} 
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors["email"]) {
                  setErrors(prev => ({ ...prev, email: "" }));
                }
              }}
              className={errors["email"] ? "border-red-500" : ""}
            />
            {errors["email"] && (
              <Alert className="mt-1">
                <AlertDescription className="text-red-600 text-sm">
                  {errors["email"]}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Input
              placeholder="Password (8+ chars, uppercase, lowercase, number)"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors["password"]) {
                  setErrors(prev => ({ ...prev, password: "" }));
                }
              }}
              className={errors["password"] ? "border-red-500" : ""}
            />
            {errors["password"] && (
              <Alert className="mt-1">
                <AlertDescription className="text-red-600 text-sm">
                  {errors["password"]}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Input
              placeholder="Contact Number (+639123456789 or 09123456789)"
              value={contactNumber}
              onChange={(e) => {
                setContactNumber(e.target.value);
                if (errors["contactNumber"]) {
                  setErrors(prev => ({ ...prev, contactNumber: "" }));
                }
              }}
              className={errors["contactNumber"] ? "border-red-500" : ""}
            />
            {errors["contactNumber"] && (
              <Alert className="mt-1">
                <AlertDescription className="text-red-600 text-sm">
                  {errors["contactNumber"]}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="janitor">Janitor</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger>
              <SelectValue placeholder="Select Route" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Route A">Route A</SelectItem>
              <SelectItem value="Route B">Route B</SelectItem>
              <SelectItem value="Route C">Route C</SelectItem>
              <SelectItem value="All Routes">All Routes</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="w-full bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding..." : "Add Janitor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
