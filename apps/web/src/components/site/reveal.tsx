"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Лёгкий fade-up на скролле — секция всплывает на 8px и появляется
 * при попадании в окно. Один раз, не повторяется.
 *
 * Уважает `prefers-reduced-motion: reduce` — пользователям с
 * настройкой ОС «уменьшить движение» сразу показывает финальный
 * кадр, без перехода.
 *
 * Лежит в `site/`, потому что reusable (не только для главной).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => setVisible(true), delay);
            } else {
              setVisible(true);
            }
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={
        "translate-y-2 opacity-0 transition-all duration-700 ease-out " +
        "data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 " +
        className
      }
    >
      {children}
    </div>
  );
}
