require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const axios = require("axios");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Setup (PostgreSQL) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      remind_at TIMESTAMPTZ NOT NULL,
      sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log("Database initialized");
}

// --- WhatsApp Cloud API ---
async function sendWhatsAppMessage(phone, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.error("WhatsApp credentials not configured");
    return false;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: `Reminder: ${message}` },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Message sent to ${phone}: ${message}`);
    return true;
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err.response?.data || err.message);
    return false;
  }
}

// --- Scheduler: check every minute for due reminders ---
cron.schedule("* * * * *", async () => {
  try {
    const { rows: dueReminders } = await pool.query(
      "SELECT * FROM reminders WHERE sent = FALSE AND remind_at <= NOW()"
    );

    for (const reminder of dueReminders) {
      const success = await sendWhatsAppMessage(reminder.phone, reminder.message);
      if (success) {
        await pool.query("UPDATE reminders SET sent = TRUE WHERE id = $1", [reminder.id]);
      }
    }

    if (dueReminders.length > 0) {
      console.log(`Processed ${dueReminders.length} due reminder(s)`);
    }
  } catch (err) {
    console.error("Scheduler error:", err.message);
  }
});

// --- API Routes ---

// Create a reminder
app.post("/api/reminders", async (req, res) => {
  const { phone, message, remind_at } = req.body;

  if (!phone || !message || !remind_at) {
    return res.status(400).json({ error: "phone, message, and remind_at are required" });
  }

  try {
    const { rows } = await pool.query(
      "INSERT INTO reminders (phone, message, remind_at) VALUES ($1, $2, $3) RETURNING *",
      [phone, message, remind_at]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create error:", err.message);
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

// Get all reminders for a phone number
app.get("/api/reminders", async (req, res) => {
  const { phone } = req.query;

  try {
    let result;
    if (phone) {
      result = await pool.query(
        "SELECT * FROM reminders WHERE phone = $1 ORDER BY remind_at ASC",
        [phone]
      );
    } else {
      result = await pool.query("SELECT * FROM reminders ORDER BY remind_at ASC");
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

// Delete a reminder
app.delete("/api/reminders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM reminders WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Reminder not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

initDB()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Reminder server running on ${HOST}:${PORT}`);
      console.log("Scheduler active - checking for due reminders every minute");
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err.message);
    console.error("Make sure DATABASE_URL is set correctly");
    process.exit(1);
  });
