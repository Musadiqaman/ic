import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const user = await User.create({ name, email, password, role });
  const token = signToken(user);
  res.cookie("token", token, cookieOpts);
  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const token = signToken(user);
  res.cookie("token", token, cookieOpts);
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role, token });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  // Re-fetch from DB instead of trusting the JWT payload verbatim — if an
  // admin's role/name changes later, an already-issued token shouldn't keep
  // reporting stale info for up to 7 days.
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: "User no longer exists" });
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
});
