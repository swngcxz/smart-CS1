import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

export function AddStaffModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [role, setRole] = useState("");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("active");

  const handleSubmit = () => {
    if (!name || !email || !contactNumber || !role) return;
    onAdd({
      fullName: name,
      email,
      contactNumber,
      role,
      location: zone,
      status,
      lastActivity: "Just now",
    });
    setName("");
    setEmail("");
    setContactNumber("");
    setRole("");
    setZone("");
    setStatus("active");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Janitor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />

          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger>
              <SelectValue placeholder="Select Route" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Route A">Route A</SelectItem>
              <SelectItem value="Route B">Route B</SelectItem>
              <SelectItem value="Route C">Route C</SelectItem>
              <SelectItem value="All Routes">All Routes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="break">On Break</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSubmit} className="w-full">
            Add Janitor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
