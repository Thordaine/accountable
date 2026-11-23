import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { Kind } from "../api/types";
import "./search.css";
import { useSearch, type SearchMatch, type SearchResults } from "./useSearch";

const GROUPS = [
  ["organizations", "Organizations"],
  ["contacts", "Contacts"],
  ["deals", "Deals"],
] as const;

type Match = SearchMatch & { kind: Kind };

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/** The matches grouped by kind, leaving out empty groups. */
function Groups({ results }: { results: SearchResults }) {
  return GROUPS.filter(([kind]) => results[kind].length > 0).map(
    ([kind, label]) => (
      <div key={kind} role="group" aria-label={label}>
        <div className="search-group" aria-hidden="true">
          {label}
        </div>
        {results[kind].map((m) => (
          <ComboboxOption
            key={m.id}
            value={{ ...m, kind }}
            className="search-option"
          >
            {m.name}
            {m.organization_name && (
              <span className="search-hint">{m.organization_name}</span>
            )}
          </ComboboxOption>
        ))}
      </div>
    ),
  );
}

const isEmpty = (r: SearchResults) =>
  GROUPS.every(([kind]) => r[kind].length === 0);

/** The top bar's search across organizations, contacts and deals. */
export function SearchBox() {
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const { data } = useSearch(text);
  const q = text.trim();
  /** Opens the picked match's page and empties the box. */
  const open = (m: Match | null) => {
    if (!m) return;
    setText("");
    void navigate(`/${m.kind}/${m.id}`);
  };
  return (
    <Combobox value={null} onChange={open}>
      <div className="search-box">
        <SearchIcon />
        <ComboboxInput
          aria-label="Search organizations, contacts and deals"
          placeholder="Search"
          displayValue={() => text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {q && data && (
        <ComboboxOptions
          anchor={{ to: "bottom start", gap: 6 }}
          modal={false}
          className="search-options"
        >
          {isEmpty(data) ? (
            <div className="search-none">No matches for "{q}"</div>
          ) : (
            <Groups results={data} />
          )}
        </ComboboxOptions>
      )}
    </Combobox>
  );
}
