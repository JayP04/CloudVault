import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  const user = profile as User | null;
  if (!user) return null;

  const storagePercent = Math.min(
    (user.storage_used_bytes / user.storage_quota_bytes) * 100,
    100
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-[22px] font-bold text-white mb-8">Settings</h1>

      {/* Account */}
      <section className="mb-10">
        <h2 className="text-[11px] font-semibold text-[#636366] uppercase tracking-wider mb-4">
          Account
        </h2>
        <div className="bg-[#2c2c2e] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#98989d]">Email</span>
            <span className="text-sm font-medium text-white">
              {user.email}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#98989d]">Sign-in method</span>
            <span className="text-sm font-medium text-white capitalize">
              {user.auth_provider}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#98989d]">Member since</span>
            <span className="text-sm font-medium text-white">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </section>

      {/* Storage */}
      <section className="mb-10">
        <h2 className="text-[11px] font-semibold text-[#636366] uppercase tracking-wider mb-4">
          Storage
        </h2>
        <div className="bg-[#2c2c2e] rounded-2xl p-5">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-[#98989d]">
              {formatBytes(user.storage_used_bytes)} of{" "}
              {formatBytes(user.storage_quota_bytes)} used
            </span>
            <span className="font-medium text-white">
              {storagePercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all ${
                storagePercent > 90 ? "bg-[#FF453A]" : "bg-[#0A84FF]"
              }`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">
                {user.total_files}
              </p>
              <p className="text-xs text-[#98989d]">Total files</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {user.image_count}
              </p>
              <p className="text-xs text-[#98989d]">Photos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {user.video_count}
              </p>
              <p className="text-xs text-[#98989d]">Videos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Import Sources - placeholder for Phase 3 */}
      <section className="mb-10">
        <h2 className="text-[11px] font-semibold text-[#636366] uppercase tracking-wider mb-4">
          Import
        </h2>
        <div className="bg-[#2c2c2e] rounded-2xl p-5 text-center py-10">
          <p className="text-sm text-[#98989d]">
            Import from Google Photos, iCloud, and more — coming soon.
          </p>
        </div>
      </section>
    </div>
  );
}
