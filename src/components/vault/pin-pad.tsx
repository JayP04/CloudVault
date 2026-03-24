"use client";

import { useState, useEffect, useCallback } from "react";

type Props = {
  title: string;
  subtitle?: string;
  maxLength?: number;
  error?: string | null;
  onSubmit: (pin: string) => void;
};

export function PinPad({ title, subtitle, maxLength = 6, error, onSubmit }: Props) {
  const [pin, setPin] = useState("");
  const [shaking, setShaking] = useState(false);

  // Shake on error
  useEffect(() => {
    if (error) {
      setShaking(true);
      setPin("");
      const timer = setTimeout(() => setShaking(false), 400);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const addDigit = useCallback(
    (d: string) => {
      setPin((prev) => {
        const next = prev + d;
        if (next.length >= 4 && next.length <= maxLength) {
          // Auto-submit when reaching min length; submit on each additional digit
          setTimeout(() => onSubmit(next), 50);
        }
        return next.length <= maxLength ? next : prev;
      });
    },
    [maxLength, onSubmit]
  );

  const deleteDigit = () => setPin((prev) => prev.slice(0, -1));

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] select-none">
      <h2 className="text-xl font-bold text-neutral-900 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-neutral-500 mb-8">{subtitle}</p>}

      {/* PIN dots */}
      <div className={`flex gap-3 mb-3 ${shaking ? "animate-shake" : ""}`}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-150 ${
              i < pin.length ? "bg-neutral-900 scale-110" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      <div className="h-5 mb-4">
        {error && <p className="text-[13px] text-red-500 font-medium">{error}</p>}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => addDigit(String(n))}
            className="w-16 h-16 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-xl font-medium text-neutral-900 transition-colors flex items-center justify-center"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => addDigit("0")}
          className="w-16 h-16 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-xl font-medium text-neutral-900 transition-colors flex items-center justify-center"
        >
          0
        </button>
        <button
          onClick={deleteDigit}
          className="w-16 h-16 rounded-full hover:bg-neutral-100 transition-colors flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
