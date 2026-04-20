import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { Flower } from "@/components/brand/flower";

export const metadata = { title: "Design · CITYRNNG" };

const tokens = [
  { name: "ink", hex: "#0A0A0A", class: "bg-ink", light: true },
  { name: "paper", hex: "#FFFFFF", class: "bg-paper border border-line", light: false },
  { name: "paper-warm", hex: "#FAF7F2", class: "bg-paper-warm border border-line", light: false },
  { name: "muted", hex: "#6B6B6B", class: "bg-muted", light: true },
  { name: "line", hex: "#E5E5E5", class: "bg-line", light: false },
  { name: "brand.red", hex: "#ED1C24", class: "bg-brand-red", light: true },
  { name: "brand.red-ink", hex: "#C8151C", class: "bg-brand-red-ink", light: true },
  { name: "brand.peach", hex: "#F7966B", class: "bg-brand-peach", light: true },
  { name: "brand.yellow", hex: "#F4D03F", class: "bg-brand-yellow", light: false },
];

export default function DesignPage() {
  return (
    <main className="overflow-hidden bg-paper-warm text-ink">
      {/* Hero */}
      <section className="relative border-b-2 border-ink">
        <div className="mx-auto grid max-w-6xl grid-cols-12 items-center gap-8 px-6 py-20 md:py-28">
          <div className="col-span-12 flex flex-col gap-6 md:col-span-7">
            <div className="flex items-center gap-3">
              <Flower size={24} />
              <span className="font-mono text-small uppercase tracking-[0.18em] text-muted">
                design foundation · v0
              </span>
            </div>
            <Image
              src="/brand/wordmark.png"
              alt="Ситираннинг"
              width={520}
              height={160}
              priority
              className="h-auto w-[min(520px,80vw)]"
            />
            <p className="max-w-md font-display text-h2 text-ink">
              Бегаешь по городу — получаешь баллы — обмениваешь у соседа.
            </p>
            <p className="max-w-md text-body text-muted">
              Эта страница — черновая витрина брендовых токенов и примитивов. Новый компонент
              попадает сюда первым, в продуктовые экраны — вторым.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button variant="primary" size="lg">Подключить Strava</Button>
              <Button variant="outline" size="lg">Как это работает</Button>
            </div>
          </div>
          <div className="relative col-span-12 md:col-span-5">
            <Image
              src="/brand/character.png"
              alt=""
              width={600}
              height={600}
              priority
              className="relative z-10 h-auto w-full max-w-[460px] md:ml-auto"
            />
            <Flower
              size={68}
              rotate={-18}
              className="absolute -left-4 top-10 z-0"
            />
            <Flower
              size={40}
              rotate={24}
              className="absolute bottom-6 right-6 z-20 text-brand-red"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-20">
        <Section title="Colors" number="01">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {tokens.map((t) => (
              <div key={t.name} className="flex flex-col gap-2">
                <div className={`h-24 w-full rounded-lg ${t.class}`} />
                <div className="flex items-baseline justify-between font-mono text-small">
                  <span className="text-ink">{t.name}</span>
                  <span className="text-muted">{t.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography" number="02" note="Unbounded · display / Manrope · body">
          <div className="flex flex-col gap-7 rounded-xl border-2 border-ink bg-paper px-8 py-10">
            <p className="font-display text-display-lg text-ink">Бегаешь по городу</p>
            <p className="font-display text-display text-ink">Получаешь баллы</p>
            <p className="font-display text-h1 text-ink">Обмениваешь на кофе у соседа</p>
            <div className="h-px w-full bg-line" />
            <p className="text-h2 text-ink">Subheading · h2 / Manrope 600</p>
            <p className="text-h3 text-ink">Section heading · h3 / Manrope 600</p>
            <p className="text-h4 text-ink">Card title · h4 / Manrope 600</p>
            <p className="max-w-prose text-body text-ink">
              Body — Manrope, 15 / 24. Типичный параграф для marketing-страниц и карточек:
              сбалансированная ширина, кириллица читается ровно, без хищных засечек.
            </p>
            <p className="text-small text-muted">Small / caption · 13 / 19 · muted tone</p>
          </div>
        </Section>

        <Section title="Buttons" number="03" note="primary = бренд-красный, marker-shadow">
          <div className="flex flex-col gap-6 rounded-xl border-2 border-ink bg-paper px-8 py-10">
            <Row label="variants">
              <Button variant="primary">Primary (accent)</Button>
              <Button variant="ink">Ink</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link-style</Button>
            </Row>
            <Row label="sizes">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>
            <Row label="states">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button>
                <Flower size={16} />
                С цветочком
              </Button>
              <Button variant="outline">
                Дальше
                <span aria-hidden>→</span>
              </Button>
            </Row>
          </div>
        </Section>

        <Section title="Form" number="04">
          <div className="grid max-w-md gap-5 rounded-xl border-2 border-ink bg-paper px-8 py-10">
            <Field label="Email" helper="Ссылку для входа отправим сюда">
              <Input type="email" placeholder="you@example.com" defaultValue="ilnurxma@outlook.com" />
            </Field>
            <Field label="Город" error="Мы пока работаем только в Уфе">
              <Input placeholder="Москва" defaultValue="Новосибирск" aria-invalid />
            </Field>
            <Button className="w-fit">Получить ссылку</Button>
          </div>
        </Section>

        <Section title="Cards" number="05">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Card className="relative">
              <Flower size={28} rotate={12} className="absolute -right-2 -top-2 z-10" />
              <CardHeader>
                <Badge variant="muted">Четверг · 19:00</Badge>
                <CardTitle>Забег по набережной</CardTitle>
                <CardDescription>5 км · лёгкий темп · после — кофе у партнёров</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-small text-muted">Сбор у речного вокзала. Регистрация открыта.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Подробнее</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <Badge variant="outline">Баланс</Badge>
                <CardTitle>Ваши баллы</CardTitle>
                <CardDescription>За подтверждённые пробежки</CardDescription>
              </CardHeader>
              <CardContent className="flex items-baseline gap-3">
                <span className="font-display text-display text-brand-red">650</span>
                <span className="text-small text-muted">+150 за последнюю</span>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">История</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <Badge variant="accent">Partner</Badge>
                <CardTitle>Кофейня "Жираф"</CardTitle>
                <CardDescription>Капучино за 300 баллов, срок действия 30 дней</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-small text-muted">Ул. Ленина 24 · 10:00–22:00</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">Обменять</Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        <Section title="Badges" number="06">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-ink bg-paper px-8 py-10">
            <Badge>default</Badge>
            <Badge variant="muted">muted</Badge>
            <Badge variant="accent">accent</Badge>
            <Badge variant="outline">outline</Badge>
          </div>
        </Section>

        <Section title="Links" number="07">
          <div className="flex flex-col gap-3 rounded-xl border-2 border-ink bg-paper px-8 py-10 text-body">
            <p>
              Мы партнёримся с локальными кофейнями, студиями и спортивными брендами. {" "}
              <Link href="/partners">Смотрите список партнёров</Link> — список пополняется каждую неделю.
            </p>
            <p>
              Не получили письмо? {" "}
              <Link href="/help/login">Разбираемся, что делать</Link>.
            </p>
          </div>
        </Section>

        <Section title="Brand showcase" number="08" note="реальные ассеты из bundle">
          <div className="rounded-xl border-2 border-ink bg-paper p-4">
            <Image
              src="/brand/stickers.png"
              alt="CITYRNNG stickerpack × lampabegaet"
              width={1400}
              height={1800}
              className="mx-auto h-auto w-full"
            />
          </div>
        </Section>

        <Section title="Accent usage · пустое состояние" number="09">
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-ink bg-paper-warm px-6 py-16 text-center">
            <Image
              src="/brand/character.png"
              alt=""
              width={240}
              height={240}
              className="mx-auto h-auto w-[160px]"
            />
            <h3 className="mt-4 font-display text-h1 text-ink">Пока нет событий</h3>
            <p className="mx-auto mt-2 max-w-sm text-body text-muted">
              Тут появятся городские пробежки и специальные старты. Подключите Strava, чтобы участие
              засчитывалось автоматически.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button>Подключить Strava</Button>
              <Button variant="outline">Посмотреть прошлые</Button>
            </div>
            <Flower size={44} rotate={-12} className="absolute left-8 top-8" />
            <Flower size={28} rotate={16} className="absolute bottom-10 right-10" />
            <Flower size={20} rotate={45} className="absolute right-24 top-12" />
          </div>
        </Section>

        <footer className="mt-12 flex items-center justify-between border-t-2 border-ink pt-8 text-small text-muted">
          <p>
            /design · обновляется вместе с токенами. Новый UI-компонент — сюда первым.
          </p>
          <span className="font-mono">cityrnng × lampabegaet</span>
        </footer>
      </div>
    </main>
  );
}

function Section({
  title,
  number,
  note,
  children,
}: {
  title: string;
  number: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-20">
      <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-line pb-3">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-small text-muted">{number}</span>
          <h2 className="font-display text-h2 text-ink">{title}</h2>
        </div>
        {note ? <span className="text-small text-muted">{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-24 font-mono text-small uppercase tracking-[0.1em] text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  helper,
  error,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-ink">{label}</span>
      {children}
      {error ? (
        <span className="text-small text-brand-red">{error}</span>
      ) : helper ? (
        <span className="text-small text-muted">{helper}</span>
      ) : null}
    </label>
  );
}
