import clsx from "clsx";

interface OtpDisplayProps {
  value: string;
  length?: number;
}

const baseSlotStyles =
  "flex h-12 w-10 sm:h-16 sm:w-12 md:h-20 md:w-16 items-center justify-center rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-white/20 bg-white/5 text-xl sm:text-2xl md:text-4xl font-semibold text-foreground transition-colors duration-150 shadow-[0_10px_40px_rgba(0,0,0,0.4)]";

export function OtpDisplay({ value, length = 6 }: OtpDisplayProps) {
  const slots = Array.from({ length });

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
      {slots.map((_, index) => {
        const isFilled = Boolean(value[index]);
        const isActive = index === value.length;
        const digit = value[index] ?? "";

        return (
          <div
            key={`otp-slot-${index}`}
            className={clsx(baseSlotStyles, {
              "border-primary bg-primary/10 text-primary": isFilled,
              "border-white/60 bg-white/15": isActive,
            })}
            aria-label={`Dígito ${index + 1}`}
          >
            {digit}
          </div>
        );
      })}
    </div>
  );
}
