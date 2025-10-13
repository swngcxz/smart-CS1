import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Camera, Save, X, Mail, Github, Facebook, Loader2, User } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export const ProfileSection = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { user, refreshUser } = useCurrentUser();
  const { userInfo, updateProfileFields, updateUserInfo, getProfileImageUrl } = useUserInfo();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    website: "",
  });
  const [imageUrl, setImageUrl] = useState<string>("");
  const [saving, setSaving] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState({
    google: { connected: false, email: null, name: null, picture: null },
    github: { connected: false, username: null, name: null, avatar: null },
    facebook: { connected: false, name: null, email: null, picture: null },
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (field: string) => setIsEditing(field);

  const handleSave = async (field: string, value: string) => {
    setSaving(field);
    try {
      // Map field names to determine which API to use
      const userInfoFields = ["bio", "website", "location"];
      const userFields = ["name", "phone", "email"];

      if (userInfoFields.includes(field)) {
        // Update userInfo fields (bio, website, location)
        const apiFieldMap: { [key: string]: string } = {
          location: "location",
          bio: "bio",
          website: "website",
        };

        const apiField = apiFieldMap[field];
        if (apiField) {
          const result = await updateProfileFields({
            [apiField]: value,
          });

          if (result.success) {
            setProfile((prev) => ({ ...prev, [field]: value }));
            setIsEditing(null);
            toast({
              title: "Success",
              description: "Profile updated successfully!",
              variant: "success",
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to update profile",
              variant: "destructive",
            });
          }
        }
      } else if (userFields.includes(field)) {
        // Update user table fields (name, phone, email)
        const fieldMapping: { [key: string]: string } = {
          name: "fullName",
          phone: "phone",
          email: "email",
        };

        const backendField = fieldMapping[field] || field;
        const updateData = { [backendField]: value };

        const response = await api.patch("/auth/me", updateData);

        if (response.data.message) {
          setProfile((prev) => ({ ...prev, [field]: value }));
          setIsEditing(null);
          await refreshUser();
          toast({
            title: "Success",
            description: "Profile updated successfully!",
            variant: "success",
          });
        }
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(null);
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to server using userInfo API
      try {
        setSaving("profileImage");
        const formData = new FormData();
        formData.append("profileImage", file);

        const result = await updateUserInfo(formData);
        if (result.success) {
          toast({
            title: "Success",
            description: "Profile picture updated successfully!",
            variant: "success",
          });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update profile picture",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Image upload error:", error);
        toast({
          title: "Error",
          description: "Failed to update profile picture. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSaving(null);
      }
    }
  };
  const triggerFileSelect = () => fileInputRef.current?.click();

  // Fetch connected accounts from API
  const fetchConnectedAccounts = React.useCallback(async () => {
    try {
      const response = await api.get("/auth/connected-accounts");
      if (response.data.success) {
        setConnectedAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
    }
  }, []);

  // Handle unlinking an account
  const handleUnlinkAccount = async (provider: string) => {
    try {
      setLoading(true);
      const response = await api.post("/auth/unlink-account", { provider });
      if (response.data.success) {
        // Update local state
        setConnectedAccounts((prev) => ({
          ...prev,
          [provider]: {
            connected: false,
            email: null,
            name: null,
            picture: null,
            username: null,
            avatar: null,
          },
        }));
        console.log(`${provider} account unlinked successfully`);
      }
    } catch (error) {
      console.error(`Error unlinking ${provider} account:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Handle linking an account (redirect to OAuth provider)
  const handleLinkAccount = (provider: string) => {
    // For now, we'll implement Google OAuth
    if (provider === "google") {
      window.location.href = "/auth/google";
    } else {
      console.log(`Linking ${provider} account - not implemented yet`);
    }
  };

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "),
      email: user.email || "",
      phone: user.phone || "",
      bio: userInfo?.bio || user.bio || "",
      location: userInfo?.address || user.address || "",
      website: userInfo?.website || user.website || "",
    });

    // Set image URL from userInfo or user avatar
    if (userInfo?.profileImagePath) {
      const profileImageUrl = getProfileImageUrl();
      setImageUrl(profileImageUrl || "");
    } else {
      setImageUrl(user.avatarUrl || "");
    }
  }, [user, userInfo]);

  // Separate useEffect for fetching connected accounts
  useEffect(() => {
    if (user) {
      fetchConnectedAccounts();
    }
  }, [user, fetchConnectedAccounts]);

  // Separate useEffect for URL parameter handling
  useEffect(() => {
    // Check for URL parameters (success/error messages)
    const urlParams = new URLSearchParams(window.location.search);
    const linked = urlParams.get("linked");
    const error = urlParams.get("error");

    if (linked) {
      toast({
        title: "Success",
        description: `${linked.charAt(0).toUpperCase() + linked.slice(1)} account linked successfully!`,
        variant: "success",
      });
      // Refresh connected accounts
      setTimeout(() => fetchConnectedAccounts(), 1000);
    } else if (error) {
      const errorMessages = {
        user_not_found: "User not found. Please try again.",
        invalid_token: "Session expired. Please log in again.",
        callback_failed: "Failed to link account. Please try again.",
      };
      toast({
        title: "Error",
        description: errorMessages[error as keyof typeof errorMessages] || "An error occurred.",
        variant: "destructive",
      });
    }

    // Clear URL parameters
    if (linked || error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Dynamic connected accounts data
  const accountsData = [
    {
      name: "Google",
      key: "google",
      icon: <Mail className="w-4 h-4 text-red-500" />,
      linked: connectedAccounts.google.connected,
      value: connectedAccounts.google.email || connectedAccounts.google.name || "",
    },
    {
      name: "GitHub",
      key: "github",
      icon: <Github className="w-4 h-4 text-gray-700 dark:text-white" />,
      linked: connectedAccounts.github.connected,
      value: connectedAccounts.github.username || connectedAccounts.github.name || "",
    },
    {
      name: "Facebook",
      key: "facebook",
      icon: <Facebook className="w-4 h-4 text-blue-600" />,
      linked: connectedAccounts.facebook.connected,
      value: connectedAccounts.facebook.email || connectedAccounts.facebook.name || "",
    },
  ];

  const EditableField = ({
    field,
    value,
    label,
    type = "text",
  }: {
    field: string;
    value: string;
    label: string;
    type?: string;
  }) => {
    const [tempValue, setTempValue] = useState(value);

    // Update tempValue when the actual value changes (e.g., from backend updates)
    useEffect(() => {
      setTempValue(value);
    }, [value]);

    return (
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wide">{label}</Label>
        {isEditing === field ? (
          <div className="space-y-3">
            <div className="relative">
              {field === "bio" ? (
                <textarea
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none focus:border-gray-500 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-900/20 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  rows={3}
                  disabled={saving === field}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <Input
                  type={type}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-900/20 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={saving === field}
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => handleSave(field, tempValue)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-200 dark:hover:shadow-green-900/30"
                disabled={saving === field}
              >
                {saving === field ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-2">Save</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={saving === field}
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <X className="w-4 h-4" />
                <span className="ml-2">Cancel</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <div className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[40px] flex items-center transition-all duration-200 hover:shadow-sm hover:shadow-slate-200 dark:hover:shadow-slate-800">
              {field === "bio" ? (
                value ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed w-full">{value}</p>
                ) : (
                  <span className="text-slate-400 italic text-sm">Tell us about yourself...</span>
                )
              ) : (
                <span className="w-full">{value || <span className="text-slate-400 italic">Not set</span>}</span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(field)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-md border border-slate-200 dark:border-slate-600 rounded-lg p-2"
              disabled={saving === field}
            >
              <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Information</h2>
        </div>
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-200"></div>
              <Avatar className="w-24 h-24 border-2 border-white dark:border-slate-800 shadow-md">
                <AvatarImage src={imageUrl} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-gray-500 to-gray-500 text-white">
                  {(profile.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                onClick={triggerFileSelect}
                size="sm"
                className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0 bg-gray-500 hover:bg-gray-700 shadow-md border border-white dark:border-slate-800 transition-all duration-200"
                disabled={saving === "profileImage"}
              >
                {saving === "profileImage" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{profile.name}</h3>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 px-3 py-1 rounded-md font-medium"
              >
                {(user?.role || "User").charAt(0).toUpperCase() + (user?.role || "User").slice(1)}
              </Badge>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{profile.email}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField field="name" value={profile.name} label="Full Name" />
              <EditableField field="email" value={profile.email} label="Email Address" type="email" />
              <EditableField field="phone" value={profile.phone} label="Phone Number" />
              <EditableField field="location" value={profile.location} label="Location" />
            </div>
            <div className="space-y-3">
              <EditableField field="website" value={profile.website} label="Website" type="url" />
              <EditableField field="bio" value={profile.bio} label="About Me" />
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Connected Accounts</h3>
            <div className="space-y-3">
              {accountsData.map((acc) => (
                <div
                  key={acc.name}
                  className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      {acc.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{acc.name}</h4>
                      {acc.linked ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{acc.value}</p>
                      ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500">Not connected</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={acc.linked ? "outline" : "default"}
                    disabled={loading}
                    onClick={() => (acc.linked ? handleUnlinkAccount(acc.key) : handleLinkAccount(acc.key))}
                    className={`font-medium transition-all duration-200 ${
                      acc.linked
                        ? "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:text-white dark:hover:bg-green-700"
                    }`}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : acc.linked ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
