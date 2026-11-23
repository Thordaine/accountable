import { format, formatISO, parseISO } from "date-fns";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/client";
import { useLogActivity, useUpdateActivity } from "../api/queries";
import type { Activity, ActivityIn, ActivityType } from "../api/types";
import { Field, FormDialog, missing } from "../components/FormDialog";
import { orNull } from "./useFormSave";

export const TYPES: [ActivityType, string][] = [
  ["note", "Note"],
  ["call", "Call"],
  ["email", "Email"],
];

type Values = {
  type: ActivityType;
  description: string;
  happened_at: string;
  follow_up_date: string;
};

/** A time as the datetime-local input shows it, in the browser's zone. */
const toInput = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

const nowLocal = () => toInput(new Date());

const blank = (): Values => ({
  type: "note",
  description: "",
  happened_at: nowLocal(),
  follow_up_date: "",
});

const fromActivity = (a: Activity): Values => ({
  type: a.type as ActivityType,
  description: a.description,
  happened_at: toInput(parseISO(a.happened_at)),
  follow_up_date: a.follow_up_date ?? "",
});

/** Values, errors and a submit that checks required fields and shows server errors. */
function useActivityValues(initial: Values) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof Values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function check() {
    const empty = missing(values, ["description", "happened_at"]);
    setErrors(empty);
    return Object.keys(empty).length === 0;
  }
  const onError = (error: Error) =>
    error instanceof ApiError && Object.keys(error.fields).length
      ? setErrors(error.fields)
      : toast("Couldn't save the activity");
  return { values, setValues, set, errors, check, onError };
}

function body(
  values: Values,
  record: { contact_id: number | null; deal_id: number | null },
  done = false,
): ActivityIn {
  return {
    ...values,
    ...record,
    description: values.description.trim(),
    happened_at: formatISO(parseISO(values.happened_at)),
    follow_up_date: orNull(values.follow_up_date),
    done,
  };
}

function Fields({ form }: { form: ReturnType<typeof useActivityValues> }) {
  const { values, setValues, set, errors } = form;
  return (
    <>
      <div className="segmented" role="group" aria-label="Type">
        {TYPES.map(([type, label]) => (
          <button
            key={type}
            type="button"
            aria-pressed={values.type === type}
            onClick={() => setValues((v) => ({ ...v, type }))}
          >
            {label}
          </button>
        ))}
      </div>
      <Field label="Description" required error={errors.description}>
        <textarea
          rows={2}
          value={values.description}
          onChange={set("description")}
        />
      </Field>
      <div className="field-row">
        <Field label="Happened at" required error={errors.happened_at}>
          <input
            type="datetime-local"
            value={values.happened_at}
            onChange={set("happened_at")}
          />
        </Field>
        <Field label="Follow-up date" error={errors.follow_up_date}>
          <input
            type="date"
            value={values.follow_up_date}
            onChange={set("follow_up_date")}
          />
        </Field>
      </div>
    </>
  );
}

/** The form at the top of a timeline for logging a note, call or email. */
export function LogActivity({
  contactId,
  dealId,
}: {
  contactId?: number;
  dealId?: number;
}) {
  const form = useActivityValues(blank());
  const shownDefault = useRef(form.values.happened_at);
  const log = useLogActivity();
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.check()) return;
    const record = { contact_id: contactId ?? null, deal_id: dealId ?? null };
    const untouched = form.values.happened_at === shownDefault.current;
    const values = untouched
      ? { ...form.values, happened_at: nowLocal() }
      : form.values;
    log.mutate(body(values, record), {
      onSuccess: () => {
        toast("Activity logged");
        const fresh = blank();
        shownDefault.current = fresh.happened_at;
        form.setValues(fresh);
      },
      onError: form.onError,
    });
  }
  return (
    <form
      className="log-form"
      onSubmit={submit}
      noValidate
      aria-label="Log an activity"
    >
      <Fields form={form} />
      <div className="log-actions">
        <button type="submit" className="btn" disabled={log.isPending}>
          Log activity
        </button>
      </div>
    </form>
  );
}

/** Edit an activity in a dialog. */
export function ActivityForm({
  activity,
  onDone,
}: {
  activity: Activity;
  onDone: () => void;
}) {
  const form = useActivityValues(fromActivity(activity));
  const update = useUpdateActivity();
  function save() {
    if (!form.check()) return;
    const record = {
      contact_id: activity.contact_id,
      deal_id: activity.deal_id,
    };
    update.mutate(
      { id: activity.id, body: body(form.values, record, activity.done) },
      {
        onSuccess: () => {
          toast("Activity saved");
          onDone();
        },
        onError: form.onError,
      },
    );
  }
  return (
    <FormDialog
      title="Edit activity"
      onClose={onDone}
      onSubmit={save}
      saving={update.isPending}
    >
      <Fields form={form} />
    </FormDialog>
  );
}
