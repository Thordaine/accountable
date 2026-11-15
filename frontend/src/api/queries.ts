import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { columnsFrom, moveCard } from "../pipeline/boardMath";
import { api } from "./client";
import type { Stage } from "../lib/stages";
import type {
  Activity, ActivityIn, Contact, ContactDetail, Dashboard, Deal, DealDetail, Impact, Kind, Organization, OrganizationDetail,
} from "./types";

export const useOrganizations = () =>
  useQuery({ queryKey: ["organizations"], queryFn: () => api<Organization[]>("/organizations") });

export const useContacts = () =>
  useQuery({ queryKey: ["contacts"], queryFn: () => api<Contact[]>("/contacts") });

export const useDeals = () => useQuery({ queryKey: ["deals"], queryFn: () => api<Deal[]>("/deals") });

export const useDashboard = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });

type Detail = { organizations: OrganizationDetail; contacts: ContactDetail; deals: DealDetail };

/** One record's page data; a 404 isn't retried. */
export function useRecord<K extends Kind>(kind: K, id: number) {
  return useQuery({
    queryKey: [kind, id],
    queryFn: () => api<Detail[K]>(`/${kind}/${id}`),
    retry: false,
  });
}

export const useImpact = (kind: Kind, id: number | null) =>
  useQuery({
    queryKey: [kind, id, "impact"],
    queryFn: () => api<Impact>(`/${kind}/${id}/impact`),
    enabled: id !== null,
  });

/**
 * A mutation that refreshes every query once it's done, so every screen shows the change;
 * `gone` names the key prefix of a deleted record, whose queries would only 404.
 */
export function useChange<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, gone?: (args: TArgs) => unknown[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: (_data, _error, args) => {
      const skip = gone?.(args);
      return queryClient.invalidateQueries({
        predicate: (q) => !skip || !skip.every((part, i) => q.queryKey[i] === part),
      });
    },
  });
}

/** Create a record, or replace it when an id is given. */
export function useSave<T>(kind: Kind) {
  return useChange(({ id, body }: { id?: number; body: unknown }) =>
    id ? api<T>(`/${kind}/${id}`, "PUT", body) : api<T>(`/${kind}`, "POST", body),
  );
}

export const useDelete = (kind: Kind) =>
  useChange((id: number) => api<void>(`/${kind}/${id}`, "DELETE"), (id) => [kind, id]);

export const useLogActivity = () => useChange((body: ActivityIn) => api<Activity>("/activities", "POST", body));

export const useUpdateActivity = () =>
  useChange(({ id, body }: { id: number; body: ActivityIn }) => api<Activity>(`/activities/${id}`, "PUT", body));

export const useDeleteActivity = () => useChange((id: number) => api<void>(`/activities/${id}`, "DELETE"));

export const useSetDone = () =>
  useChange(({ id, done }: { id: number; done: boolean }) => api<Activity>(`/activities/${id}`, "PATCH", { done }));

export type Move = { id: number; stage: Stage; index: number };

/** Move a deal on the board: the cached deals change at once, and roll back if the server says no. */
export function useMoveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, index }: Move) => api<Deal>(`/deals/${id}/move`, "POST", { stage, index }),
    onMutate: async (move: Move) => {
      await queryClient.cancelQueries({ queryKey: ["deals"], exact: true });
      const previous = queryClient.getQueryData<Deal[]>(["deals"]);
      if (previous?.some((d) => d.id === move.id)) {
        const columns = moveCard(columnsFrom(previous), move.id, move.stage, move.index);
        queryClient.setQueryData(["deals"], Object.values(columns).flat());
      }
      return { previous };
    },
    onError: (_error, _move, result) => {
      queryClient.setQueryData(["deals"], result?.previous);
      toast("Couldn't move the deal");
    },
    onSettled: () => queryClient.invalidateQueries(),
  });
}
