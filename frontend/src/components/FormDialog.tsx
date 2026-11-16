import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { FormEvent, ReactNode } from "react";

type Props = {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  saving?: boolean;
  submitLabel?: string;
  danger?: boolean;
  children: ReactNode;
};

/** A modal form with Save and Cancel; Escape cancels. */
export function FormDialog({
  title,
  onClose,
  onSubmit,
  saving,
  submitLabel = "Save",
  danger,
  children,
}: Props) {
  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }
  return (
    <Dialog open onClose={onClose} className="dialog">
      <div className="backdrop" aria-hidden="true" />
      <div className="dialog-frame">
        <DialogPanel className="panel dialog-panel">
          <DialogTitle as="h2">{title}</DialogTitle>
          <form onSubmit={submit} noValidate>
            {children}
            <div className="dialog-actions">
              <button type="button" className="btn quiet" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={danger ? "btn danger" : "btn"}
                disabled={saving}
              >
                {submitLabel}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

/** A labelled form field with its error message. */
export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && (
          <span className="required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

/** Errors for the required fields left empty. */
export function missing(values: Record<string, unknown>, required: string[]) {
  return Object.fromEntries(
    required
      .filter((k) => String(values[k] ?? "").trim() === "")
      .map((k) => [k, "Required"]),
  );
}
