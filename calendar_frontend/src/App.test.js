import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders auth screen when not authenticated", () => {
  localStorage.removeItem("access_token");
  render(<App />);
  expect(screen.getByText(/sign in to calendar/i)).toBeInTheDocument();
});
