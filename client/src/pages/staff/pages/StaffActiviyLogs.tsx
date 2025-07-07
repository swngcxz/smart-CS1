import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Trash2 } from "lucide-react";

const initialActivities = [
  {
    id: 1,
    time: "09:30 AM",
    activity: "Route optimization completed",
    user: "System",
    assignment: "All Zones",
  },
  {
    id: 2,
    time: "09:15 AM",
    activity: "Bin #A-12 marked as full",
    user: "John Smith",
    assignment: "Zone A - Downtown",
  },
  {
    id: 3,
    time: "09:00 AM",
    activity: "Staff member John started shift",
    user: "HR System",
    assignment: "Zone B - North",
  },
  {
    id: 4,
    time: "08:45 AM",
    activity: "Collection completed at Central Plaza",
    user: "Maria Garcia",
    assignment: "Zone C - Central",
  },
  {
    id: 5,
    time: "08:30 AM",
    activity: "Maintenance scheduled for Bin #B-08",
    user: "David Johnson",
    assignment: "Zone D - South",
  },
];

export function StaffActivityLogs() {
  const [activities, setActivities] = useState(initialActivities);

  const handleDeleteActivity = (id: number) => {
    setActivities(activities.filter((activity) => activity.id !== id));
  };

  const handleDeleteAll = () => {
    setActivities([]);
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            Recent Activity
          </CardTitle>
          {activities.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No activities to display</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Time</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-32">User</TableHead>
                <TableHead className="w-40">Assignment</TableHead>
                <TableHead className="w-16">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </TableCell>
                  <TableCell className="text-sm text-gray-800 dark:text-white font-medium">
                    {activity.activity}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">{activity.user}</TableCell>
                  <TableCell className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {activity.assignment}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
