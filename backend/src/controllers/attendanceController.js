import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Present window: 9:00 AM – 2:00 PM (Pakistan time). Anything scanned after 2:00 PM counts as "late".
const LATE_AFTER_MIN = 14 * 60; // 2:00 PM, in minutes-from-midnight
const TZ = "Asia/Karachi";

// Returns YYYY-MM-DD for a given Date, always computed in Pakistan's local
// calendar day — regardless of what timezone the server machine itself runs in.
// (This is the fix: previously we used now.toISOString().slice(0,10), which
// is UTC and rolls over to the "next day" 5 hours late relative to PKT — e.g.
// at 12:19 AM PKT, UTC is still 7:19 PM the PREVIOUS day, so "today" was
// being computed as yesterday.)
function localDateStr(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // en-CA -> YYYY-MM-DD
}

// Minutes-from-midnight in Pakistan local time, for the present/late cutoff.
function localMinutesNow(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour").value);
  const m = Number(parts.find((p) => p.type === "minute").value);
  return h * 60 + m;
}

export const list = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filter = {};
  if (date) {
    // date is a "YYYY-MM-DD" string meant in Pakistan local time -> convert
    // that local day's start/end to real UTC instants for the Mongo query.
    const start = new Date(`${date}T00:00:00+05:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.checkedInAt = { $gte: start, $lt: end };
  }
  const items = await Attendance.find(filter).sort({ checkedInAt: -1 });
  res.json(items);
});

function recalcAttendancePercent(history) {
  const counted = history.filter((h) => h.status !== "leave");
  if (counted.length === 0) return 100;
  const attended = counted.filter((h) => h.status === "present" || h.status === "late").length;
  return Math.round((attended / counted.length) * 100);
}

// Compare using the SAME local-day function as everywhere else, not toISOString.
const sameDay = (date, dayStr) => date && localDateStr(date) === dayStr;

export const checkIn = asyncHandler(async (req, res) => {
  const { personName, personType, refId, method } = req.body;
  if (!personName || !personType) {
    return res.status(400).json({ message: "personName and personType are required" });
  }

  const now = new Date();
  const dayStr = localDateStr(now);

  let student = null;
  if (personType === "Student" && refId) {
    student = await Student.findById(refId);
    if (student) {
      const existing = student.attendanceHistory.find((h) => sameDay(h.date, dayStr));
      if (existing) {
        return res.status(200).json({
          alreadyMarked: true,
          personName,
          status: existing.status,
        });
      }
    }
  }

  const minutesNow = localMinutesNow(now);
  const status = minutesNow < LATE_AFTER_MIN ? "present" : "late";

  const entry = await Attendance.create({
    personName,
    personType,
    refId: refId || undefined,
    method: method || "Manual",
    status,
    checkedInAt: now,
  });

  if (student) {
    student.attendanceHistory.push({ date: now, status, type: "auto", note: "" });
    student.attendancePercent = recalcAttendancePercent(student.attendanceHistory);
    await student.save();
  }

  res.status(201).json(entry);
});

export const remove = asyncHandler(async (req, res) => {
  const item = await Attendance.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted", id: req.params.id });
});