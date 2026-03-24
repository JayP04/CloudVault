import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MainShell } from "@/components/layout/main-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user profile for sidebar
  const { data: profile } = await supabase
    .from("users")
    .select("email, display_name, avatar_url, storage_used_bytes, storage_quota_bytes")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-dvh overflow-hidden bg-black">
      <Sidebar
        user={{
          email: profile?.email ?? user.email ?? "",
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          storageUsed: profile?.storage_used_bytes ?? 0,
          storageQuota: profile?.storage_quota_bytes ?? 53687091200,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-[#1d1d1f]">
        <MainShell>{children}</MainShell>
      </main>
    </div>
  );
}
