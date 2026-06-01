// Change this to your server's URL
// Use your computer's local IP (not localhost) so your phone can reach it
const BASE_URL = "http://192.168.1.100:3000";

export async function createReminder(phone, message, remindAt) {
  const res = await fetch(`${BASE_URL}/api/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      message,
      remind_at: remindAt,
    }),
  });
  if (!res.ok) throw new Error("Failed to create reminder");
  return res.json();
}

export async function getReminders(phone) {
  const url = phone
    ? `${BASE_URL}/api/reminders?phone=${encodeURIComponent(phone)}`
    : `${BASE_URL}/api/reminders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch reminders");
  return res.json();
}

export async function deleteReminder(id) {
  const res = await fetch(`${BASE_URL}/api/reminders/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete reminder");
  return res.json();
}
