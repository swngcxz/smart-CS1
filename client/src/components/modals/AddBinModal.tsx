import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AddBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBin: (binData: BinFormData) => void;
}

export interface BinFormData {
  name: string;
  location: string;
  binType: string;
}

export function AddBinModal({ isOpen, onClose, onAddBin }: AddBinModalProps) {
  const [formData, setFormData] = useState<BinFormData>({
    name: "",
    location: "",
    binType: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof BinFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Bin name is required");
      return;
    }

    if (!formData.location.trim()) {
      toast.error("Location is required");
      return;
    }

    if (!formData.binType.trim()) {
      toast.error("Bin type is required");
      return;
    }

    setIsLoading(true);

    try {
      // Call the parent component's onAddBin function
      await onAddBin(formData);

      // Reset form
      setFormData({
        name: "",
        location: "",
        binType: "",
      });

      toast.success("Bin added successfully!");
      onClose();
    } catch (error) {
      console.error("Error adding bin:", error);
      toast.error("Failed to add bin. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: "",
        location: "",
        binType: "",
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add New Bin</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Bin Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Bin-001"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="binType" className="text-sm font-medium">
              Bin Type
            </Label>
            <Select
              value={formData.binType}
              onValueChange={(value) => handleInputChange("binType", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Waste</SelectItem>
                <SelectItem value="recyclable">Recyclable</SelectItem>
                <SelectItem value="organic">Organic</SelectItem>
                <SelectItem value="hazardous">Hazardous</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Central Plaza, Naga City"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Adding...
                </>
              ) : (
                "Add Bin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddBinModal;
