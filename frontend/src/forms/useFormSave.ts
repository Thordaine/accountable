import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "../api/client";
import { useSave } from "../api/queries";
import type { Kind } from "../api/types";
import { missing } from "../components/FormDialog";

/** Form values held as text, with a setter per field for inputs. */
export function useValues<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState(initial);
  const set = (key: keyof T) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  return { values, setValues, set };
}

/** Checks required fields, saves, shows server errors by field, toasts and closes. */
export function useFormSave<T>(kind: Kind, noun: string, id: number | undefined, onDone: (saved: T) => void) {
  const save = useSave<T>(kind);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(values: Record<string, unknown>, required: string[], body: unknown) {
    const empty = missing(values, required);
    setErrors(empty);
    if (Object.keys(empty).length) return;
    save.mutate({ id, body }, {
      onSuccess: (saved) => {
        toast(`${noun} saved`);
        onDone(saved);
      },
      onError: (error) => {
        if (error instanceof ApiError && Object.keys(error.fields).length) setErrors(error.fields);
        else toast(`Couldn't save the ${noun.toLowerCase()}`);
      },
    });
  }

  return { submit, errors, saving: save.isPending };
}

/** Empty text becomes null. */
export const orNull = (text: string) => (text.trim() === "" ? null : text.trim());
