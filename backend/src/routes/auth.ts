import { Router } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { GoogleCalendarService } from "../services/googleCalendar";

const router = Router();
const googleCalendarService = new GoogleCalendarService();

// Initiate Google OAuth
router.get("/google", (req, res) => {
  const authUrl = googleCalendarService.getAuthUrl();
  res.redirect(authUrl);
});

// Handle Google OAuth callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}?error=no_code`);
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code as string);

    if (!tokens.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}?error=no_token`);
    }

    // Get user info from Google
    const userInfo = await googleCalendarService.getUserInfo(tokens.access_token);

    if (!userInfo.id) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}?error=no_user_info`);
    }

    // Save or update user in database
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { google_id: userInfo.id } });

    const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    if (user) {
      // Update existing user
      user.access_token = tokens.access_token;
      user.refresh_token = tokens.refresh_token || user.refresh_token;
      user.token_expiry = tokenExpiry;
      user.email = userInfo.email || user.email;
      user.name = userInfo.name || user.name;
    } else {
      // Create new user
      user = userRepository.create({
        google_id: userInfo.id,
        email: userInfo.email || "",
        name: userInfo.name || "",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || "",
        token_expiry: tokenExpiry,
      });
    }

    await userRepository.save(user);

    // Fetch and store initial events (3 months back and forward)
    try {
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const threeMonthsForward = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      const googleEvents = await googleCalendarService.fetchCalendarEvents(user, threeMonthsAgo, threeMonthsForward);
      await googleCalendarService.storeEventsInDatabase(user, googleEvents);
    } catch (error) {
      console.error("Error fetching initial events:", error);
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}?token=${jwtToken}`);
  } catch (error) {
    console.error("Auth callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}?error=auth_failed`);
  }
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { refresh_token: refreshToken } });

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newTokens = await googleCalendarService.refreshAccessToken(refreshToken);

    // Update user tokens
    user.access_token = newTokens.access_token!;
    if (newTokens.expiry_date) {
      user.token_expiry = new Date(newTokens.expiry_date);
    }
    await userRepository.save(user);

    // Generate new JWT
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    res.json({ token: jwtToken });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Failed to refresh token" });
  }
});

export default router;
