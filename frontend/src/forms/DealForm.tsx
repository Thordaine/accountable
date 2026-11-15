import { addDays } from "date-fns";
import { useContacts, useOrganizations } from "../api/queries";
import type { Deal } from "../api/types";
import { Field, FormDialog } from "../components/FormDialog";
import { Picker } from "../components/Picker";
import { isoDate } from "../lib/format";
import { STAGES, type Stage, USUAL_PROBABILITY } from "../lib/stages";
import { orNull, useFormSave, useValues } from "./useFormSave";

type Props = {
  initial?: Deal;
  defaults?: { stage?: Stage; organization_id?: number; contact_id?: number };
  onDone: (saved?: Deal) => void;
};

/** Add or edit a deal. Picking a stage sets its usual probability, and today's date for Won or Lost. */
export function DealForm({ initial, defaults, onDone }: Props) {
  const stage = initial?.stage ?? defaults?.stage ?? "New";
  const { values, setValues, set } = useValues({
    name: initial?.name ?? "",
    organization_id: initial?.organization_id ?? defaults?.organization_id ?? null,
    contact_id: initial?.contact_id ?? defaults?.contact_id ?? null,
    stage,
    value: String(initial?.value ?? 0),
    probability: String(initial?.probability ?? USUAL_PROBABILITY[stage]),
    close_date: initial?.close_date ?? isoDate(addDays(new Date(), 30)),
  });
  const { submit, errors, saving } = useFormSave<Deal>("deals", "Deal", initial?.id, onDone);
  const orgs = useOrganizations().data ?? [];
  const contacts = useContacts().data ?? [];

  function save() {
    submit(values, ["name", "value", "probability", "close_date"], {
      ...values,
      name: values.name.trim(),
      value: Number(values.value),
      probability: Number(values.probability),
      close_date: orNull(values.close_date),
    });
  }

  return (
    <FormDialog title={initial ? "Edit deal" : "Add deal"} onClose={() => onDone()} onSubmit={save} saving={saving}>
      <Field label="Name" required error={errors.name}>
        <input value={values.name} onChange={set("name")} autoFocus />
      </Field>
      <div className="field-row">
        <Field label="Organization" error={errors.organization_id}>
          <Picker label="Organization" options={orgs} value={values.organization_id}
            onChange={(id) => setValues((v) => ({ ...v, organization_id: id }))} />
        </Field>
        <Field label="Main contact" error={errors.contact_id}>
          <Picker label="Main contact" value={values.contact_id}
            options={contacts.map((c) => ({ id: c.id, name: c.name, hint: c.organization_name }))}
            onChange={(id) => setValues((v) => ({ ...v, contact_id: id }))} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Stage" required error={errors.stage}>
          <select value={values.stage}
            onChange={(e) => {
              const next = e.target.value as Stage;
              const closed = next === "Won" || next === "Lost";
              setValues((v) => ({
                ...v,
                stage: next,
                probability: String(USUAL_PROBABILITY[next]),
                close_date: closed ? isoDate(new Date()) : v.close_date,
              }));
            }}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Close date" required error={errors.close_date}>
          <input type="date" value={values.close_date} onChange={set("close_date")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Value (US$)" required error={errors.value}>
          <input type="number" min={0} step={1} value={values.value} onChange={set("value")} />
        </Field>
        <Field label="Probability (%)" required error={errors.probability}>
          <input type="number" min={0} max={100} step={1} value={values.probability} onChange={set("probability")} />
        </Field>
      </div>
    </FormDialog>
  );
}
