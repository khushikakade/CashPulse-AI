"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "celebration";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

// Global dispatcher helper functions
export function showToast(title: string, message?: string, type: ToastType = "success") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cashpulse:toast", {
        detail: { title, message, type }
      })
    );
  }
}

export function triggerCelebration(title: string, amountRecovered?: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cashpulse:celebrate", {
        detail: { 
          title: title || "Payment Recovered!", 
          amount: amountRecovered 
        }
      })
    );
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationDetails, setCelebrationDetails] = useState<{ title: string; amount?: number } | null>(null);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; message?: string; type?: ToastType }>;
      const { title, message, type = "success" } = customEvent.detail || {};
      const newToast: ToastItem = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title,
        message
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4500);
    };

    const handleCelebrateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; amount?: number }>;
      setCelebrationDetails(customEvent.detail);
      setCelebrating(true);

      // Dismiss celebration banner after 5 seconds
      setTimeout(() => {
        setCelebrating(false);
      }, 5000);
    };

    window.addEventListener("cashpulse:toast", handleToastEvent);
    window.addEventListener("cashpulse:celebrate", handleCelebrateEvent);

    return () => {
      window.removeEventListener("cashpulse:toast", handleToastEvent);
      window.removeEventListener("cashpulse:celebrate", handleCelebrateEvent);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* Celebratory Fullscreen Confetti Particle Banner */}
      {celebrating && celebrationDetails && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
          <div className="pointer-events-auto bg-[#FFFFFF] border-2 border-[#C8E1D1] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-slide text-center relative overflow-hidden">
            {/* Soft decorative background glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#EAF3ED] rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#FEF8E8] rounded-full blur-2xl pointer-events-none" />

            <div className="w-14 h-14 bg-[#EAF3ED] text-[#225C3E] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>

            <span className="badge-sage text-xs font-semibold mb-2">
              Payment Restored
            </span>

            <h3 className="font-display text-2xl font-bold text-[#1A1A1A] mt-1 mb-2">
              {celebrationDetails.title}
            </h3>

            {celebrationDetails.amount ? (
              <p className="font-display text-3xl font-bold text-[#225C3E] mb-3">
                +₹{celebrationDetails.amount.toLocaleString("en-IN")}
              </p>
            ) : null}

            <p className="text-sm text-[#5C5954] leading-relaxed mb-6 font-sans">
              Funds have been confirmed by the gateway and re-credited to your active working capital pool.
            </p>

            <button
              onClick={() => setCelebrating(false)}
              className="btn-primary w-full text-sm"
            >
              Wonderful, Back to Work
            </button>
          </div>
        </div>
      )}

      {/* Floating In-App Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 md:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success" || toast.type === "celebration";
          const isError = toast.type === "error";
          const isInfo = toast.type === "info";

          const bgBorder = isSuccess
            ? "bg-[#FFFFFF] border-[#C8E1D1] text-[#1A1A1A]"
            : isError
            ? "bg-[#FFFFFF] border-[#F7D4C6] text-[#1A1A1A]"
            : "bg-[#FFFFFF] border-[#E8E5DF] text-[#1A1A1A]";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border shadow-lg animate-fade-slide ${bgBorder}`}
              style={{
                boxShadow: "0 10px 30px -4px rgba(26, 26, 26, 0.08), 0 4px 10px -2px rgba(26, 26, 26, 0.04)"
              }}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && (
                  <div className="w-7 h-7 rounded-full bg-[#EAF3ED] text-[#225C3E] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {isError && (
                  <div className="w-7 h-7 rounded-full bg-[#FDF0EB] text-[#A63C1E] flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {isInfo && (
                  <div className="w-7 h-7 rounded-full bg-[#FEF8E8] text-[#8C5B0D] flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-sm font-semibold text-[#1A1A1A] leading-tight">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="text-xs text-[#5C5954] mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-[#A8A59E] hover:text-[#1A1A1A] transition-colors p-1"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
