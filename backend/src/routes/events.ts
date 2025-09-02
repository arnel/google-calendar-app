import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { AppDataSource } from "../config/database";
import { Event } from "../models/Event";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { GoogleCalendarService } from "../services/googleCalendar";

const router = Router();
const googleCalendarService = new GoogleCalendarService();

// Get events with date filtering
router.get(
  "/events",
  authenticateToken,
  [query("days").optional().isInt({ min: 1, max: 365 }), query("startDate").optional().isISO8601()],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user!;
      const days = parseInt(req.query.days as string) || 7;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();

      // Set start of day
      startDate.setHours(0, 0, 0, 0);

      // Calculate end date
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);
      endDate.setHours(23, 59, 59, 999);

      const eventRepository = AppDataSource.getRepository(Event);
      const events = await eventRepository
        .createQueryBuilder("event")
        .where("event.user_id = :userId", { userId: user.id })
        .andWhere("event.start_time >= :startDate", { startDate })
        .andWhere("event.start_time <= :endDate", { endDate })
        .orderBy("event.start_time", "ASC")
        .getMany();

      // Group events by day or week based on the range
      const groupedEvents = days <= 7 ? groupEventsByDay(events) : groupEventsByWeek(events);

      res.json({
        events: groupedEvents,
        dateRange: { startDate, endDate, days },
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  }
);

// Create new event
router.post(
  "/events",
  authenticateToken,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("start_time").isISO8601().withMessage("Valid start time is required"),
    body("end_time").isISO8601().withMessage("Valid end time is required"),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user!;
      const { title, start_time, end_time } = req.body;

      // Validate that end time is after start time
      if (new Date(end_time) <= new Date(start_time)) {
        return res.status(400).json({ error: "End time must be after start time" });
      }

      // Create event in Google Calendar
      const googleEvent = await googleCalendarService.createCalendarEvent(user, {
        title,
        start_time,
        end_time,
      });

      // Store event in database
      const eventRepository = AppDataSource.getRepository(Event);
      const event = eventRepository.create({
        user_id: user.id,
        google_event_id: googleEvent.id,
        title,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
      });

      await eventRepository.save(event);

      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  }
);

// Refresh events from Google Calendar
router.post("/events/refresh", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    // Fetch events from Google Calendar
    const googleEvents = await googleCalendarService.fetchCalendarEvents(user);

    // Store events in database
    await googleCalendarService.storeEventsInDatabase(user, googleEvents);

    res.json({ message: "Events refreshed successfully", count: googleEvents.length });
  } catch (error) {
    console.error("Error refreshing events:", error);
    res.status(500).json({ error: "Failed to refresh events" });
  }
});

// Helper function to group events by day
function groupEventsByDay(events: Event[]) {
  const grouped: Record<string, Event[]> = {};

  events.forEach((event) => {
    const dateKey = event.start_time.toISOString().split("T")[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });

  return Object.entries(grouped).map(([date, events]) => ({
    date,
    events: events.sort((a, b) => a.start_time.getTime() - b.start_time.getTime()),
  }));
}

// Helper function to group events by week
function groupEventsByWeek(events: Event[]) {
  const grouped: Record<string, Event[]> = {};

  events.forEach((event) => {
    const eventDate = new Date(event.start_time);
    const startOfWeek = new Date(eventDate);
    startOfWeek.setDate(eventDate.getDate() - eventDate.getDay());
    const weekKey = startOfWeek.toISOString().split("T")[0];

    if (!grouped[weekKey]) {
      grouped[weekKey] = [];
    }
    grouped[weekKey].push(event);
  });

  return Object.entries(grouped).map(([weekStart, events]) => ({
    weekStart,
    events: events.sort((a, b) => a.start_time.getTime() - b.start_time.getTime()),
  }));
}

export default router;
