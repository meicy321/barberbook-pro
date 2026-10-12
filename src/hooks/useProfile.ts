import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { roleFromProfile } from "@/lib/roles";

export const profileQueryKey = (userId: string) => ["profile", userId] as const;

/** The signed-in user's own profiles row (RLS: only the owner can read it). */
export function useProfile(userId: string) {
  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, display_name, bank_account_name, bank_account_number")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return { ...data, role: roleFromProfile(data.role) };
    },
  });
}

/** One-off role lookup used right after sign-in. */
export async function fetchRole(userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return roleFromProfile(data?.role);
}
