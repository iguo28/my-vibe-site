"use client";

import { CoffeeBeanIcon } from "@/components/CoffeeBeanIcon";

type Props = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
};

export function BeanRating({ label, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-espresso">{label}</span>
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label={label}
      >
        {[1, 2, 3, 4, 5].map((bean) => (
          <button
            key={bean}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === bean ? null : bean)}
            className="rounded p-1 transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            aria-label={`${bean} out of 5 coffee beans`}
            aria-pressed={value != null && bean <= value}
          >
            <CoffeeBeanIcon filled={value != null && bean <= value} />
          </button>
        ))}
      </div>
    </div>
  );
}
