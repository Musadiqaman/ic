import { Router } from "express";
import * as teachersController from "../controllers/teachersController.js";

const router = Router();

// CRUD
router.get("/", teachersController.list);
router.get("/:id", teachersController.getOne);
router.post("/", teachersController.create);
router.put("/:id", teachersController.update);
router.delete("/:id", teachersController.remove);

// Salary Challans
router.post("/:id/challans", teachersController.generateSalaryChallan);
router.delete("/:id/challans/:challanId", teachersController.removeChallan);

// Payments
router.post("/:id/payments", teachersController.addPayment);
router.delete("/:id/payments/:paymentId", teachersController.removePayment);

export default router;
