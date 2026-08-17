import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
// Public: only login needs to work with no session yet.
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

// NOT public — open sign-up would let anyone create an admin account for
// themselves. Only an already-logged-in admin can create more users. Run
// `npm run seed` (backend/src/utils/seed.js) to create the very first admin.
router.post("/register", requireAuth, requireRole("admin"), authController.register);

export default router;
