"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUpload } from "@/hooks/use-upload";
import { UploadPopover } from "@/components/upload/upload-popover";
import { ImportModal } from "@/components/upload/import-modal";

type SidebarProps = {
  user: {
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    storageUsed: number;
    storageQuota: number;
  };
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isUploading, progress, upload } = useUpload();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const storagePercent = Math.min((user.storageUsed / user.storageQuota) * 100, 100);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-2.5 px-3 py-[6px] rounded-lg text-[13px] transition-colors ${
          active
            ? "bg-white/10 text-white font-medium"
            : "text-[#98989d] hover:bg-white/5 hover:text-white/80"
        }`}
      >
        <span className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[#0A84FF]" : "text-[#636366]"}`}>{icon}</span>
        {label}
      </Link>
    );
  }

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <p className="px-3 pt-6 pb-1 text-[11px] font-semibold text-[#636366] uppercase tracking-wider">
        {children}
      </p>
    );
  }

  const iconLibrary = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>;
  const iconHeart = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
  const iconClock = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const iconAlbum = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>;
  const iconVault = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>;
  const iconTrash = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
  const iconDrive = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" /></svg>;
  const iconSettings = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-52 bg-[#1c1c1e]/95 backdrop-blur-xl text-white shrink-0 select-none border-r border-white/[0.06]">
        {/* Logo — iCloud Photos style */}
        <div className="flex items-center gap-2.5 h-14 px-4 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF6482] via-[#FF2D55] to-[#FF375F] flex items-center justify-center shadow-lg shadow-pink-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-white/90">CloudVault</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 overflow-y-auto">
          <SectionLabel>Photos</SectionLabel>
          <NavItem href="/library" icon={iconLibrary} label="Library" />
          <NavItem href="/favorites" icon={iconHeart} label="Favorites" />
          <NavItem href="/recents" icon={iconClock} label="Recents" />

          <SectionLabel>Collections</SectionLabel>
          <NavItem href="/albums" icon={iconAlbum} label="Albums" />
          <NavItem href="/vault" icon={iconVault} label="Hidden" />
          <NavItem href="/trash" icon={iconTrash} label="Recently Deleted" />

          <SectionLabel>Files</SectionLabel>
          <NavItem href="/drive" icon={iconDrive} label="All Files" />

          {/* Upload */}
          <div className="pt-5 px-1 relative">
            <UploadPopover
              open={popoverOpen}
              onClose={() => setPopoverOpen(false)}
              onImportClick={() => setImportOpen(true)}
            />
            <button
              onClick={() => setPopoverOpen((o) => !o)}
              disabled={isUploading}
              className={`flex items-center justify-center gap-2 w-full py-2 text-[13px] font-medium text-white bg-[#0A84FF] hover:bg-[#0070E0] rounded-lg cursor-pointer transition-colors ${
                isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploading ? (
                <span className="text-xs truncate px-2">{progress}</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload
                </>
              )}
            </button>
          </div>
        </nav>

        {/* Footer: storage + profile */}
        <div className="px-3 py-3 border-t border-white/[0.06] space-y-3">
          {/* Storage */}
          <div>
            <div className="flex justify-between text-[10px] text-[#636366] mb-1">
              <span>{formatBytes(user.storageUsed)} used</span>
              <span>{formatBytes(user.storageQuota)}</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePercent > 90 ? "bg-[#FF453A]" : "bg-[#0A84FF]"
                }`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            {storagePercent > 90 && (
              <p className="text-[9px] text-[#FF453A] mt-1">Storage almost full</p>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5E5CE6] to-[#BF5AF2] flex items-center justify-center text-[11px] font-semibold shrink-0">
              {(user.displayName || user.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#98989d] truncate">
                {user.displayName || user.email}
              </p>
            </div>
            <Link href="/settings" className="text-[#636366] hover:text-white/70 transition-colors">
              <span className="w-4 h-4 block">{iconSettings}</span>
            </Link>
            <button onClick={handleLogout} className="text-[#636366] hover:text-white/70 transition-colors" title="Sign out">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/[0.06] z-50 safe-bottom">
        <div className="flex items-center justify-around h-12">
          {[
            { href: "/library", icon: iconLibrary, label: "Library" },
            { href: "/favorites", icon: iconHeart, label: "Favorites" },
            { href: "/albums", icon: iconAlbum, label: "Albums" },
            { href: "/drive", icon: iconDrive, label: "Files" },
            { href: "/settings", icon: iconSettings, label: "Settings" },
          ].map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 ${
                  active ? "text-[#0A84FF]" : "text-[#636366]"
                }`}
              >
                <span className="w-5 h-5">{item.icon}</span>
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Import Modal */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
