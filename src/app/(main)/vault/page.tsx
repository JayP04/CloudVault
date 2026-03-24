"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PinPad } from "@/components/vault/pin-pad";
import { deriveKey, encrypt, decrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/client";

const VERIFY_KEY = "cv_vault_verify";
const SALT_KEY = "cv_vault_salt";
const VERIFICATION_PLAINTEXT = "cloudvault-pin-ok";
const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

type VaultState = "loading" | "setup" | "setup-confirm" | "locked" | "unlocked";

export default function VaultPage() {
  const [state, setState] = useState<VaultState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [setupPin, setSetupPin] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Get user ID for salt
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Determine initial state
  useEffect(() => {
    const hasVerify = localStorage.getItem(VERIFY_KEY);
    setState(hasVerify ? "locked" : "setup");
  }, []);

  // Auto-lock on inactivity
  const resetLockTimer = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      setState((s) => (s === "unlocked" ? "locked" : s));
    }, AUTO_LOCK_MS);
  }, []);

  useEffect(() => {
    if (state !== "unlocked") return;
    resetLockTimer();
    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, resetLockTimer));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetLockTimer));
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [state, resetLockTimer]);

  // Lock when navigating away
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && state === "unlocked") setState("locked");
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state]);

  // ── Setup: first PIN entry ──────────────────────────────────────────
  async function handleSetupPin(pin: string) {
    setError(null);
    if (pin.length < 4) { setError("PIN must be at least 4 digits"); return; }
    setSetupPin(pin);
    setState("setup-confirm");
  }

  // ── Setup: confirm PIN ──────────────────────────────────────────────
  async function handleConfirmPin(pin: string) {
    setError(null);
    if (pin !== setupPin) {
      setError("PINs don't match — try again");
      return;
    }
    if (!userId) { setError("Not authenticated"); return; }

    const key = await deriveKey(pin, userId);
    const encoder = new TextEncoder();
    const { iv, ciphertext } = await encrypt(encoder.encode(VERIFICATION_PLAINTEXT).buffer as ArrayBuffer, key);

    // Store iv + ciphertext as base64
    const blob = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    blob.set(iv, 0);
    blob.set(new Uint8Array(ciphertext), iv.length);
    localStorage.setItem(VERIFY_KEY, btoa(String.fromCharCode(...blob)));
    localStorage.setItem(SALT_KEY, userId);

    setState("unlocked");
  }

  // ── Unlock ──────────────────────────────────────────────────────────
  async function handleUnlockPin(pin: string) {
    setError(null);
    const salt = localStorage.getItem(SALT_KEY);
    const verifyBlob = localStorage.getItem(VERIFY_KEY);
    if (!salt || !verifyBlob) { setError("Vault data missing"); return; }

    const raw = Uint8Array.from(atob(verifyBlob), (c) => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const ciphertext = raw.slice(12);

    try {
      const key = await deriveKey(pin, salt);
      const plainBuf = await decrypt(ciphertext.buffer as ArrayBuffer, key, iv);
      const plain = new TextDecoder().decode(plainBuf);
      if (plain !== VERIFICATION_PLAINTEXT) throw new Error("mismatch");
      setState("unlocked");
    } catch {
      setError("Incorrect PIN");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-neutral-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "setup") {
    return (
      <PinPad
        title="Set a Vault PIN"
        subtitle="Protect your most private photos and files"
        error={error}
        onSubmit={handleSetupPin}
      />
    );
  }

  if (state === "setup-confirm") {
    return (
      <PinPad
        title="Confirm PIN"
        subtitle="Enter the same PIN again"
        error={error}
        onSubmit={handleConfirmPin}
      />
    );
  }

  if (state === "locked") {
    return (
      <PinPad
        title="Enter Vault PIN"
        subtitle="Unlock to view protected content"
        error={error}
        onSubmit={handleUnlockPin}
      />
    );
  }

  // Unlocked
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Vault</h1>
        <button
          onClick={() => setState("locked")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Lock
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-neutral-500 text-sm max-w-xs">
          Your vault is empty. Select photos from Library and choose &ldquo;Move to Vault&rdquo; to encrypt and protect them.
        </p>
      </div>
    </div>
  );
}
