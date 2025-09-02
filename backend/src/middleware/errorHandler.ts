import { Request, Response, NextFunction } from "express";

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", error);

  if (error.code === "23505") {
    // PostgreSQL unique violation
    return res.status(409).json({ error: "Resource already exists" });
  }

  if (error.code === "23503") {
    // PostgreSQL foreign key violation
    return res.status(400).json({ error: "Invalid reference" });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }

  if (error.response?.status === 401) {
    return res.status(401).json({ error: "Google API authentication failed" });
  }

  if (error.response?.status === 403) {
    return res.status(403).json({ error: "Google API access forbidden" });
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  });
};
