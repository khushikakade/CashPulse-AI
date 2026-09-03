import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  badge?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  onSecondaryAction?: () => void;
  variant?: "sage" | "peach" | "honey" | "lavender" | "neutral";
}

export default function EmptyState({
  icon: Icon,
  badge,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  onSecondaryAction,
  variant = "sage"
}: EmptyStateProps) {
  const variantStyles = {
    sage: {
      bg: "bg-[#EAF3ED]",
      border: "border-[#BBDCC7]",
      icon: "text-[#194F34]",
      badge: "badge-sage"
    },
    peach: {
      bg: "bg-[#FDF0EB]",
      border: "border-[#F5C7B5]",
      icon: "text-[#8E3015]",
      badge: "badge-peach"
    },
    honey: {
      bg: "bg-[#FEF8E8]",
      border: "border-[#FADF96]",
      icon: "text-[#784C07]",
      badge: "badge-honey"
    },
    lavender: {
      bg: "bg-[#F4F1FB]",
      border: "border-[#D3C7F0]",
      icon: "text-[#452F75]",
      badge: "badge-lavender"
    },
    neutral: {
      bg: "bg-[#F4F1EA]",
      border: "border-[#E5E1D8]",
      icon: "text-[#54504A]",
      badge: "badge-neutral"
    }
  };

  const style = variantStyles[variant] || variantStyles.sage;

  return (
    <div className="warm-card p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto w-full my-6 border border-dashed border-[#D6D1C5]">
      {/* Icon Capsule */}
      <div className={`w-14 h-14 rounded-2xl ${style.bg} border ${style.border} ${style.icon} flex items-center justify-center shadow-xs transition-transform hover:scale-105 duration-200`}>
        <Icon className="w-7 h-7" />
      </div>

      {/* Badge */}
      {badge && (
        <span className={`${style.badge} text-[11px] font-semibold px-3 py-1`}>
          {badge}
        </span>
      )}

      {/* Title & Copy */}
      <div className="space-y-1.5 max-w-md">
        <h3 className="font-display text-lg sm:text-xl font-bold text-[#141312] tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#54504A] leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Buttons */}
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="btn-primary min-h-[44px] text-xs px-5 py-2.5 rounded-xl flex items-center gap-2"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {actionLabel && !actionHref && onAction && (
            <button
              onClick={onAction}
              className="btn-primary min-h-[44px] text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="btn-secondary min-h-[44px] text-xs px-4 py-2.5 rounded-xl"
            >
              {secondaryLabel}
            </Link>
          )}

          {secondaryLabel && !secondaryHref && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="btn-secondary min-h-[44px] text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
