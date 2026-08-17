import jwt from "jsonwebtoken";

// Ready to use, but NOT wired onto any routes yet (per project notes: full auth/roles = later).
// When you're ready to lock the API down, import `requireAuth` in server.js and apply it to
// the module routers, e.g. `app.use("/api/students", requireAuth, studentRoutes)`.
export function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
