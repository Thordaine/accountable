import { useState } from "react";
import { Link, NavLink } from "react-router";
import { DealForm } from "../forms/DealForm";
import { SearchBox } from "../search/SearchBox";
import { UserMenu } from "./UserMenu";

const SECTIONS = [
  ["/", "Dashboard"],
  ["/organizations", "Organizations"],
  ["/contacts", "Contacts"],
  ["/deals", "Deals"],
  ["/pipeline", "Pipeline"],
] as const;

/** The top bar: brand, the five sections, search, Add deal and the user menu. */
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
      <SearchBox />
      <button className="btn" type="button" onClick={() => setAdding(true)}>
        Add deal
      </button>
      <UserMenu />
      {adding && <DealForm onDone={() => setAdding(false)} />}
    </nav>
  );
}
