import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAvailableBins, useRegisterBin, BinRegistrationData } from "@/hooks/useBinApi";

interface AddBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBinRegistered?: (binId: string) => void;
}

// Available locations - moved outside component to avoid recreation
const AVAILABLE_LOCATIONS = [
  "Central Plaza",
  "Park Avenue", 
  "Mall District",
  "Residential Area"
] as const;

export function AddBinModal({ isOpen, onClose, onBinRegistered }: AddBinModalProps) {
  const [selectedBinId, setSelectedBinId] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [customLocation, setCustomLocation] = useState<string>("");
  const [assignedLocation, setAssignedLocation] = useState<string>(AVAILABLE_LOCATIONS[0]);
  
  const { availableBins, fetchAvailableBins, isLoading: loadingBins, error: binsError } = useAvailableBins();
  const { registerBin, isLoading: registeringBin, error: registerError } = useRegisterBin();

  // Reset form fields - extracted to avoid duplication
  const resetForm = useCallback(() => {
    setSelectedBinId("");
    setCustomName("");
    setCustomLocation("");
    setAssignedLocation(AVAILABLE_LOCATIONS[0]);
  }, []);

  // Fetch available bins when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableBins(true); // Force refresh when modal opens
      resetForm(); // Reset form when modal opens
    }
  }, [isOpen]); // Remove function dependencies to prevent infinite loops

  // Get selected bin data
  const selectedBin = availableBins.find(bin => bin.binId === selectedBinId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedBinId) {
      toast.error("Please select a bin to register");
      return;
    }

    try {
      // Register the selected bin
      const registrationData: BinRegistrationData = {
        binId: selectedBinId,
        customName: customName.trim() || undefined,
        customLocation: customLocation.trim() || undefined,
        assignedLocation: assignedLocation
      };

      const result = await registerBin(registrationData);

      resetForm(); // Use the resetForm function

      toast.success(`Bin ${result.binId} registered successfully for monitoring!`);
      
      // Notify parent component that bin was registered
      if (onBinRegistered) {
        onBinRegistered(result.binId);
      }
      
      onClose();
    } catch (error) {
      console.error("Error registering bin:", error);
      toast.error(registerError || (error instanceof Error ? error.message : "Failed to register bin. Please try again."));
    }
  };

  const handleClose = () => {
    if (!registeringBin) {
      resetForm(); // Use the resetForm function
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Register Bin for Monitoring</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="binSelect" className="text-sm font-medium">
              Select Bin from Firebase
            </Label>
            <Select
              value={selectedBinId}
              onValueChange={setSelectedBinId}
              disabled={registeringBin || loadingBins}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingBins ? "Loading bins..." : "Select a bin to register"} />
              </SelectTrigger>
              <SelectContent>
                {availableBins.length === 0 && !loadingBins && !binsError && (
                  <SelectItem value="no-bins" disabled>No bins available</SelectItem>
                )}
                {availableBins.map((bin) => (
                  <SelectItem key={bin.binId} value={bin.binId}>
                    <div className="flex flex-col">
                      <span className="font-medium">{bin.name || bin.binId}</span>
                      <span className="text-xs text-gray-500">{bin.location}</span>
                      <span className="text-xs text-gray-400">Level: {bin.bin_level}% | Type: {bin.type}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {binsError && (
              <p className="text-sm text-red-500">{binsError}</p>
            )}
          </div>

          {selectedBin && (
            <>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Selected Bin Details:</h4>
                <div className="text-xs space-y-1">
                  <div><span className="font-medium">ID:</span> {selectedBin.binId}</div>
                  <div><span className="font-medium">Current Level:</span> {selectedBin.bin_level}%</div>
                  <div><span className="font-medium">Location:</span> {selectedBin.location}</div>
                  <div><span className="font-medium">Type:</span> {selectedBin.type}</div>
                  <div><span className="font-medium">GPS Valid:</span> {selectedBin.gps_valid ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customName" className="text-sm font-medium">
                  Custom Name (Optional)
                </Label>
                <Input
                  id="customName"
                  placeholder={`Leave empty to use: ${selectedBin.name || selectedBin.binId}`}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={registeringBin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customLocation" className="text-sm font-medium">
                  Custom Location (Optional)
            </Label>
            <Input
                  id="customLocation"
                  placeholder={`Leave empty to use: ${selectedBin.location}`}
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  disabled={registeringBin}
            />
          </div>

          <div className="space-y-2">
                <Label htmlFor="assignedLocation" className="text-sm font-medium">
                  Assign to Location
            </Label>
            <Select
                  value={assignedLocation}
                  onValueChange={setAssignedLocation}
                  disabled={registeringBin}
            >
              <SelectTrigger>
                    <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                    {AVAILABLE_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
                <p className="text-xs text-gray-500">
                  This bin will appear in the selected location section
                </p>
          </div>
            </>
          )}

          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={registeringBin}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700 text-white" 
              disabled={registeringBin || loadingBins || !selectedBinId}
            >
              {registeringBin ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Registering...
                </>
              ) : (
                "Register Bin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
