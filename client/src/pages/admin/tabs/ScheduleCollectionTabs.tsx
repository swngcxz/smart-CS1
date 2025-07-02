import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, MapPin, Truck, Plus, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { AddScheduleDialog } from "../pages/AddScheduleDialog";

interface Schedule {
  id: number;
  location: string;
  type: string;
  time: string;
  date: string;
  status: string;
  capacity: string;
}

export function ScheduleCollectionTabs() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSchedulePopupOpen, setIsSchedulePopupOpen] = useState(false);
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<Schedule[]>([]);
  
  const [scheduleData, setScheduleData] = useState<Schedule[]>([
    {
      id: 1,
      location: "Central Plaza",
      type: "Mixed Waste",
      time: "3:00 PM",
      date: "2025-01-02",
      status: "scheduled",
      capacity: "85%"
    },
    {
      id: 2,
      location: "Park Avenue",
      type: "Organic",
      time: "9:00 AM",
      date: "2025-01-03",
      status: "scheduled",
      capacity: "45%"
    },
    {
      id: 3,
      location: "Mall District",
      type: "Recyclable",
      time: "5:00 PM",
      date: "2025-01-02",
      status: "scheduled",
      capacity: "70%"
    },
    {
      id: 4,
      location: "Residential Area",
      type: "Mixed",
      time: "11:00 AM",
      date: "2025-01-01",
      status: "completed",
      capacity: "30%"
    },
    {
      id: 5,
      location: "Industrial Zone",
      type: "Hazardous",
      time: "2:00 PM",
      date: "2024-12-31",
      status: "overdue",
      capacity: "95%"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCapacityColor = (capacity: string) => {
    const numCapacity = parseInt(capacity);
    if (numCapacity >= 80) return "text-red-600";
    if (numCapacity >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date) => {
    return scheduleData.filter(schedule => 
      isSameDay(new Date(schedule.date), date)
    );
  };

  // Handle date click
  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;
    
    const daySchedules = getSchedulesForDate(date);
    if (daySchedules.length > 0) {
      setSelectedDateSchedules(daySchedules);
      setIsSchedulePopupOpen(true);
    }
    setSelectedDate(date);
  };

  // Custom day content to show schedule information directly in calendar
  const dayContent = (day: Date) => {
    const daySchedules = getSchedulesForDate(day);
    const hasSchedules = daySchedules.length > 0;
    
    return (
      <div className="w-full h-full p-1 flex flex-col items-center justify-start min-h-[80px] cursor-pointer">
        <span className="text-sm font-medium mb-1">{day.getDate()}</span>
        
        {hasSchedules && (
          <div className="w-full space-y-1">
            {daySchedules.slice(0, 2).map((schedule, index) => (
              <div
                key={index}
                className={`text-xs p-1 rounded text-center truncate ${
                  schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}
                title={`${schedule.location} - ${schedule.type} at ${schedule.time}`}
              >
                {schedule.location}
              </div>
            ))}
            {daySchedules.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{daySchedules.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleAddSchedule = (newSchedule: Omit<Schedule, 'id'>) => {
    const schedule: Schedule = {
      ...newSchedule,
      id: Math.max(...scheduleData.map(s => s.id), 0) + 1
    };
    setScheduleData([...scheduleData, schedule]);
  };

  return (
    <div className="space-y-6">
     


      {/* Large Calendar Section */}
      <Card className="w-full">
        <CardHeader className="pb-4">
         <CardTitle className="text-2xl">Collection Schedule</CardTitle>
            <div className="flex justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Schedule
        </Button>
    </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            className="w-full rounded-md border pointer-events-auto"
            classNames={{
              months: "flex flex-col w-full space-y-6",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-2 relative items-center mb-4",
              caption_label: "text-xl font-semibold",
              nav: "space-x-2 flex items-center",
              nav_button: "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 border border-gray-300 rounded",
              nav_button_previous: "absolute left-2",
              nav_button_next: "absolute right-2",
              table: "w-full border-collapse space-y-2",
              head_row: "flex w-full border-b pb-2 mb-4",
              head_cell: "text-muted-foreground rounded-md flex-1 font-semibold text-center py-2 text-sm",
              row: "flex w-full mt-2",
              cell: "flex-1 text-center p-1 relative border border-gray-100 min-h-[100px]",
              day: "w-full h-full p-0 font-normal hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-none",
              day_selected: "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary",
              day_today: "bg-accent text-accent-foreground font-bold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-30",
            }}
            components={{
              DayContent: ({ date }) => dayContent(date)
            }}
          />
        </CardContent>
      </Card>

      {/* Schedule Popup Dialog */}
      <Dialog open={isSchedulePopupOpen} onOpenChange={setIsSchedulePopupOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Schedules for {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
            </DialogTitle>
            <DialogDescription>
              {selectedDateSchedules.length} collection{selectedDateSchedules.length > 1 ? 's' : ''} scheduled for this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-80 overflow-y-auto py-4">
            {selectedDateSchedules.map((schedule) => (
              <div key={schedule.id} className="p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{schedule.location}</span>
                    </div>
                    <Badge className={getStatusColor(schedule.status)} variant="secondary">
                      {schedule.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{schedule.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Truck className="h-4 w-4" />
                        <span>{schedule.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {schedule.status === 'completed' ? 'Collected' : 'Expected Capacity'}
                    </span>
                    <div className={`text-sm font-semibold ${getCapacityColor(schedule.capacity)}`}>
                      {schedule.capacity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSchedulePopupOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddScheduleDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddSchedule={handleAddSchedule}
      />
    </div>
  );
}