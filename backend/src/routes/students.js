import { Router } from "express";
import * as studentsController from "../controllers/studentsController.js";

const router = Router();

router.get("/", studentsController.list);
router.get("/:id", studentsController.getOne);
router.post("/", studentsController.create);
router.put("/:id", studentsController.update);
router.delete("/:id", studentsController.remove);

router.post("/:id/payments", studentsController.addPayment);
router.delete("/:id/payments/:paymentId", studentsController.removePayment);

// Delete a single fee challan (blocked server-side if payments already
// exist against it — see removeChallan in the controller).
router.delete("/:id/challans/:challanId", studentsController.removeChallan);

router.post("/:id/attendance", studentsController.markAttendance);
router.post("/run-auto-attendance", studentsController.runAutoAttendanceNow);

// Manual trigger for challan generation (the cron job in server.js calls the
// same underlying function automatically on the 1st of every month).
router.post("/generate-challans", studentsController.generateChallansNow);

export default router;