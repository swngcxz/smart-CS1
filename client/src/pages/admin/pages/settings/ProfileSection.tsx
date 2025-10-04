import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Camera, Save, X, Mail, Github, Facebook, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserInfo } from "@/hooks/useUserInfo";
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
    facebook: { connected: false, name: null, email: null, picture: null }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (field: string) => setIsEditing(field);
  
  const handleSave = async (field: string, value: string) => {
    setSaving(field);
    try {
      // Map field names to determine which API to use
      const userInfoFields = ['bio', 'website', 'location'];
      const userFields = ['name', 'phone', 'email'];
      
      if (userInfoFields.includes(field)) {
        // Update userInfo fields (bio, website, location)
        const apiFieldMap: { [key: string]: string } = {
          location: 'location',
          bio: 'bio',
          website: 'website'
        };
        
        const apiField = apiFieldMap[field];
        if (apiField) {
          const result = await updateProfileFields({
            [apiField]: value
          });
          
          if (result.success) {
            setProfile((prev) => ({ ...prev, [field]: value }));
            setIsEditing(null);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
          } else {
            setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
            setTimeout(() => setMessage(null), 5000);
          }
        }
      } else if (userFields.includes(field)) {
        // Update user table fields (name, phone, email)
        const fieldMapping: { [key: string]: string } = {
          name: 'fullName',
          phone: 'phone',
          email: 'email'
        };
        
        const backendField = fieldMapping[field] || field;
        const updateData = { [backendField]: value };
        
        const response = await api.patch('/auth/me', updateData);
        
        if (response.data.message) {
          setProfile((prev) => ({ ...prev, [field]: value }));
          setIsEditing(null);
          await refreshUser();
          setMessage({ type: 'success', text: 'Profile updated successfully!' });
          setTimeout(() => setMessage(null), 3000);
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile. Please try again.' 
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(null);
    }
  };
  
  const handleCancel = () => {
    setIsEditing(null);
    setMessage(null); // Clear any existing messages when canceling
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
        setSaving('profileImage');
        const formData = new FormData();
        formData.append('profileImage', file);
        
        const result = await updateUserInfo(formData);
        if (result.success) {
          setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
          setTimeout(() => setMessage(null), 3000);
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to update profile picture' });
          setTimeout(() => setMessage(null), 5000);
        }
      } catch (error: any) {
        console.error('Image upload error:', error);
        setMessage({ type: 'error', text: 'Failed to update profile picture. Please try again.' });
        setTimeout(() => setMessage(null), 5000);
      } finally {
        setSaving(null);
      }
    }
  };
  const triggerFileSelect = () => fileInputRef.current?.click();

  // Fetch connected accounts from API
  const fetchConnectedAccounts = async () => {
    try {
      const response = await api.get('/auth/connected-accounts');
      if (response.data.success) {
        setConnectedAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    }
  };

  // Handle unlinking an account
  const handleUnlinkAccount = async (provider: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/unlink-account', { provider });
      if (response.data.success) {
        // Update local state
        setConnectedAccounts(prev => ({
          ...prev,
          [provider]: {
            connected: false,
            email: null,
            name: null,
            picture: null,
            username: null,
            avatar: null
          }
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
    if (provider === 'google') {
      window.location.href = '/auth/google';
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
    
    // Fetch connected accounts
    fetchConnectedAccounts();
    
    // Check for URL parameters (success/error messages)
    const urlParams = new URLSearchParams(window.location.search);
    const linked = urlParams.get('linked');
    const error = urlParams.get('error');
    
    if (linked) {
      setMessage({ type: 'success', text: `${linked.charAt(0).toUpperCase() + linked.slice(1)} account linked successfully!` });
      // Refresh connected accounts
      setTimeout(() => fetchConnectedAccounts(), 1000);
    } else if (error) {
      const errorMessages = {
        user_not_found: 'User not found. Please try again.',
        invalid_token: 'Session expired. Please log in again.',
        callback_failed: 'Failed to link account. Please try again.'
      };
      setMessage({ type: 'error', text: errorMessages[error as keyof typeof errorMessages] || 'An error occurred.' });
    }
    
    // Clear URL parameters
    if (linked || error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, userInfo, getProfileImageUrl]);

  // Dynamic connected accounts data
  const accountsData = [
    { 
      name: "Google", 
      key: "google",
      icon: <Mail className="w-4 h-4 text-red-500" />, 
      linked: connectedAccounts.google.connected, 
      value: connectedAccounts.google.email || connectedAccounts.google.name || "" 
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
      value: connectedAccounts.facebook.email || connectedAccounts.facebook.name || "" 
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
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        {isEditing === field ? (
          <div className="flex flex-col gap-2">
            {field === 'bio' ? (
              <textarea 
                value={tempValue} 
                onChange={(e) => setTempValue(e.target.value)} 
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                rows={3}
                disabled={saving === field}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <Input 
                type={type} 
                value={tempValue} 
                onChange={(e) => setTempValue(e.target.value)} 
                className="flex-1"
                disabled={saving === field}
              />
            )}
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => handleSave(field, tempValue)} 
                className="bg-green-600 hover:bg-green-700"
                disabled={saving === field}
              >
                {saving === field ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancel}
                disabled={saving === field}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 group">
            <div className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md min-h-[40px]">
              {field === 'bio' ? (
                value ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
                ) : (
                  <span className="text-slate-400 italic text-sm">Not set</span>
                )
              ) : (
                value || <span className="text-slate-400 italic">Not set</span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(field)}
              className="opacity-60 hover:opacity-100 transition-opacity mt-1"
              disabled={saving === field}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={imageUrl} />
                <AvatarFallback className="text-xl">{(profile.name || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                onClick={triggerFileSelect}
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
                disabled={saving === 'profileImage'}
              >
                {saving === 'profileImage' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{profile.name}</h3>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 mt-1"
              >
                {user?.role || 'User'}
              </Badge>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField field="name" value={profile.name} label="Full Name" />
            <EditableField field="email" value={profile.email} label="Email" type="email" />
            <EditableField field="phone" value={profile.phone} label="Phone Number" />
            <EditableField field="location" value={profile.location} label="Location" />
            <div className="md:col-span-2">
              <EditableField field="website" value={profile.website} label="Website" type="url" />
            </div>
            <div className="md:col-span-2">
              <EditableField field="bio" value={profile.bio} label="Bio" />
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="space-y-3 pt-4">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Connected Accounts</Label>
            <div className="space-y-2">
              {accountsData.map((acc) => (
                <div
                  key={acc.name}
                  className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    {acc.icon}
                    <span className="font-medium text-slate-900 dark:text-white">{acc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {acc.linked ? (
                      <span className="text-sm text-slate-600 dark:text-slate-400">{acc.value}</span>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500 italic">Not linked</span>
                    )}
                    <Button
                      size="sm"
                      variant={acc.linked ? "outline" : "secondary"}
                      disabled={loading}
                      onClick={() => acc.linked ? handleUnlinkAccount(acc.key) : handleLinkAccount(acc.key)}
                      className={
                        acc.linked
                          ? "text-red-600 border-red-300 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        acc.linked ? "Unlink" : "Link"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
