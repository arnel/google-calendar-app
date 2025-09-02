import dotenv from "dotenv";
dotenv.config();
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { Event } from "../models/Event";

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
    });
  }

  async exchangeCodeForTokens(code: string) {
    try {
      console.log("Exchanging code for tokens...");
      const { tokens } = await this.oauth2Client.getToken(code);
      console.log("Tokens received:", {
        access_token: tokens.access_token ? "present" : "missing",
        refresh_token: tokens.refresh_token ? "present" : "missing",
        expires_in: tokens.expiry_date,
      });

      if (!tokens.access_token) {
        throw new Error("No access token received from Google");
      }

      return tokens;
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return data;
  }

  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }

  async fetchCalendarEvents(user: User, timeMin?: string, timeMax?: string) {
    try {
      // Check if token needs refresh
      if (user.token_expiry && new Date() >= user.token_expiry) {
        const newTokens = await this.refreshAccessToken(user.refresh_token);

        // Update user tokens
        const userRepository = AppDataSource.getRepository(User);
        user.access_token = newTokens.access_token!;
        if (newTokens.expiry_date) {
          user.token_expiry = new Date(newTokens.expiry_date);
        }
        await userRepository.save(user);
      }

      this.oauth2Client.setCredentials({
        access_token: user.access_token,
        refresh_token: user.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
        timeMax: timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months forward
        maxResults: 2500,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      throw error;
    }
  }

  async createCalendarEvent(user: User, eventData: any) {
    try {
      // Check if token needs refresh
      if (user.token_expiry && new Date() >= user.token_expiry) {
        const newTokens = await this.refreshAccessToken(user.refresh_token);

        const userRepository = AppDataSource.getRepository(User);
        user.access_token = newTokens.access_token!;
        if (newTokens.expiry_date) {
          user.token_expiry = new Date(newTokens.expiry_date);
        }
        await userRepository.save(user);
      }

      this.oauth2Client.setCredentials({
        access_token: user.access_token,
        refresh_token: user.refresh_token,
      });

      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });

      const event = {
        summary: eventData.title,
        start: {
          dateTime: eventData.start_time,
          timeZone: "UTC",
        },
        end: {
          dateTime: eventData.end_time,
          timeZone: "UTC",
        },
      };

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  }

  async storeEventsInDatabase(user: User, googleEvents: any[]) {
    const eventRepository = AppDataSource.getRepository(Event);

    for (const googleEvent of googleEvents) {
      if (!googleEvent.start || !googleEvent.end || !googleEvent.summary) {
        continue;
      }

      const startTime = googleEvent.start.dateTime || googleEvent.start.date;
      const endTime = googleEvent.end.dateTime || googleEvent.end.date;

      if (!startTime || !endTime) {
        continue;
      }

      try {
        await eventRepository.upsert(
          {
            user_id: user.id,
            google_event_id: googleEvent.id,
            title: googleEvent.summary,
            start_time: new Date(startTime),
            end_time: new Date(endTime),
          },
          {
            conflictPaths: ["user_id", "google_event_id"],
            skipUpdateIfNoValuesChanged: true,
          }
        );
      } catch (error) {
        console.error("Error storing event:", error);
      }
    }
  }
}
