import { StaffMapSection } from "../pages/StaffMapSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Route, Save, Edit } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { useUpdateBin } from "@/hooks/useUpdateBin";
import { useState } from "react";
import { toast } from "sonner";

export function MapTab() {
  const { wasteBins, loading, error, bin1Data, dynamicBinLocations } = useRealTimeData();
  const { updateBin, isLoading: isUpdating, error: updateError } = useUpdateBin();
  
  // Form state for updating bin details
  const [binForm, setBinForm] = useState({
    binName: "",
    binType: "",
    mainLocation: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBinId, setSelectedBinId] = useState<string>("");

  // Use ONLY real-time bin locations from database - no hardcoded coordinates
  const updatedLocationData =
    dynamicBinLocations.length > 0
      ? dynamicBinLocations.map((bin) => ({
          id: bin.id,
          name: bin.name,
          lat: bin.position[0].toString(),
          lng: bin.position[1].toString(),
          status: bin.status,
          level: bin.level,
          lastCollected: bin.lastCollection,
          binData: bin,
        }))
      : []; // No fallback to hardcoded coordinates - only show real-time data

  // Calculate summary statistics
  const criticalBins = updatedLocationData.filter((location) => location.status === "critical").length;
  const warningBins = updatedLocationData.filter((location) => location.status === "warning").length;
  const normalBins = updatedLocationData.filter((location) => location.status === "normal").length;

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setBinForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBinId) {
      toast.error("Please select a bin to update");
      return;
    }

    try {
      const success = await updateBin(selectedBinId, binForm);
      
      if (success) {
        toast.success("Bin details updated successfully!");
        setIsEditing(false);
        setSelectedBinId("");
        // Reset form
        setBinForm({
          binName: "",
          binType: "",
          mainLocation: ""
        });
      } else {
        toast.error("Failed to update bin details");
      }
    } catch (error) {
      toast.error("An error occurred while updating bin details");
      console.error("Update error:", error);
    }
  };

  // Load bin data for editing (called when clicking on map bin)
  const loadBinForEdit = (bin: any) => {
    setBinForm({
      binName: bin.name || bin.binData?.name || "",
      binType: bin.type || bin.binData?.type || "",
      mainLocation: bin.mainLocation || bin.binData?.mainLocation || ""
    });
    setSelectedBinId(bin.id || "");
    setIsEditing(true);
  };

  // Function to be called from map component when bin is clicked
  const handleBinClick = (binId: string) => {
    const selectedBin = updatedLocationData.find(bin => bin.id === binId);
    if (selectedBin) {
      loadBinForEdit(selectedBin);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Map View</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StaffMapSection onBinClick={handleBinClick} />
        </div>

        <div className="space-y-4">
          {/* Real-time Status Summary */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Real-time Status
                {error && <span className="text-sm text-red-500">(Error)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Normal</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{normalBins}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Warning</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningBins}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalBins}</div>
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-600 dark:text-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Central Plaza</span>
                  <span className="font-medium">5 Mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Park Avenue</span>
                  <span className="font-medium">7 Mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mall District</span>
                  <span className="font-medium">10 Mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Residential</span>
                  <span className="font-medium">9 Mins</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bin Update Form */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Edit className="w-4 h-4" />
                 Bin Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selected Bin Info */}
                {selectedBinId && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Editing: {binForm.binName || `Bin ${selectedBinId}`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="binName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bin Name
                    </Label>
                    <Input
                      id="binName"
                      type="text"
                      value={binForm.binName}
                      onChange={(e) => handleInputChange("binName", e.target.value)}
                      placeholder="Enter bin name"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="binType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bin Type
                    </Label>
                    <Select value={binForm.binType} onValueChange={(value) => handleInputChange("binType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bin type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Waste</SelectItem>
                        <SelectItem value="recyclable">Recyclable</SelectItem>
                        <SelectItem value="organic">Organic</SelectItem>
                        <SelectItem value="hazardous">Hazardous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainLocation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Main Location
                  </Label>
                  <Select value={binForm.mainLocation} onValueChange={(value) => handleInputChange("mainLocation", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select main location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central-plaza">Central Plaza</SelectItem>
                      <SelectItem value="park-avenue">Park Avenue</SelectItem>
                      <SelectItem value="mall-district">Mall District</SelectItem>
                      <SelectItem value="residential">Residential Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isUpdating || !selectedBinId}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating ? "Updating..." : "Save Changes"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedBinId("");
                      setBinForm({
                        binName: "",
                        binType: "",
                        mainLocation: ""
                      });
                    }}
                    className="flex-1"
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Error Display */}
                {updateError && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {updateError}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
