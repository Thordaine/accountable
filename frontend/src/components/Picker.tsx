import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { useState } from "react";

type Option = { id: number; name: string; hint?: string | null };

type Props = {
  label: string;
  options: Option[];
  value: number | null;
  onChange: (id: number | null) => void;
};

/** A searchable list to pick one record, or none by clearing it. */
export function Picker({ label, options, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.id === value) ?? null;
  const q = query.toLowerCase();
  const shown = options.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 50);
  return (
    <Combobox value={selected} onChange={(o: Option | null) => onChange(o?.id ?? null)} onClose={() => setQuery("")}>
      <ComboboxInput
        aria-label={label}
        placeholder="None"
        displayValue={(o: Option | null) => o?.name ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value === "") onChange(null);
        }}
      />
      <ComboboxOptions anchor="bottom start" className="picker-options">
        {shown.map((o) => (
          <ComboboxOption key={o.id} value={o} className="picker-option">
            {o.name}
            {o.hint && <span className="muted"> · {o.hint}</span>}
          </ComboboxOption>
        ))}
        {shown.length === 0 && <div className="picker-option muted">No matches</div>}
      </ComboboxOptions>
    </Combobox>
  );
}
