import React, { useState } from "react";
import { login, signup } from "../api/client";

// PUBLIC_INTERFACE
export default function AuthPage({ onAuthed, pushToast }) {
  /** Login/signup form page. */
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        pushToast("Welcome back", "Logged in successfully.");
      } else {
        await signup(email.trim(), password);
        pushToast("Account created", "You are now signed in.");
      }
      onAuthed();
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="Content">
      <div className="Card">
        <div className="CalendarHeader">
          <div className="TopbarTitle">
            <h2>Sign in to Calendar</h2>
            <span>Retro scheduler with day/week/month views</span>
          </div>
          <div className="PillGroup" role="tablist" aria-label="auth mode">
            <button className="Pill" aria-pressed={mode === "login"} onClick={() => setMode("login")}>
              Login
            </button>
            <button className="Pill" aria-pressed={mode === "signup"} onClick={() => setMode("signup")}>
              Sign up
            </button>
          </div>
        </div>

        <form className="Form" onSubmit={onSubmit}>
          <div className="Field">
            <div className="Label">Email</div>
            <input className="Input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div className="Field">
            <div className="Label">Password</div>
            <input
              className="Input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={6}
            />
          </div>

          {error ? (
            <div className="Field" aria-live="polite">
              <div className="Label" style={{ color: "var(--danger)" }}>
                {error}
              </div>
            </div>
          ) : null}

          <button className="Btn BtnPrimary" disabled={busy} type="submit">
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
