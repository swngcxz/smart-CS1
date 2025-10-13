import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";

export function AddStaffModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [role, setRole] = useState("janitor");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("active");

  // Validation states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    if (!phPhoneRegex.test(contactNumber.replace(/\s+/g, ""))) {
      return "Please enter a valid Philippines mobile number (e.g., +639123456789 or 09123456789)";
    }
    return "";
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

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
        contactNumber: contactNumber.replace(/\s+/g, ""),
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
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-left mb-2">Add New Staff</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <Input
                  placeholder="Enter first and last name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors["name"]) {
                      setErrors((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                  className={`h-10 ${
                    errors["name"] ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-green-500"
                  }`}
                />
                {errors["name"] && <p className="text-red-500 text-xs mt-1">{errors["name"]}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <Input
                  placeholder="Enter email address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors["email"]) {
                      setErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  className={`h-10 ${
                    errors["email"] ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-green-500"
                  }`}
                />
                {errors["email"] && <p className="text-red-500 text-xs mt-1">{errors["email"]}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative">
                  <Input
                    placeholder="Enter password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors["password"]) {
                        setErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    className={`h-10 pr-10 ${
                      errors["password"]
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-green-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors["password"] && <p className="text-red-500 text-xs mt-1">{errors["password"]}</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                <Input
                  placeholder="Enter contact number"
                  value={contactNumber}
                  onChange={(e) => {
                    setContactNumber(e.target.value);
                    if (errors["contactNumber"]) {
                      setErrors((prev) => ({ ...prev, contactNumber: "" }));
                    }
                  }}
                  className={`h-10 ${
                    errors["contactNumber"]
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-green-500"
                  }`}
                />
                {errors["contactNumber"] && <p className="text-red-500 text-xs mt-1">{errors["contactNumber"]}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-green-500">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="janitor">Janitor</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Route</label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-green-500">
                    <SelectValue placeholder="Select Route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Route A">Route A</SelectItem>
                    <SelectItem value="Route B">Route B</SelectItem>
                    <SelectItem value="Route C">Route C</SelectItem>
                    <SelectItem value="All Routes">All Routes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit Button - Right Aligned */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-800 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Staff"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
