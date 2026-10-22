// The app shell. It turns on smooth scrolling, shows the custom cursor,
// and decides which screen to show based on whether you're logged in.

import { useAuth } from "./lib/auth";
import { useLenis } from "./lib/useLenis";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Cursor } from "./components/Cursor";

export function App() {
  useLenis(); // smooth scroll for the whole app
  const { isLoggedIn } = useAuth();

  return (
    <>
      <Cursor />
      {isLoggedIn ? <Dashboard /> : <Login />}
    </>
  );
}
