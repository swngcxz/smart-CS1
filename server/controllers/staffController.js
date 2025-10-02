const StaffModel = require("../models/staffModel");
const ScheduleModel = require("../models/scheduleModel");
const { hashPassword } = require("../utils/authUtils");
const { db } = require("../models/firebase");

const staffController = {
  async create(req, res) {
    try {
      const { fullName, email, password, contactNumber, role, location, status } = req.body;
      
      // Validate required fields
      if (!fullName || !email || !password) {
        return res.status(400).json({ error: "Full name, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await db.collection("users").where("email", "==", email).get();
      if (!existingUser.empty) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create user data for users collection
      const userData = {
        fullName,
        email,
        password: hashedPassword,
        contactNumber: contactNumber || "",
        role: role || "janitor",
        location: location || "General",
        status: status || "active",
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: "Recently active"
      };

      // Save to users collection instead of staff collection
      const docRef = await db.collection("users").add(userData);
      
      res.status(201).json({ message: "Staff created successfully", id: docRef.id });
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const staff = await StaffModel.getAllStaff();
      // Filter out admin roles
      const filteredStaff = staff.filter(member => 
        member.role && 
        member.role.toLowerCase() !== 'admin' && 
        member.role.toLowerCase() !== 'administrator'
      );
      res.json(filteredStaff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getJanitors(req, res) {
    try {
      // Get janitors using role-based filtering from users collection
      const janitors = await StaffModel.getUsersByRole('janitor');
      
      // Normalize the data structure to ensure consistency
      const normalizedJanitors = janitors.map(janitor => ({
        id: janitor.id,
        fullName: janitor.fullName,
        email: janitor.email,
        contactNumber: janitor.contactNumber || 'N/A',
        role: janitor.role,
        location: janitor.location || 'General',
        status: janitor.status || 'active',
        lastActivity: janitor.lastActivity || 'Recently active'
      }));
      
      console.log(`Found ${normalizedJanitors.length} janitors from users collection`);
      console.log('Janitors:', normalizedJanitors.map(j => ({ name: j.fullName, role: j.role, contactNumber: j.contactNumber })));
      
      res.json(normalizedJanitors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getDrivers(req, res) {
    try {
      // Get drivers using role-based filtering from users collection
      const drivers = await StaffModel.getUsersByRole('driver');
      
      // Normalize the data structure to ensure consistency
      const normalizedDrivers = drivers.map(driver => ({
        id: driver.id,
        name: driver.fullName, // Use 'name' to match frontend expectation
        fullName: driver.fullName,
        email: driver.email,
        phone: driver.contactNumber || 'N/A',
        contactNumber: driver.contactNumber || 'N/A',
        role: driver.role,
        location: driver.location || 'General',
        status: driver.status || 'active',
        lastActivity: driver.lastActivity || 'Recently active'
      }));
      
      console.log(`Found ${normalizedDrivers.length} drivers from users collection`);
      console.log('Drivers:', normalizedDrivers.map(d => ({ name: d.fullName, role: d.role, phone: d.phone })));
      
      res.json(normalizedDrivers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getMaintenanceWorkers(req, res) {
    try {
      // Get maintenance workers using role-based filtering from users collection
      const maintenanceWorkers = await StaffModel.getUsersByRole('maintenance');
      
      // Normalize the data structure to ensure consistency
      const normalizedMaintenanceWorkers = maintenanceWorkers.map(worker => ({
        id: worker.id,
        name: worker.fullName, // Use 'name' to match frontend expectation
        fullName: worker.fullName,
        email: worker.email,
        phone: worker.contactNumber || 'N/A',
        contactNumber: worker.contactNumber || 'N/A',
        role: worker.role,
        location: worker.location || 'General',
        status: worker.status || 'active',
        lastActivity: worker.lastActivity || 'Recently active'
      }));
      
      console.log(`Found ${normalizedMaintenanceWorkers.length} maintenance workers from users collection`);
      console.log('Maintenance Workers:', normalizedMaintenanceWorkers.map(w => ({ name: w.fullName, role: w.role, phone: w.phone })));
      
      res.json(normalizedMaintenanceWorkers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async seedSampleData(req, res) {
    try {
      await StaffModel.seedSampleJanitors();
      res.json({ message: "Sample janitor data seeded successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async seedCurrentUser(req, res) {
    try {
      // Add the current logged-in janitor user to staff collection
      const currentUser = req.user; // This should come from auth middleware
      if (currentUser && currentUser.role === 'janitor') {
        await StaffModel.createStaff({
          fullName: currentUser.fullName,
          email: currentUser.email,
          contactNumber: currentUser.contactNumber || '',
          role: 'janitor',
          location: 'General',
          status: 'active',
          lastActivity: 'Recently active'
        });
        res.json({ message: "Current user added to staff collection" });
      } else {
        res.status(400).json({ error: "User not found or not a janitor" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      await StaffModel.updateStaff(id, req.body);
      res.json({ message: "Staff updated" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await StaffModel.deleteStaff(id);
      res.json({ message: "Staff deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getStatusSummary(req, res) {
    try {
      // Get current user from JWT token
      const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
      let currentUserEmail = null;
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";
          const decoded = jwt.verify(token, JWT_SECRET);
          currentUserEmail = decoded.email;
        } catch (err) {
          console.log('Token verification failed for status summary:', err.message);
        }
      }

      // Get all users and filter for staff roles (janitors, drivers, maintenance), excluding current user
      const users = await StaffModel.getAllUsers();
      
      // Filter for janitors, drivers, and maintenance staff, excluding current user
      const staffMembers = users.filter(user => {
        const role = user.role && user.role.toLowerCase();
        const isStaffRole = role === 'janitor' || role === 'driver' || role === 'maintenance';
        const isNotCurrentUser = !currentUserEmail || user.email !== currentUserEmail;
        return isStaffRole && isNotCurrentUser;
      });

      const totalStaff = staffMembers.length;

      // Count by status (using status field or defaulting to 'active')
      const activeNow = staffMembers.filter(s => (s.status || 'active') === 'active').length;
      const onBreak = staffMembers.filter(s => (s.status || 'active') === 'break' || (s.status || 'active') === 'on_break').length;
      const offline = staffMembers.filter(s => (s.status || 'active') === 'offline').length;

      res.json({
        totalStaff,
        activeNow,
        onBreak,
        offline,
        staff: staffMembers // Include the filtered staff list
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAllStaffWithCounts(req, res) {
    try {
      // Get current user from JWT token
      const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
      let currentUserEmail = null;
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";
          const decoded = jwt.verify(token, JWT_SECRET);
          currentUserEmail = decoded.email;
        } catch (err) {
          console.log('Token verification failed for staff list:', err.message);
        }
      }

      // Get all users and filter for staff roles (janitors, drivers, maintenance), excluding current user
      const users = await StaffModel.getAllUsers();
      
      // Debug logging
      console.log('Current user email:', currentUserEmail);
      console.log('Raw users data:', users.map(u => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, contactNumber: u.contactNumber })));
      
      // Filter for janitors, drivers, and maintenance staff, excluding current user
      const staffMembers = users.filter(user => {
        const role = user.role && user.role.toLowerCase();
        const isStaffRole = role === 'janitor' || role === 'driver' || role === 'maintenance';
        const isNotCurrentUser = !currentUserEmail || user.email !== currentUserEmail;
        return isStaffRole && isNotCurrentUser;
      }).map(member => {
        const mapped = {
          id: member.id,
          fullName: member.fullName,
          email: member.email,
          contactNumber: member.contactNumber ? member.contactNumber : 'N/A',
          role: member.role,
          location: member.location || 'General',
          status: member.status || 'active',
          lastActivity: member.lastActivity || 'Recently active',
          source: 'users'
        };
        console.log('Mapping janitor member:', { 
          input: { id: member.id, fullName: member.fullName, email: member.email, role: member.role, contactNumber: member.contactNumber },
          output: { id: mapped.id, fullName: mapped.fullName, contactNumber: mapped.contactNumber }
        });
        return mapped;
      });
      
      console.log('Final staff list:', staffMembers.map(s => ({ id: s.id, fullName: s.fullName, email: s.email, contactNumber: s.contactNumber })));

      const totalStaff = staffMembers.length;
      const activeNow = staffMembers.filter(s => s.status === 'active').length;
      const onBreak = staffMembers.filter(s => s.status === 'break' || s.status === 'on_break').length;
      const offline = staffMembers.filter(s => s.status === 'offline').length;

      res.json({
        staff: staffMembers,
        counts: {
          totalStaff,
          activeNow,
          onBreak,
          offline
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  // Test endpoint to debug the issue
  async testContactNumber(req, res) {
    try {
      const staff = await StaffModel.getAllStaff();
      const testData = staff.map(s => ({
        id: s.id,
        fullName: s.fullName,
        contactNumber: s.contactNumber,
        hasContactNumber: !!s.contactNumber
      }));
      res.json({ message: "Test endpoint", data: testData });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = staffController;
