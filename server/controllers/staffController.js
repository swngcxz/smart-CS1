const StaffModel = require("../models/staffModel");
const ScheduleModel = require("../models/scheduleModel");

const staffController = {
  async create(req, res) {
    try {
      const id = await StaffModel.createStaff(req.body);
      res.status(201).json({ message: "Staff created", id });
    } catch (error) {
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
      // Get janitors from both staff and users collections
      const staff = await StaffModel.getAllStaff();
      const users = await StaffModel.getAllUsers();
      
             // Combine and filter janitors from both collections (case-insensitive), excluding admin roles
       const allJanitors = [
         ...staff.filter(member => 
           member.role && 
           member.role.toLowerCase() === 'janitor' &&
           member.role.toLowerCase() !== 'admin' &&
           member.role.toLowerCase() !== 'administrator'
         ).map(m => ({ ...m, source: 'staff' })),
         ...users.filter(user => 
           user.role && 
           user.role.toLowerCase() === 'janitor' &&
           user.role.toLowerCase() !== 'admin' &&
           user.role.toLowerCase() !== 'administrator'
         ).map(u => ({ ...u, source: 'users' }))
       ];
      
      // Normalize the data structure to ensure consistency
      const normalizedJanitors = allJanitors.map(janitor => ({
        id: janitor.id,
        fullName: janitor.fullName,
        email: janitor.email,
        role: janitor.role,
        // Preserve original location; do not force a default here
        location: janitor.location,
        status: janitor.status || 'active',
        lastActivity: janitor.lastActivity || 'Recently active'
      }));
      
             console.log(`Found ${normalizedJanitors.length} janitors (${staff.filter(m => m.role && m.role.toLowerCase() === 'janitor').length} from staff, ${users.filter(u => u.role && u.role.toLowerCase() === 'janitor').length} from users)`);
       
       // Detailed logging for debugging
       console.log('All staff members:', staff.map(s => ({ name: s.fullName, role: s.role })));
       console.log('All users:', users.map(u => ({ name: u.fullName, role: u.role })));
       console.log('Filtered janitors:', allJanitors.map(j => ({ name: j.fullName, role: j.role, source: j.source })));
      
      res.json(normalizedJanitors);
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
      // Get all staff from both collections
      const staff = await StaffModel.getAllStaff();
      const users = await StaffModel.getAllUsers();
      
      // Combine all staff members and filter out admin roles
      const allStaff = [
        ...staff.map(s => ({ ...s, source: 'staff' })),
        ...users.map(u => ({ ...u, source: 'users' }))
      ].filter(member => 
        member.role && 
        member.role.toLowerCase() !== 'admin' && 
        member.role.toLowerCase() !== 'administrator'
      );

      const totalStaff = allStaff.length;

      // Count by status (using status field or defaulting to 'active')
      const activeNow = allStaff.filter(s => (s.status || 'active') === 'active').length;
      const onBreak = allStaff.filter(s => (s.status || 'active') === 'break' || (s.status || 'active') === 'on_break').length;
      const offline = allStaff.filter(s => (s.status || 'active') === 'offline').length;

      res.json({
        totalStaff,
        activeNow,
        onBreak,
        offline,
        staff: allStaff // Include the full staff list
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAllStaffWithCounts(req, res) {
    try {
      // Get all staff from both collections
      const staff = await StaffModel.getAllStaff();
      const users = await StaffModel.getAllUsers();
      
      // Combine and normalize all staff members, filtering out admin roles
      const allStaff = [
        ...staff.map(s => ({ ...s, source: 'staff' })),
        ...users.map(u => ({ ...u, source: 'users' }))
      ].filter(member => 
        member.role && 
        member.role.toLowerCase() !== 'admin' && 
        member.role.toLowerCase() !== 'administrator'
      ).map(member => ({
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        role: member.role,
        location: member.location || 'General',
        status: member.status || 'active',
        lastActivity: member.lastActivity || 'Recently active',
        source: member.source
      }));

      const totalStaff = allStaff.length;
      const activeNow = allStaff.filter(s => s.status === 'active').length;
      const onBreak = allStaff.filter(s => s.status === 'break' || s.status === 'on_break').length;
      const offline = allStaff.filter(s => s.status === 'offline').length;

      res.json({
        staff: allStaff,
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
  }
};

module.exports = staffController;
