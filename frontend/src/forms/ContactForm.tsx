import { useOrganizations } from "../api/queries";
import type { Contact } from "../api/types";
import { Field, FormDialog } from "../components/FormDialog";
import { Picker } from "../components/Picker";
import { STATUSES } from "../lib/stages";
import { orNull, useFormSave, useValues } from "./useFormSave";

type Props = { initial?: Contact; defaults?: { organization_id?: number }; onDone: (saved?: Contact) => void };

/** Add or edit a contact. New contacts start as Lead. */
export function ContactForm({ initial, defaults, onDone }: Props) {
  const { values, setValues, set } = useValues({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    job_title: initial?.job_title ?? "",
    organization_id: initial?.organization_id ?? defaults?.organization_id ?? null,
    status: initial?.status ?? "Lead",
  });
  const { submit, errors, saving } = useFormSave<Contact>("contacts", "Contact", initial?.id, onDone);
  const orgs = useOrganizations().data ?? [];

  function save() {
    submit(values, ["name", "status"], {
      ...values,
      name: values.name.trim(),
      email: orNull(values.email),
      phone: orNull(values.phone),
      job_title: orNull(values.job_title),
    });
  }

  return (
    <FormDialog title={initial ? "Edit contact" : "Add contact"} onClose={() => onDone()} onSubmit={save}
      saving={saving}>
      <Field label="Name" required error={errors.name}>
        <input value={values.name} onChange={set("name")} autoFocus />
      </Field>
      <div className="field-row">
        <Field label="Email" error={errors.email}>
          <input type="email" value={values.email} onChange={set("email")} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input value={values.phone} onChange={set("phone")} />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Job title" error={errors.job_title}>
          <input value={values.job_title} onChange={set("job_title")} />
        </Field>
        <Field label="Status" required error={errors.status}>
          <select value={values.status} onChange={set("status")}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Organization" error={errors.organization_id}>
        <Picker label="Organization" options={orgs} value={values.organization_id}
          onChange={(id) => setValues((v) => ({ ...v, organization_id: id }))} />
      </Field>
    </FormDialog>
  );
}
