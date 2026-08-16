import { Router } from "express";

const router = Router();

// OpenStreetMap's free Nominatim geocoder. Its usage policy requires a real,
// identifying User-Agent — browsers can't set that header themselves, so this
// call is proxied through our own backend rather than hit directly from the app.
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "RideMate/1.0 (university carpool app; contact: demo@ridemate.app)";

router.get("/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q || q.length < 3) {
    return res.json({ results: [] });
  }

  try {
    const url = new URL(`${NOMINATIM_BASE}/search`);
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("countrycodes", "bd");
    url.searchParams.set("limit", "5");
    url.searchParams.set("accept-language", "en");

    const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!r.ok) throw new Error(`Nominatim search failed: ${r.status}`);
    const data = (await r.json()) as { display_name: string; lat: string; lon: string }[];

    res.json({
      results: data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) })),
    });
  } catch (err) {
    console.error("Geocode search failed:", err);
    res.json({ results: [] });
  }
});

router.get("/reverse", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat and lng query params are required." });
  }

  try {
    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("accept-language", "en");

    const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!r.ok) throw new Error(`Nominatim reverse failed: ${r.status}`);
    const data = (await r.json()) as { display_name?: string };

    res.json({ label: data.display_name ?? null });
  } catch (err) {
    console.error("Reverse geocode failed:", err);
    res.json({ label: null });
  }
});

export default router;
