import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAlert,
  deleteAlert,
  listAlerts,
  setAlertActive,
} from "@/features/alerts/alerts.api";
import { useAuth } from "@/contexts/AuthContext";

export const ALERTS_KEY = ["alerts"];

type SetAlertActivePayload = { id: string; isActive: boolean };

export const useAlerts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ALERTS_KEY,
    queryFn: listAlerts,
    enabled: !!user,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
};

export const useSetAlertActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: SetAlertActivePayload) => setAlertActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
};
