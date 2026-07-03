import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAlert,
  deleteAlert,
  listAlerts,
  setAlertActive,
} from "@/features/alerts/alerts.api";
import { useAuth } from "@/contexts/AuthContext";

export const ALERTS_KEY = ["alerts"];

export function useAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ALERTS_KEY,
    queryFn: listAlerts,
    enabled: !!user,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
}

export function useSetAlertActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setAlertActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
}
