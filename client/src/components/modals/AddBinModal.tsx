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
const AVAILABLE_LOCATIONS = ["Central Plaza", "Park Avenue", "Mall District", "Residential Area"] as const;

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
  const selectedBin = availableBins.find((bin) => bin.binId === selectedBinId);

  // Auto-populate form when bin is selected
  useEffect(() => {
    if (selectedBin) {
      setCustomName(selectedBin.name || selectedBin.binId);
      setCustomLocation(selectedBin.location || "");
      // Set assigned location based on bin's current location
      const matchingLocation = AVAILABLE_LOCATIONS.find((loc) =>
        selectedBin.location?.toLowerCase().includes(loc.toLowerCase())
      );
      if (matchingLocation) {
        setAssignedLocation(matchingLocation);
      }
    }
  }, [selectedBin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customName.trim()) {
      toast.error("Bin name is required");
      return;
    }

    try {
      // Register the bin
      const registrationData: BinRegistrationData = {
        binId: selectedBinId || "new-bin", // Use selected bin or create new one
        customName: customName.trim() || undefined,
        customLocation: customLocation.trim() || undefined,
        assignedLocation: assignedLocation,
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
      toast.error(
        registerError || (error instanceof Error ? error.message : "Failed to register bin. Please try again.")
      );
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
      <DialogContent className="sm:max-w-[500px] max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add New Bin</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="binSelect" className="text-sm font-medium">
              Select Bin from Firebase
            </Label>
            <Select value={selectedBinId} onValueChange={setSelectedBinId} disabled={registeringBin || loadingBins}>
              <SelectTrigger>
                <SelectValue placeholder={"Select a bin"} />
              </SelectTrigger>
              <SelectContent>
                {availableBins.length === 0 && !loadingBins && !binsError && (
                  <SelectItem value="no-bins" disabled>
                    No bins available
                  </SelectItem>
                )}
                {availableBins.map((bin) => (
                  <SelectItem key={bin.binId} value={bin.binId}>
                    <div className="flex flex-col">
                      <span className="font-medium">{bin.name || bin.binId}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {binsError && <p className="text-sm text-red-500">{binsError}</p>}
          </div>

          {selectedBin && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 text-base">
                    {selectedBin.binId.charAt(0).toUpperCase() + selectedBin.binId.slice(1)}
                  </h4>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 text-xs font-medium">Live</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-regular rounded-full ${
                    selectedBin.bin_level < 80 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedBin.bin_level < 80 ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Fill Level Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 text-xs">Fill Level:</span>
                  <span className="text-gray-900 font-medium text-sm">{selectedBin.bin_level}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 text-xs">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 text-xs"
                    style={{ width: `${selectedBin.bin_level}%` }}
                  ></div>
                </div>
              </div>

              {/* Bottom Details Row */}
              <div className="flex items-center justify-between">
                <div className="text-gray-700 text-xs">
                  Location:{" "}
                  <span className="font-regular">
                    {selectedBin.location?.charAt(0).toUpperCase() + selectedBin.location?.slice(1)}
                  </span>
                </div>
                <div className="text-gray-700 text-xs">
                  Type:{" "}
                  <span className="font-regular">
                    {selectedBin.type?.charAt(0).toUpperCase() + selectedBin.type?.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customName" className="text-sm font-medium">
              Bin Name
            </Label>
            <Input
              id="customName"
              placeholder="e.g. Park Avenue Bin 1"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={registeringBin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedLocation" className="text-sm font-medium">
              Location
            </Label>
            <Select value={assignedLocation} onValueChange={setAssignedLocation} disabled={registeringBin}>
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
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={registeringBin}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={registeringBin || loadingBins}
            >
              {registeringBin ? (
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
