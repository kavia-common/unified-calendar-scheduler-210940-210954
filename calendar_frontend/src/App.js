import React, { useCallback, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import AuthPage from "./pages/AuthPage";
import CalendarPage from "./pages/CalendarPage";
import { ToastStack } from "./components/Toast";

function hasToken() {
  return !!localStorage.getItem("access_token");
}

// PUBLIC_INTERFACE
export default function App() {
  /** Application root: handles auth gating, routing, and toast notifications. */
  const [authed, setAuthed] = useState(() => hasToken());
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((title, message) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, title, message }, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const authApi = useMemo(
    () => ({
      onAuthed: () => setAuthed(true),
      onLogout: () => {
        localStorage.removeItem("access_token");
        setAuthed(false);
      },
    }),
    []
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            authed ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage onAuthed={authApi.onAuthed} pushToast={pushToast} />
            )
          }
        />
        <Route
          path="/"
          element={
            authed ? (
              <CalendarPage onLogout={authApi.onLogout} pushToast={pushToast} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={authed ? "/" : "/auth"} replace />} />
      </Routes>
      <ToastStack toasts={toasts} />
    </BrowserRouter>
  );
}
