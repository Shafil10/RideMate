import express from "express";
import cors from "cors";
import ridesRouter from "./routes/rides.js";
import chatbotRouter from "./routes/chatbot.js";
import authRouter from "./routes/auth.js";
import contentRouter from "./routes/content.js";
import geocodeRouter from "./routes/geocode.js";
import rideRequestsRouter from "./routes/rideRequests.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/rides", ridesRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/auth", authRouter);
app.use("/api/content", contentRouter);
app.use("/api/geocode", geocodeRouter);
app.use("/api/ride-requests", rideRequestsRouter);

export default app;
