import Link from "next/link";
import { CLUB } from "@/lib/club";

type Column = { title: string; links: Array<{ href: string; label: string }> };

const COLUMNS: Column[] = [
  {
    title: "Продукт",
    links: [
      { href: "/events", label: "События" },
      { href: "/shop", label: "Магазин" },
      { href: "/districts", label: "Карта районов" },
      { href: "/partners", label: "Партнёрам" },
    ],
  },
  {
    title: "Клуб",
    links: [
      { href: "/about", label: "О проекте" },
      { href: "/journal", label: "Журнал" },
      { href: "/faq", label: "FAQ" },
      { href: "/contacts", label: "Контакты" },
    ],
  },
  {
    title: "Связь",
    links: [
      { href: "mailto:hello@cityrnng.ru", label: "hello@cityrnng.ru" },
      { href: "https://t.me/cityrnng", label: "Telegram-канал" },
      { href: "https://instagram.com/cityrnng", label: "Instagram" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink bg-paper">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:px-12 lg:py-16">
        <div className="flex flex-col gap-3">
          <span className="type-mono-caps text-ink">
            CITYRNNG · {CLUB.city.toUpperCase()} · 2026
          </span>
          <p className="max-w-xs text-[13px] leading-[1.55] text-graphite">
            Соседский беговой клуб. Бесплатно, без&nbsp;секундомера,
            с&nbsp;кофе на&nbsp;финише.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h4 className="font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-ink">
              {col.title}
            </h4>
            {col.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[14px] text-graphite transition-colors hover:text-brand-red"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-ink/20">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-6 py-6 text-[13px] text-muted md:flex-row md:items-center md:justify-between lg:px-12">
          <span>© 2026 Ситираннинг</span>
          <span className="flex gap-4">
            <Link href="/terms" className="hover:text-ink">
              Условия
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Приватность
            </Link>
            <Link href="/agreement" className="hover:text-ink">
              Соглашение
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
