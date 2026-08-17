import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cron from "node-cron";

import { connectDB } from "./src/config/db.js";
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";
import { requireAuth, requireRole } from "./src/middleware/auth.js";

import authRoutes from "./src/routes/auth.js";
import studentRoutes from "./src/routes/students.js";
import employeeRoutes from "./src/routes/employees.js";
import teacherRoutes from "./src/routes/teachers.js";
import expenseRoutes from "./src/routes/expenses.js";
import projectRoutes from "./src/routes/projects.js";
import loanRoutes from "./src/routes/loans.js";
import attendanceRoutes from "./src/routes/attendance.js";
import attendanceScheduleRoutes from "./src/routes/attendanceSchedule.js";
import dashboardRoutes from "./src/routes/dashboard.js";

import { runAutoAttendance, generateMonthlyChallans } from "./src/controllers/studentsController.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Login/register/logout stay public (obviously). Everything else needs a
// valid session cookie. `requireRole("admin")` is applied on top for now
// since "admin" is the only role that exists yet — when more roles are
// added later, swap the roles list per-router instead of removing this.
app.use("/api/auth", authRoutes);

app.use("/api/students", requireAuth, requireRole("admin"), studentRoutes);
app.use("/api/employees", requireAuth, requireRole("admin"), employeeRoutes);
app.use("/api/teachers", requireAuth, requireRole("admin"), teacherRoutes);
app.use("/api/expenses", requireAuth, requireRole("admin"), expenseRoutes);
app.use("/api/projects", requireAuth, requireRole("admin"), projectRoutes);
app.use("/api/loans", requireAuth, requireRole("admin"), loanRoutes);
app.use("/api/attendance", requireAuth, requireRole("admin"), attendanceRoutes);
app.use("/api/attendance-schedule", requireAuth, requireRole("admin"), attendanceScheduleRoutes);
app.use("/api/dashboard", requireAuth, requireRole("admin"), dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] running on http://localhost:${PORT}`));

  // Runs every day at 11:55 PM Pakistan time (Asia/Karachi): marks every
  // active student who still has no attendance record for today as either
  // "leave" (weekly-off / holiday for their course type) or "absent". Never
  // touches a student who already has a manual/face-scan record for the day.
  //
  // The explicit `timezone: "Asia/Karachi"` option is what makes "11:55 PM"
  // mean 11:55 PM PKT regardless of what timezone the server/host machine
  // itself is set to (many hosting providers default their containers to
  // UTC) — without it, this would fire at 11:55 PM in whatever timezone the
  // server happens to be running in, which is usually NOT Pakistan time.
  cron.schedule(
    "55 23 * * *",
    async () => {
      try {
        const result = await runAutoAttendance();
        console.log(`[cron] auto-attendance for ${result.date}: ${result.leaveCount} leave, ${result.absentCount} absent`);
      } catch (err) {
        console.error("[cron] auto-attendance failed:", err.message);
      }
    },
    { timezone: "Asia/Karachi" }
  );

  // Runs on the 1st of every month at 12:05 AM Pakistan time: generates this
  // month's Monthly Fee challan for every active student that doesn't
  // already have one. (list() also does this lazily on every page load, so
  // this cron is a belt-and-suspenders backup, not strictly required.)
  cron.schedule(
    "5 0 1 * *",
    async () => {
      try {
        const created = await generateMonthlyChallans();
        console.log(`[cron] monthly challans generated (${created} created)`);
      } catch (err) {
        console.error("[cron] monthly challan generation failed:", err.message);
      }
    },
    { timezone: "Asia/Karachi" }
  );
});