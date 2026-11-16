import { useOrganizations } from "../api/queries";
import type { Contact } from "../api/types";
import { Field, FormDialog } from "../components/FormDialog";
import { Picker } from "../components/Picker";
import { STATUSES, type Status } from "../lib/stages";
import { orNull, useFormSave, useValues } from "./useFormSave";

type Defaults = { organization_id?: number };

type Props = {
  initial?: Contact;
  defaults?: Defaults;
  onDone: (saved?: Contact) => void;
};

type Values = ReturnType<typeof newContact>;

/** A new contact's values: a Lead, at the default organization. */
function newContact(defaults: Defaults = {}) {
  return {
    name: "",
    email: "",
    phone: "",
    job_title: "",
    organization_id: defaults.organization_id ?? null,
    status: "Lead" as Status,
  };
}

/** An existing contact's values, as form text. */
function contactValues(contact: Contact): Values {
  return {
    name: contact.name,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    job_title: contact.job_title ?? "",
    organization_id: contact.organization_id,
    status: contact.status,
  };
}

/** Add or edit a contact. */
export function ContactForm({ initial, defaults, onDone }: Props) {
  const { values, setValues, set } = useValues(
    initial ? contactValues(initial) : newContact(defaults),
  );
  const { submit, errors, saving } = useFormSave<Contact>(
    "contacts",
    "Contact",
    initial?.id,
    onDone,
  );
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
    <FormDialog
      title={initial ? "Edit contact" : "Add contact"}
      onClose={() => onDone()}
      onSubmit={save}
      saving={saving}
    >
      <Field label="Name" required error={errors.name}>
        <input value={values.name} onChange={set("name")} data-autofocus />
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
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Organization" error={errors.organization_id}>
        <Picker
          label="Organization"
          options={orgs}
          value={values.organization_id}
          onChange={(id) => setValues((v) => ({ ...v, organization_id: id }))}
        />
      </Field>
    </FormDialog>
  );
}
