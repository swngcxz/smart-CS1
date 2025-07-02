function validateSchedule(body) {
  const requiredFields = ["staffId", "sched_type", "start_time", "end_time", "location", "status"];

  const missing = requiredFields.filter(field => !body[field]);

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  return null;
}

module.exports = { validateSchedule };
