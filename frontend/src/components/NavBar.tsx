import { useState } from "react";
import { Link, NavLink } from "react-router";
import { DealForm } from "../forms/DealForm";

const SECTIONS = [
  ["/", "Dashboard"],
  ["/organizations", "Organizations"],
  ["/contacts", "Contacts"],
  ["/deals", "Deals"],
  ["/pipeline", "Pipeline"],
] as const;

/** The top bar: brand, the five sections and Add deal. */
export function NavBar() {
  const [adding, setAdding] = useState(false);
  return (
    <nav className="top">
      <Link to="/" className="brand">
        <span className="mark">A</span>Accountable
      </Link>
      <div className="tabs">
        {SECTIONS.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>
            {label}
          </NavLink>
        ))}
      </div>
      <button className="btn" type="button" onClick={() => setAdding(true)}>Add deal</button>
      {adding && <DealForm onDone={() => setAdding(false)} />}
    </nav>
  );
}
