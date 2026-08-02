import "dotenv/config.js";
import express from "express";
import cors from "cors";
import ridesRouter from "./routes/rides.js";
import chatbotRouter from "./routes/chatbot.js";
import authRouter from "./routes/auth.js";
import contentRouter from "./routes/content.js";
import bookingsRouter from "./routes/bookings.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/rides", ridesRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/auth", authRouter);
app.use("/api/content", contentRouter);
app.use("/api/bookings", bookingsRouter);

app.listen(PORT, () => {
  console.log(`RideMate API listening on http://localhost:${PORT}`);
});
