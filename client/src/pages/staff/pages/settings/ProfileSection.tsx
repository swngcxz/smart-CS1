import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Camera } from "lucide-react";
import { CLOUDINARY_CONFIG } from "../../../../../config/cloudinary";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserInfo } from "@/hooks/useUserInfo";

export const ProfileSection = () => {
  const { user } = useCurrentUser();
  const { userInfo, updateProfileFields, updateUserInfo, getProfileImageUrl, updateProfileImageUrl } = useUserInfo();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        console.log('ProfileSection - Saving userInfo field:', field, 'value:', value, 'apiField:', apiField);
        
        const updateData = { [apiField]: value };
        console.log('ProfileSection - Sending to userInfo API:', updateData);
        
        const result = await updateProfileFields(updateData);
        
        if (result.success) {
          console.log('ProfileSection - userInfo save successful');
          setProfile((prev) => ({ ...prev, [field]: value }));
          alert(`${field} saved successfully!`);
        } else {
          console.error('Failed to save userInfo field:', result.error);
          alert(`Failed to save ${field}: ${result.error}`);
        }
      } else if (userFields.includes(field)) {
        // Update user table fields (name, phone, email) - these should go to /auth/me
        console.log('ProfileSection - Saving user field:', field, 'value:', value);
        alert(`${field} update not implemented yet. This field should be updated via the user profile API.`);
        setProfile((prev) => ({ ...prev, [field]: value }));
      } else {
        // For other fields, update local state only
        console.log('ProfileSection - Field not mapped to any API, updating local state only');
        setProfile((prev) => ({ ...prev, [field]: value }));
        alert(`${field} updated locally (not saved to server)`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save ${field}. Please check your connection and try again.`);
    } finally {
      setSaving(null);
    }
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setSaving('profileImage');

      // 1) Upload the actual image to Cloudinary
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

      const res = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const data = await res.json();
      const secureUrl: string = data.secure_url;

      // 2) Save only the URL in your database (userinfo table)
      const result = await updateProfileImageUrl(secureUrl);
      if (!result.success) {
        console.error('Failed to save image URL:', result.error);
        alert('Failed to save image URL. Please try again.');
        return;
      }

      // Update current state to the Cloudinary URL (not the local preview)
      setImageUrl(secureUrl);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setSaving(null);
    }
  };
  const triggerFileSelect = () => fileInputRef.current?.click();

  useEffect(() => {
    if (!user) return;
    
    console.log('ProfileSection - User data:', user);
    console.log('ProfileSection - UserInfo data:', userInfo);
    
    const profileData = {
      name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "),
      email: user.email || "",
      phone: userInfo?.phone || user.phone || "",
      bio: userInfo?.bio || "",
      location: userInfo?.address || user.address || "",
      website: userInfo?.website || "",
    };
    
    console.log('ProfileSection - Setting profile data:', profileData);
    console.log('ProfileSection - Phone from userInfo:', userInfo?.phone);
    console.log('ProfileSection - Address from userInfo:', userInfo?.address);
    console.log('ProfileSection - Website from userInfo:', userInfo?.website);
    setProfile(profileData);
    
    // Set image URL from userInfo (Cloudinary URL or stored path) or user avatar
    if (userInfo?.profileImageUrl) {
      // Prioritize Cloudinary URL if available
      setImageUrl(userInfo.profileImageUrl);
    } else {
      // Fallback to getProfileImageUrl for backward compatibility
      const resolvedUrl = getProfileImageUrl();
      if (resolvedUrl) {
        setImageUrl(resolvedUrl);
      } else {
        setImageUrl(user.avatarUrl || "");
      }
    }
  }, [user, userInfo, getProfileImageUrl]);

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
    const [isEditing, setIsEditing] = useState(false);
    const prevValueRef = React.useRef(value);
    
    // Update tempValue when value changes from external source
    React.useEffect(() => {
      if (prevValueRef.current !== value && !isEditing) {
        setTempValue(value);
        prevValueRef.current = value;
      }
    }, [value, isEditing]);

    const handleSaveField = async () => {
      if (tempValue !== value) {
        console.log('EditableField - Auto-saving field:', field, 'tempValue:', tempValue);
        await handleSave(field, tempValue);
        prevValueRef.current = tempValue;
      }
      setIsEditing(false);
    };

    const handleCancelField = () => {
      setTempValue(value);
      setIsEditing(false);
    };

    const handleInputChange = (newValue: string) => {
      setTempValue(newValue);
      setIsEditing(true);
    };

    const handleBlur = () => {
      handleSaveField();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && type !== 'textarea') {
        e.preventDefault();
        handleSaveField();
      } else if (e.key === 'Escape') {
        handleCancelField();
      }
    };

    const displayValue = value || "Not set";
    const isEmpty = !value || value.trim() === "";
    const hasChanged = tempValue !== value;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        
        {type === "textarea" ? (
          <Textarea 
            value={tempValue || ""} 
            onChange={(e) => handleInputChange(e.target.value)} 
            className={`flex-1 ${hasChanged ? 'ring-2 ring-blue-500' : ''}`}
            placeholder={`Enter ${label.toLowerCase()}`}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={3}
          />
        ) : (
          <Input 
            type={type} 
            value={tempValue || ""} 
            onChange={(e) => handleInputChange(e.target.value)} 
            className={`flex-1 ${hasChanged ? 'ring-2 ring-blue-500' : ''}`}
            placeholder={`Enter ${label.toLowerCase()}`}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        )}
        
        {/* Show save indicator when changed */}
        {hasChanged && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Press Enter to save, Escape to cancel</span>
          </div>
        )}
        
        {/* Show saving indicator */}
        {saving === field && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
            <span>Saving...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                {user?.role || 'Staff'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField field="name" value={profile.name || ""} label="Full Name" />
            <EditableField field="email" value={profile.email || ""} label="Email" type="email" />
            <EditableField field="phone" value={profile.phone || ""} label="Phone Number" />
            <EditableField field="location" value={profile.location || ""} label="Location" />
            <div className="md:col-span-2">
              <EditableField field="website" value={profile.website || ""} label="Website" type="url" />
            </div>
            <div className="md:col-span-2">
              <EditableField field="bio" value={profile.bio || ""} label="Bio" type="textarea" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


