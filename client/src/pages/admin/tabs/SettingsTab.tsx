import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SettingsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="system-name">System Name</Label>
              <Input id="system-name" placeholder="Smart Waste Management" />
            </div>
            <div>
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input id="admin-email" placeholder="admin@example.com" type="email" />
            </div>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
