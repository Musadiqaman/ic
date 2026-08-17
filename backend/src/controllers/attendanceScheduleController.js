import AttendanceSchedule from "../models/AttendanceSchedule.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const COURSE_TYPES = ["workspace", "paid", "free"];

// GET /api/attendance-schedule/:courseType
export const getSchedule = asyncHandler(async (req, res) => {
  const { courseType } = req.params;
  if (!COURSE_TYPES.includes(courseType)) {
    return res.status(400).json({ message: "Invalid course type" });
  }
  let schedule = await AttendanceSchedule.findOne({ courseType });
  if (!schedule) {
    schedule = { courseType, weeklyOffDays: [], holidays: [] };
  }
  res.json(schedule);
});

// GET /api/attendance-schedule  (all three, for the settings screen)
export const getAllSchedules = asyncHandler(async (req, res) => {
  const schedules = await AttendanceSchedule.find();
  const byType = Object.fromEntries(schedules.map((s) => [s.courseType, s]));
  const result = COURSE_TYPES.map((t) => byType[t] || { courseType: t, weeklyOffDays: [], holidays: [] });
  res.json(result);
});

// PUT /api/attendance-schedule/:courseType
// Body: { weeklyOffDays: [0-6], holidays: [{ date, label }] }
export const updateSchedule = asyncHandler(async (req, res) => {
  const { courseType } = req.params;
  if (!COURSE_TYPES.includes(courseType)) {
    return res.status(400).json({ message: "Invalid course type" });
  }
  const { weeklyOffDays, holidays } = req.body;

  const schedule = await AttendanceSchedule.findOneAndUpdate(
    { courseType },
    {
      courseType,
      weeklyOffDays: Array.isArray(weeklyOffDays) ? weeklyOffDays.filter((d) => d >= 0 && d <= 6) : [],
      holidays: Array.isArray(holidays) ? holidays.filter((h) => h.date) : [],
    },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(schedule);
});

// POST /api/attendance-schedule/:courseType/holidays
// Body: { date, label }
export const addHoliday = asyncHandler(async (req, res) => {
  const { courseType } = req.params;
  if (!COURSE_TYPES.includes(courseType)) {
    return res.status(400).json({ message: "Invalid course type" });
  }
  const { date, label } = req.body;
  if (!date) {
    return res.status(400).json({ message: "Holiday date is required" });
  }

  const schedule = await AttendanceSchedule.findOneAndUpdate(
    { courseType },
    {
      $push: { holidays: { date, label: label || "Holiday" } },
      $setOnInsert: { courseType },
    },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(schedule);
});

// DELETE /api/attendance-schedule/:courseType/holidays/:holidayId
export const deleteHoliday = asyncHandler(async (req, res) => {
  const { courseType, holidayId } = req.params;
  if (!COURSE_TYPES.includes(courseType)) {
    return res.status(400).json({ message: "Invalid course type" });
  }

  const schedule = await AttendanceSchedule.findOneAndUpdate(
    { courseType },
    { $pull: { holidays: { _id: holidayId } } },
    { new: true }
  );

  if (!schedule) {
    return res.status(404).json({ message: "Schedule not found" });
  }
  res.json(schedule);
});