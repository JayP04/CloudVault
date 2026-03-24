import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/library");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FF6482] via-[#FF2D55] to-[#FF375F] flex items-center justify-center shadow-lg shadow-pink-500/20">
          <svg
            className="w-9 h-9 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
          CloudVault
        </h1>
        <p className="text-lg text-[#98989d] mb-10">
          Your photos. Your privacy. 10x cheaper than iCloud.
        </p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link
            href="/signup"
            className="block w-full py-3 px-6 text-center text-sm font-semibold text-white bg-[#0A84FF] hover:bg-[#0070E0] rounded-xl transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 px-6 text-center text-sm font-semibold text-white bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
