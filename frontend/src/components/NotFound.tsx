import { Link } from "react-router";

/** Shown for an address with no record behind it. */
export function NotFound({
  noun,
  to,
  section,
}: {
  noun: string;
  to: string;
  section: string;
}) {
  return (
    <section className="panel not-found">
      <h1>{noun} not found</h1>
      <p className="muted">
        It may have been deleted, or the address is wrong.
      </p>
      <Link to={to} className="btn">
        Back to {section}
      </Link>
    </section>
  );
}
