import type { Organization } from "../api/types";
import { Field, FormDialog } from "../components/FormDialog";
import { orNull, useFormSave, useValues } from "./useFormSave";

type Props = { initial?: Organization; onDone: (saved?: Organization) => void };

/** Add or edit an organization. */
export function OrganizationForm({ initial, onDone }: Props) {
  const { values, set } = useValues({
    name: initial?.name ?? "",
    website: initial?.website ?? "",
    industry: initial?.industry ?? "",
    notes: initial?.notes ?? "",
  });
  const { submit, errors, saving } = useFormSave<Organization>("organizations", "Organization", initial?.id, onDone);

  function save() {
    submit(values, ["name"], {
      name: values.name.trim(),
      website: orNull(values.website),
      industry: orNull(values.industry),
      notes: orNull(values.notes),
    });
  }

  return (
    <FormDialog title={initial ? "Edit organization" : "Add organization"} onClose={() => onDone()}
      onSubmit={save} saving={saving}>
      <Field label="Name" required error={errors.name}>
        <input value={values.name} onChange={set("name")} autoFocus />
      </Field>
      <div className="field-row">
        <Field label="Website" error={errors.website}>
          <input value={values.website} onChange={set("website")} placeholder="example.com" />
        </Field>
        <Field label="Industry" error={errors.industry}>
          <input value={values.industry} onChange={set("industry")} />
        </Field>
      </div>
      <Field label="Notes" error={errors.notes}>
        <textarea rows={4} value={values.notes} onChange={set("notes")} />
      </Field>
    </FormDialog>
  );
}
