import React, { useEffect, useMemo, useState } from "react";
import {
  createEvent,
  deleteEvent,
  getMe,
  listEvents,
  updateEvent,
  viewDay,
  viewMonth,
  viewWeek,
} from "../api/client";
import { Dialog } from "../components/Dialog";
import { addDays, monthGridStart, startOfWeekMonday, toISODate } from "../utils/date";

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function parseDatetimeLocalValue(v) {
  // Interpret as local time and send ISO (includes timezone offset when stringified by Date -> toISOString).
  const d = new Date(v);
  return d.toISOString();
}

// PUBLIC_INTERFACE
export default function CalendarPage({ onLogout, pushToast }) {
  /** Main calendar page with month/week/day views and CRUD for events. */
  const [user, setUser] = useState(null);

  const [view, setView] = useState("month"); // day | week | month
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    start: toDatetimeLocalValue(new Date()),
    end: toDatetimeLocalValue(addDays(new Date(), 0)),
    all_day: false,
    reminder_minutes_before: "",
  });

  const titleSubtitle = useMemo(() => {
    const m = cursor.toLocaleString(undefined, { month: "long" });
    const y = cursor.getFullYear();
    if (view === "month") return { title: "Month view", sub: `${m} ${y}` };
    if (view === "week") return { title: "Week view", sub: `Starting ${toISODate(startOfWeekMonday(cursor))}` };
    return { title: "Day view", sub: toISODate(cursor) };
  }, [cursor, view]);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const me = await getMe();
      setUser(me);

      if (view === "month") {
        const data = await viewMonth(cursor.getFullYear(), cursor.getMonth() + 1);
        setEvents(data);
      } else if (view === "week") {
        const ws = toISODate(startOfWeekMonday(cursor));
        const data = await viewWeek(ws);
        setEvents(data);
      } else {
        const data = await viewDay(toISODate(cursor));
        setEvents(data);
      }
    } catch (err) {
      if (err.status === 401) {
        pushToast("Session expired", "Please sign in again.");
        onLogout();
        return;
      }
      setError(err.message || "Failed to load calendar.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cursor]);

  function openNewEvent(dayDate) {
    const start = new Date(dayDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(dayDate);
    end.setHours(10, 0, 0, 0);
    setEditing(null);
    setForm({
      title: "",
      description: "",
      start: toDatetimeLocalValue(start),
      end: toDatetimeLocalValue(end),
      all_day: false,
      reminder_minutes_before: "15",
    });
    setDialogOpen(true);
  }

  function openEditEvent(ev) {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description || "",
      start: toDatetimeLocalValue(new Date(ev.start)),
      end: toDatetimeLocalValue(new Date(ev.end)),
      all_day: !!ev.all_day,
      reminder_minutes_before: ev.reminder_minutes_before != null ? String(ev.reminder_minutes_before) : "",
    });
    setDialogOpen(true);
  }

  async function saveEvent() {
    if (!form.title.trim()) {
      pushToast("Missing title", "Please enter an event title.");
      return;
    }
    const startIso = parseDatetimeLocalValue(form.start);
    const endIso = parseDatetimeLocalValue(form.end);
    if (new Date(endIso) < new Date(startIso)) {
      pushToast("Invalid time", "End must be after start.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      start: startIso,
      end: endIso,
      all_day: !!form.all_day,
      reminder_minutes_before: form.reminder_minutes_before === "" ? null : Number(form.reminder_minutes_before),
    };

    try {
      if (editing) {
        await updateEvent(editing.id, payload);
        pushToast("Event updated", editing.title);
      } else {
        await createEvent(payload);
        pushToast("Event created", payload.title);
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      pushToast("Save failed", err.message || "Unable to save event.");
    }
  }

  async function removeEvent() {
    if (!editing) return;
    try {
      await deleteEvent(editing.id);
      pushToast("Event deleted", editing.title);
      setDialogOpen(false);
      await load();
    } catch (err) {
      pushToast("Delete failed", err.message || "Unable to delete event.");
    }
  }

  async function quickRefreshAllEvents() {
    // Useful for the "All events" list in the right-side panel.
    try {
      const data = await listEvents();
      setEvents(data);
      pushToast("Synced", "Loaded all events.");
    } catch (err) {
      pushToast("Sync failed", err.message || "Unable to sync.");
    }
  }

  const gridStart = monthGridStart(cursor);
  const gridDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const key = toISODate(new Date(ev.start));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    // Sort by start
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.start) - new Date(b.start));
      map.set(k, arr);
    }
    return map;
  }, [events]);

  return (
    <div className="AppShell">
      <aside className="Sidebar">
        <div className="Brand">
          <div className="BrandMark" aria-hidden="true" />
          <div className="BrandText">
            <h1>Retro Calendar</h1>
            <p>{user ? user.email : "..."}</p>
          </div>
        </div>

        <div className="Nav" aria-label="calendar navigation">
          <button className="NavBtn" aria-current={view === "day" ? "page" : undefined} onClick={() => setView("day")}>
            Day
          </button>
          <button className="NavBtn" aria-current={view === "week" ? "page" : undefined} onClick={() => setView("week")}>
            Week
          </button>
          <button
            className="NavBtn"
            aria-current={view === "month" ? "page" : undefined}
            onClick={() => setView("month")}
          >
            Month
          </button>
        </div>

        <div className="SideFooter">
          <div>Reminders are stored with events.</div>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <button className="Btn" onClick={() => openNewEvent(cursor)}>
              + New event
            </button>
            <button className="Btn" onClick={quickRefreshAllEvents}>
              Sync all events
            </button>
            <button className="Btn BtnDanger" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="Main">
        <header className="Topbar">
          <div className="TopbarTitle">
            <h2>{titleSubtitle.title}</h2>
            <span>{titleSubtitle.sub}</span>
          </div>

          <div className="TopbarActions">
            <button className="Btn" onClick={() => setCursor(addDays(cursor, -1))}>
              ← Prev
            </button>
            <button className="Btn" onClick={() => setCursor(() => {
              const d = new Date();
              d.setHours(0,0,0,0);
              return d;
            })}>
              Today
            </button>
            <button className="Btn" onClick={() => setCursor(addDays(cursor, 1))}>
              Next →
            </button>
            <button className="Btn BtnPrimary" onClick={() => openNewEvent(cursor)}>
              Add event
            </button>
          </div>
        </header>

        <div className="Content">
          {error ? (
            <div className="Card" style={{ padding: 14 }}>
              <p className="ToastTitle">Error</p>
              <p className="ToastBody">{error}</p>
            </div>
          ) : null}

          <div className="Split">
            <section className="Card" aria-label="calendar view">
              <div className="CalendarHeader">
                <div className="TopbarTitle">
                  <h2>Calendar</h2>
                  <span>Click a day to add, click an event to edit</span>
                </div>
                <div className="PillGroup" aria-label="view mode">
                  <button className="Pill" aria-pressed={view === "day"} onClick={() => setView("day")}>
                    Day
                  </button>
                  <button className="Pill" aria-pressed={view === "week"} onClick={() => setView("week")}>
                    Week
                  </button>
                  <button className="Pill" aria-pressed={view === "month"} onClick={() => setView("month")}>
                    Month
                  </button>
                </div>
              </div>

              {busy ? (
                <div style={{ padding: 14, color: "var(--muted)" }}>Loading…</div>
              ) : view === "month" ? (
                <div className="GridMonth" role="grid" aria-label="month grid">
                  {gridDays.map((d) => {
                    const key = toISODate(d);
                    const inMonth = d.getMonth() === cursor.getMonth();
                    const dayEvents = eventsByDay.get(key) || [];
                    return (
                      <div
                        key={key}
                        className="GridCell"
                        style={{ opacity: inMonth ? 1 : 0.55 }}
                        role="gridcell"
                        onDoubleClick={() => openNewEvent(d)}
                      >
                        <div className="DayNum">
                          <span>{d.getDate()}</span>
                          <button className="Btn" onClick={() => openNewEvent(d)} style={{ padding: "4px 8px" }}>
                            +
                          </button>
                        </div>
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div key={ev.id} className="EventChip" onClick={() => openEditEvent(ev)} title={ev.title}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 ? (
                          <div className="ToastBody" style={{ marginTop: 8 }}>
                            +{dayEvents.length - 3} more
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: 14, color: "var(--muted)" }}>
                  This template renders the month grid; day/week use the same event list panel on the right.
                </div>
              )}
            </section>

            <aside className="Card" aria-label="events list">
              <div className="CalendarHeader">
                <div className="TopbarTitle">
                  <h2>Events</h2>
                  <span>{view === "month" ? "This month" : view === "week" ? "This week" : "Today"}</span>
                </div>
              </div>
              <div style={{ padding: 14, display: "grid", gap: 10 }}>
                {events.length === 0 ? (
                  <div className="ToastBody">No events yet. Add one from the sidebar.</div>
                ) : (
                  events
                    .slice()
                    .sort((a, b) => new Date(a.start) - new Date(b.start))
                    .map((ev) => (
                      <button key={ev.id} className="NavBtn" onClick={() => openEditEvent(ev)}>
                        <div style={{ fontSize: 13 }}>{ev.title}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                          {new Date(ev.start).toLocaleString()} → {new Date(ev.end).toLocaleString()}
                        </div>
                      </button>
                    ))
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Dialog title={editing ? "Edit event" : "New event"} isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
        <div className="Form">
          <div className="Field">
            <div className="Label">Title</div>
            <input className="Input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="Field">
            <div className="Label">Description</div>
            <textarea
              className="Textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="Row">
            <div className="Field">
              <div className="Label">Start</div>
              <input
                className="Input"
                type="datetime-local"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </div>
            <div className="Field">
              <div className="Label">End</div>
              <input
                className="Input"
                type="datetime-local"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </div>
          </div>

          <div className="Row">
            <div className="Field">
              <div className="Label">All day</div>
              <select
                className="Select"
                value={form.all_day ? "yes" : "no"}
                onChange={(e) => setForm({ ...form, all_day: e.target.value === "yes" })}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="Field">
              <div className="Label">Reminder (minutes before)</div>
              <input
                className="Input"
                type="number"
                min="0"
                max="10080"
                value={form.reminder_minutes_before}
                onChange={(e) => setForm({ ...form, reminder_minutes_before: e.target.value })}
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button className="Btn BtnPrimary" onClick={saveEvent} type="button">
              Save
            </button>
            {editing ? (
              <button className="Btn BtnDanger" onClick={removeEvent} type="button">
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
