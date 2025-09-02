import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Camera, Save, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const ProfileSection = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    website: "",
  });
  const [imageUrl, setImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (field: string) => setIsEditing(field);
  const handleSave = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setIsEditing(null);
  };
  const handleCancel = () => setIsEditing(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const triggerFileSelect = () => fileInputRef.current?.click();

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "),
      email: user.email || "",
      phone: user.phone || "",
      bio: "",
      location: user.address || "",
      website: "",
    });
    setImageUrl(user.avatarUrl || "");
  }, [user]);

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
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        {isEditing === field ? (
          <div className="flex items-center gap-2">
            <Input type={type} value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={() => handleSave(field, tempValue)} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md">
              {value}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(field)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
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
              >
                <Camera className="w-4 h-4" />
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
        </CardContent>
      </Card>
    </div>
  );
};


