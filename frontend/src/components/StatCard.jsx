
import { ArrowUpRight } from "lucide-react";

const variants = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    accent: "bg-blue-500",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    accent: "bg-emerald-500",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    accent: "bg-amber-500",
  },
  purple: {
    icon: "bg-violet-50 text-violet-600",
    accent: "bg-violet-500",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    accent: "bg-rose-500",
  },
  cyan: {
    icon: "bg-cyan-50 text-cyan-600",
    accent: "bg-cyan-500",
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color = "blue",
}) {
  const theme = variants[color] || variants.blue;

  return (
    <div className="card group relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60">
      <div
        className={`absolute left-0 top-0 h-full w-1 ${theme.accent}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 break-words text-[clamp(1.25rem,2vw,1.65rem)] font-extrabold tracking-tight text-slate-900">
            {value ?? "—"}
          </h3>
        </div>

        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.icon}`}
          >
            <Icon size={22} strokeWidth={1.9} />
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          {subtitle || "Current overview"}
        </p>

        <ArrowUpRight
          size={16}
          className="shrink-0 text-slate-300 transition-colors group-hover:text-blue-500"
        />
      </div>
    </div>
  );
}
