const StaffModel = require("../models/staffModel");

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
      res.json(staff);
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
  }
};

module.exports = staffController;
