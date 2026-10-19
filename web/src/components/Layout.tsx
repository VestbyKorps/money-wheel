import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./ui";
import { cn } from "../lib/utils";

const links = [
  { to: "/", label: "Årshjul", end: true },
  { to: "/schemes", label: "Støtteordninger" },
  { to: "/admin/users", label: "Brukere", admin: true },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <p className="font-display text-3xl tracking-tight text-spruce sm:text-4xl">Støttehjulet</p>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Årshjul for søknadsfrister — penge- og materialstøtte til korpset.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-ink-muted">
            {user?.full_name}
            {user?.role === "admin" ? " · admin" : ""}
          </span>
          <Button variant="secondary" onClick={logout}>
            Logg ut
          </Button>
        </div>
      </header>

      <nav className="mb-8 flex flex-wrap gap-1 border-b border-spruce/15 pb-2">
        {links
          .filter((l) => !l.admin || user?.role === "admin")
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-semibold transition",
                  isActive ? "bg-spruce text-paper" : "text-spruce hover:bg-mist/70",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
      </nav>

      <Outlet />
    </div>
  );
}
