import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { WasteBin } from "@/hooks/useRealTimeData";

interface Janitor {
  id: string;
  fullName: string;
  status: string;
  location: string;
}

interface BinInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  bin: WasteBin | null;
  binData?: any; // Real-time bin data
}

export function BinInfoModal({ isOpen, onClose, bin, binData }: BinInfoModalProps) {
  const [janitors, setJanitors] = useState<Janitor[]>([]);
  const [selectedJanitor, setSelectedJanitor] = useState<string>("");
  const [taskNotes, setTaskNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [janitorsLoading, setJanitorsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  // Fetch current user and available janitors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setJanitorsLoading(true);

        // Fetch current user
        const userResponse = await api.get("/auth/me");
        setCurrentUser({ id: userResponse.data.id, role: userResponse.data.role });

        // Fetch janitors
        const janitorsResponse = await api.get("/api/staff/janitors");
        setJanitors(janitorsResponse.data || []);
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setJanitorsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedJanitor("");
      setTaskNotes("");
    }
  }, [isOpen]);

  const handleAssignTask = async () => {
    if (!bin || !selectedJanitor || selectedJanitor === "loading" || selectedJanitor === "no-janitors") {
      toast({
        title: "Error",
        description: "Please select a janitor",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedJanitorData = janitors.find((j) => j.id === selectedJanitor);

      const taskData = {
        user_id: currentUser?.id,
        bin_id: bin.id,
        bin_location: bin.location,
        bin_status: bin.status,
        bin_level: bin.level,
        assigned_janitor_id: selectedJanitor,
        assigned_janitor_name: selectedJanitorData?.fullName || "Unknown",
        task_note: taskNotes || "Clean the bin",
        activity_type: "task_assignment",
        description: `Task assigned for ${bin.location} bin ${bin.id} - ${bin.wasteType} waste`,
        source: "web_dashboard",
      };

      console.log("Sending task data:", taskData);
      const response = await api.post("/api/activitylogs", taskData);
      console.log("Task assignment response:", response.data);

      toast({
        title: "Success",
        description: "Task assigned successfully",
      });

      onClose();
    } catch (error: any) {
      console.error("Failed to assign task:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      const errorMessage =
        error.response?.data?.error || error.response?.data?.message || error.message || "Failed to assign task";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestedAction = () => {
    if (!bin) return "No action needed at the moment.";

    if (bin.status === "critical") {
      return "Urgent: Bin needs immediate attention";
    } else if (bin.status === "warning") {
      return "Bin should be collected soon";
    } else {
      return "No action needed at the moment.";
    }
  };

  const getGpsStatus = () => {
    if (binData?.gps_valid) {
      return { status: "Online", color: "text-green-600" };
    }
    return { status: "Offline", color: "text-red-600" };
  };

  const getLastCollected = () => {
    if (bin?.id === "bin1" && binData) {
      return "Just now";
    }
    return bin?.lastCollected || "Unknown";
  };

  if (!bin) return null;

  const gpsStatus = getGpsStatus();
  const availableJanitors = janitors.filter((j) => j.status === "active");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[100vh] overflow-hidden">
        <DialogHeader className="pb-0 px-2">
          <DialogTitle className="text-lg">Bin Information - {bin.location}</DialogTitle>
        </DialogHeader>

         <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-100px)] px-2">
           {/* Bin ID and GPS Status */}
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <span className="text-base font-medium">
                 {bin.location} Bin: {bin.id}
               </span>
               {bin.id === "bin1" && (
                 <div className="flex items-center gap-1">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-xs text-green-600 dark:text-green-400 font-regular">
                     Live
                   </span>
                 </div>
               )}
             </div>
             <span className={`text-[10px] font-regular ${gpsStatus.color}`}>GPS: {gpsStatus.status}</span>
           </div>

           {/* Fill Level */}
           <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2">
             <div className="flex items-center justify-between">
               <Label className="text-sm font-medium">Fill Level</Label>
               <Badge
                 className={`text-[10px] px-1.5 py-0.5 ${
                   bin.status === "critical"
                     ? "bg-red-100 text-red-800"
                     : bin.status === "warning"
                     ? "bg-yellow-100 text-yellow-800"
                     : "bg-green-100 text-green-800"
                 }`}
               >
                 {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
               </Badge>
             </div>
             <div className="flex items-center gap-2">
               <Progress value={bin.level} className="flex-1 h-2" />
               <span className="text-sm font-medium">{bin.level}%</span>
             </div>
           </div>

           {/* Last Collected */}
           {/* <div className="flex items-center justify-between text-sm">
             <Label className="font-medium">Last Collected:</Label>
             <span className="text-gray-600">{getLastCollected()}</span>
           </div> */}

          {/* Current Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Weight</Label>
                <span className="text-sm font-medium">{binData?.weight_percent || 0} kg</span>
              </div>
              <Progress
                value={Math.min(binData?.weight_percent || 0, 100)}
                className="h-1.5"
              />
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Height</Label>
                <span className="text-sm font-medium">{binData?.height_percent || bin.level}%</span>
              </div>
              <Progress
                value={binData?.height_percent || bin.level}
                className="h-1.5"
              />
            </div>
          </div>

          {/* Suggested Action */}
          <div>
            <Label className="text-sm font-medium">Suggested Action:</Label>
            <p className="text-sm text-gray-600">{getSuggestedAction()}</p>
          </div>

          {/* Task Assignment Section */}
          <div className="space-y-1 pt-1">
            <h3 className="font-medium text-sm">Assign to Janitor ({availableJanitors.length} available)</h3>

            <div>
              <Select value={selectedJanitor} onValueChange={setSelectedJanitor}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Janitor" />
                </SelectTrigger>
                <SelectContent>
                  {janitorsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading janitors...
                    </SelectItem>
                  ) : availableJanitors.length === 0 ? (
                    <SelectItem value="no-janitors" disabled>
                      No available janitors
                    </SelectItem>
                  ) : (
                    availableJanitors.map((janitor) => (
                      <SelectItem key={janitor.id} value={janitor.id}>
                        {janitor.fullName} - {janitor.location}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0">
              <Label htmlFor="task-notes" className="text-sm">Task Notes (Optional)</Label>
              <Textarea
                id="task-notes"
                placeholder="e.g., Clean the bin."
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                rows={1}
                className="text-xs min-h-[70px] mt-2 pb-5"
              />
            </div>

            <Button
              onClick={handleAssignTask}
              disabled={
                !selectedJanitor ||
                selectedJanitor === "loading" ||
                selectedJanitor === "no-janitors" ||
                isLoading ||
                janitorsLoading
              }
              className="w-full mt-2"
            >
              {isLoading ? "Assigning..." : "Assign Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
