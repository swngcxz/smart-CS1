export interface Collector {
  id: string;
  name: string;
  phone?: string;
}

export interface Schedule {
  id?: string;
  location: string;
  serviceType: "collection" | "maintenance";
  type: string;
  time: string;
  date: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  capacity?: string;
  collector?: Collector;
  truckPlate?: string;
  notes?: string;
  contactPerson?: string;
  start_collected?: string;
  end_collected?: string;
  priority?: "Low" | "Normal" | "High";
}
