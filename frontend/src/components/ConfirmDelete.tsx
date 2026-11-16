import { toast } from "sonner";
import { useDelete, useImpact } from "../api/queries";
import type { Impact, Kind } from "../api/types";
import { FormDialog } from "./FormDialog";

const NOUN: Record<Kind, string> = {
  organizations: "Organization",
  contacts: "Contact",
  deals: "Deal",
};

function count(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

const activitiesWord = (n: number) =>
  n === 1 ? "1 activity" : `${n} activities`;

/** What happens to the linked records, in the spec's words. */
export function impactText(kind: Kind, impact: Impact) {
  if (kind === "organizations") {
    const what = `${count(impact.contacts, "contact")} and ${count(impact.deals, "deal")}`;
    return `Its ${what} will be kept, with no organization.`;
  }
  if (kind === "contacts") {
    return (
      `Their ${count(impact.deals, "deal")} will be kept, with no main contact. ` +
      `Their ${activitiesWord(impact.activities)} will be deleted.`
    );
  }
  return `Its ${activitiesWord(impact.activities)} will be deleted.`;
}

type Props = {
  kind: Kind;
  id: number;
  name: string;
  onClose: () => void;
  onDeleted?: () => void;
};

/** Asks before deleting a record, saying what happens to its linked records. */
export function ConfirmDelete({ kind, id, name, onClose, onDeleted }: Props) {
  const impact = useImpact(kind, id);
  const remove = useDelete(kind);
  function confirm() {
    onDeleted?.();
    remove.mutateAsync(id).then(() => {
      toast(`${NOUN[kind]} deleted`);
      onClose();
    });
  }
  return (
    <FormDialog
      title={`Delete ${name}?`}
      onClose={onClose}
      onSubmit={confirm}
      submitLabel="Delete"
      danger
      saving={!impact.data || remove.isPending}
    >
      <p className="confirm-text">
        {impact.data
          ? impactText(kind, impact.data)
          : "Checking linked records…"}
      </p>
    </FormDialog>
  );
}
