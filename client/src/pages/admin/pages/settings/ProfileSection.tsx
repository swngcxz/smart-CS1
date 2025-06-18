import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Camera, Save, X } from "lucide-react";
import { Mail, Github, Facebook, Link as LinkIcon } from "lucide-react";
export const ProfileSection = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Software Developer passionate about creating amazing user experiences",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
  });
  const [imageUrl, setImageUrl] = useState<string>(
    "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop&crop=face"
  );
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
      // Here you can also send `file` to your server for saving
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const connectedAccounts = [
    { name: "Google", icon: <Mail className="w-4 h-4 text-red-500" />, linked: true, value: "john.doe@gmail.com" },
    { name: "GitHub", icon: <Github className="w-4 h-4 text-gray-700" />, linked: true, value: "johndoe" },
    { name: "Facebook", icon: <Facebook className="w-4 h-4 text-blue-600" />, linked: false, value: "" },
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

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
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
            <span className="flex-1 p-2 bg-slate-50 rounded-md">{value}</span>
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
          {/* Profile Picture Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={imageUrl} />
                <AvatarFallback className="text-xl">JD</AvatarFallback>
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
              <h3 className="text-lg font-semibold text-slate-900">{profile.name}</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                Admin
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

          <div className="space-y-3 pt-4">
            <Label className="text-sm font-semibold text-slate-700">Connected Accounts</Label>
            <div className="space-y-2">
              {connectedAccounts.map((acc) => (
                <div
                  key={acc.name}
                  className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-md border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    {acc.icon}
                    <span className="font-medium">{acc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {acc.linked ? (
                      <span className="text-sm text-slate-600">{acc.value}</span>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Not linked</span>
                    )}
                    <Button
                      size="sm"
                      variant={acc.linked ? "outline" : "secondary"}
                      className={
                        acc.linked
                          ? "text-red-600 border-red-300 hover:bg-red-50"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }
                    >
                      {acc.linked ? "Unlink" : "Link"}
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
