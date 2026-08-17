import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    label: { type: String, default: "Holiday" },
  },
  { _id: true }
);

// One schedule document per course type (workspace / paid / free). Admin
// sets which weekdays are always off (0=Sunday ... 6=Saturday) plus any
// specific one-off holiday dates. Used by runAutoAttendance() to decide,
// for each student, whether a missed day should be "leave" or "absent".
const attendanceScheduleSchema = new mongoose.Schema(
  {
    courseType: { type: String, enum: ["workspace", "paid", "free"], required: true, unique: true },
    weeklyOffDays: { type: [Number], default: [] },
    holidays: { type: [holidaySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("AttendanceSchedule", attendanceScheduleSchema);