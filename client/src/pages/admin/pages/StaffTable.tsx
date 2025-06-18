
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const staffData = [
  {
    id: 1,
    name: "John Smith",
    role: "Collection Driver",
    zone: "Zone A",
    status: "active",
    lastActivity: "2 hours ago",
  },
  {
    id: 2,
    name: "Maria Garcia",
    role: "Supervisor",
    zone: "Zone B",
    status: "active",
    lastActivity: "30 min ago",
  },
  {
    id: 3,
    name: "David Johnson",
    role: "Collection Driver",
    zone: "Zone C",
    status: "offline",
    lastActivity: "1 day ago",
  },
  {
    id: 4,
    name: "Sarah Wilson",
    role: "Maintenance",
    zone: "All Zones",
    status: "active",
    lastActivity: "1 hour ago",
  },
  {
    id: 5,
    name: "Michael Brown",
    role: "Collection Driver",
    zone: "Zone A",
    status: "break",
    lastActivity: "15 min ago",
  },
];

export function StaffTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Staff Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffData.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.name}</TableCell>
                <TableCell>{staff.role}</TableCell>
                <TableCell>{staff.zone}</TableCell>
                <TableCell>
                  <Badge 
                    variant={staff.status === 'active' ? 'default' : staff.status === 'offline' ? 'destructive' : 'secondary'}
                    className={
                      staff.status === 'active' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : staff.status === 'break'
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : ''
                    }
                  >
                    {staff.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500">{staff.lastActivity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
