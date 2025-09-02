import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Event } from "../models/Event";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL || "postgresql://localhost:5432/calendar_app",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [User, Event],
  migrations: [],
  subscribers: [],
});
