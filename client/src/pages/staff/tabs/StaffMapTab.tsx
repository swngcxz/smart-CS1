import { StaffMapSection } from "../pages/StaffMapSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Route, Save, Edit, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { useUpdateBin } from "@/hooks/useUpdateBin";
import { useState } from "react";
import { toast } from "sonner";

export function MapTab() {
  const { wasteBins, loading, error, bin1Data, dynamicBinLocations, refresh } = useRealTimeData();
  const { updateBin, isLoading: isUpdating, error: updateError } = useUpdateBin();

  // Form state for updating bin details
  const [binForm, setBinForm] = useState({
    binName: "",
    binType: "",
    mainLocation: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBinId, setSelectedBinId] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState<boolean>(true);

  // Use ONLY real-time bin locations from database - no hardcoded coordinates
  const updatedLocationData =
    dynamicBinLocations && dynamicBinLocations.length > 0
      ? dynamicBinLocations.map((bin) => ({
          id: bin.id,
          name: bin.name,
          lat: bin.position?.[0]?.toString() || '0',
          lng: bin.position?.[1]?.toString() || '0',
          status: bin.status,
          level: bin.level,
          lastCollected: bin.lastCollection,
          binData: bin,
          // Include all the real-time data properties
          position: bin.position,
          weight_kg: bin.weight_kg,
          distance_cm: bin.distance_cm,
          satellites: bin.satellites,
          gps_valid: bin.gps_valid,
          coordinates_source: bin.coordinates_source,
          last_active: bin.last_active,
          gps_timestamp: bin.gps_timestamp,
        }))
      : []; // No fallback to hardcoded coordinates - only show real-time data

  // Calculate summary statistics
  const criticalBins = updatedLocationData.filter((location) => location.status === "critical").length;
  const warningBins = updatedLocationData.filter((location) => location.status === "warning").length;
  const normalBins = updatedLocationData.filter((location) => location.status === "normal").length;

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setBinForm((prev) => ({
      ...prev,
      [field]: value,
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
        // Refresh the real-time data to get updated information
        await refresh();
        setIsEditing(false);
        setSelectedBinId("");
        // Reset form
        setBinForm({
          binName: "",
          binType: "",
          mainLocation: "",
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
    // Map the real-time database structure to form fields
    // Use actual data from Firebase
    setBinForm({
      binName: bin.name || bin.id || "",
      binType: bin.type || "general", // Use actual type from Firebase
      mainLocation: bin.mainLocation || "central-plaza", // Use actual mainLocation from Firebase
    });
    setSelectedBinId(bin.id || "");
    setIsEditing(true);
  };

  // Function to be called from map component when bin is clicked
  const handleBinClick = (binId: string) => {
    console.log('🔍 Bin clicked:', binId);
    console.log('📊 Available bins:', updatedLocationData);
    
    const selectedBin = updatedLocationData.find((bin) => bin.id === binId);
    if (selectedBin) {
      console.log('✅ Selected bin data:', selectedBin);
      loadBinForEdit(selectedBin);
    } else {
      console.warn('⚠️ Bin not found in updatedLocationData:', binId);
    }
  };

  // Handle route selection
  const handleRouteSelect = (route: string) => {
    setSelectedRoute(route);
    toast.success(`${route.charAt(0).toUpperCase() + route.slice(1).replace("-", " ")} route selected`);
  };

  // Toggle location dropdown
  const toggleLocationDropdown = () => {
    setIsLocationDropdownOpen(!isLocationDropdownOpen);
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
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto hover:bg-transparent"
                onClick={toggleLocationDropdown}
              >
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">Location List</CardTitle>
                {isLocationDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </Button>
            </CardHeader>

            <CardContent
              className={`transition-all duration-300 ease-in-out ${
                isLocationDropdownOpen ? "max-h-96 opacity-100 p-4" : "max-h-0 opacity-0 overflow-hidden p-0"
              }`}
            >
              <div className="space-y-3">
                {/* Central Plaza Route */}
                <Button
                  className={`w-full justify-start text-left h-auto p-4 border-2 transition-all duration-200 hover:bg-transparent
        ${
          selectedRoute === "central-plaza"
            ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
            : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
        }`}
                  onClick={() => handleRouteSelect("central-plaza")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 font-semibold text-sm">Central Plaza</div>
                    <Badge
                      className={`text-xs ${
                        selectedRoute === "central-plaza" ? "bg-green-700 text-white" : "bg-gray-300 text-black"
                      }`}
                    >
                      Active
                    </Badge>
                  </div>
                </Button>

                {/* Park Avenue Route */}
                <Button
                  className={`w-full justify-start text-left h-auto p-4 border-2 transition-all duration-200 hover:bg-transparent
        ${
          selectedRoute === "park-avenue"
            ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
            : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
        }`}
                  onClick={() => handleRouteSelect("park-avenue")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 font-semibold text-sm">Park Avenue</div>
                    <Badge
                      className={`text-xs ${
                        selectedRoute === "park-avenue" ? "bg-green-700 text-white" : "bg-gray-300 text-black"
                      }`}
                    >
                      Active
                    </Badge>
                  </div>
                </Button>

                {/* Mall District Route */}
                <Button
                  className={`w-full justify-start text-left h-auto p-4 border-2 transition-all duration-200 hover:bg-transparent
        ${
          selectedRoute === "mall-district"
            ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
            : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
        }`}
                  onClick={() => handleRouteSelect("mall-district")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 font-semibold text-sm">Mall District</div>
                    <Badge
                      className={`text-xs ${
                        selectedRoute === "mall-district" ? "bg-green-700 text-white" : "bg-gray-300 text-black"
                      }`}
                    >
                      Active
                    </Badge>
                  </div>
                </Button>

                {/* Residential Route */}
                <Button
                  className={`w-full justify-start text-left h-auto p-4 border-2 transition-all duration-200 hover:bg-transparent
        ${
          selectedRoute === "residential"
            ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
            : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
        }`}
                  onClick={() => handleRouteSelect("residential")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 font-semibold text-sm">Residential Area</div>
                    <Badge
                      className={`text-xs ${
                        selectedRoute === "residential" ? "bg-green-700 text-white" : "bg-gray-300 text-black"
                      }`}
                    >
                      Active
                    </Badge>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>


          {/* Bin Update Form */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">Bin Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

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
                  <Select
                    value={binForm.mainLocation}
                    onValueChange={(value) => handleInputChange("mainLocation", value)}
                  >
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
                        mainLocation: "",
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
