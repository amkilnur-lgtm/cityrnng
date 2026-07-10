import Link from "next/link";
import { PageHero, PageShell } from "@/components/site/page-shell";
import { Wrap } from "@/components/site/wrap";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Политика приватности · CITYRNNG" };

export default async function PrivacyPage() {
  const state = await getSiteState();
  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="приватность"
        title={
          <>
            Какие данные мы&nbsp;берём — и&nbsp;<em className="not-italic text-brand-red">что с&nbsp;ними делаем</em>.
          </>
        }
        lede="Коротко: храним только то, что нужно, чтобы засчитать пробежку и начислить баллы. Никаких GPS-треков, сторонних трекеров и продажи данных."
      />

      <Body />
    </PageShell>
  );
}

function Body() {
  return (
    <section className="border-b border-ink">
      <Wrap className="flex flex-col gap-12 py-12 lg:py-16">
        <Section h="Кто оператор">
          <P>
            Сервис CITYRNNG («Ситираннинг»), сайт <Link href="/" className="text-ink underline underline-offset-4 hover:text-brand-red">cityrunning.online</Link>{" "}
            (плюс staging-окружение <code className="bg-paper-2 px-1.5 py-0.5 font-mono text-[13px] text-ink">staging.cityrunning.online</code>).
            Связь — <a href="mailto:cityrnng@yandex.com" className="text-ink underline underline-offset-4 hover:text-brand-red">cityrnng@yandex.com</a>.
          </P>
        </Section>

        <Section h="Какие данные мы собираем">
          <List
            items={[
              <>
                <b>Email и пароль</b> (пароль храним только в виде хеша) — для входа
                и связи по событиям. Никаких рассылок без твоего явного согласия.
              </>,
              <>
                <b>Имя / отображаемое имя / профильные поля</b> (город, Telegram, Instagram) —
                то, что ты сам заполняешь в личном кабинете. Можешь удалить в любой момент.
              </>,
              <>
                <b>Персональный код отметки (QR)</b> и журнал сканов: когда и на какой точке
                ты отметился. Это единственное, что нужно, чтобы засчитать приход.
              </>,
              <>
                <b>История посещений и баллы.</b> Создаём при отметке на пробежке —
                это наши производные данные, нужны для ленты в кабинете и истории обменов.
              </>,
              <>
                <b>Технические метаданные</b>: IP-адрес сессии, user-agent, timestamps. Нужны для
                безопасности и отладки.
              </>,
            ]}
          />
        </Section>

        <Section h="Как засчитывается пробежка">
          <P>
            На точке сбора стоит сканер. Ты подносишь свой персональный QR (с телефона
            или брелока) — сканер передаёт нам код, точку и время. Если рядом идёт наша
            пробежка, мы записываем посещение и начисляем баллы.
          </P>
          <List
            items={[
              <>
                Мы <b>не собираем GPS-треки</b>, не читаем данные с часов и не подключаемся
                к сторонним сервисам. Фиксируется только факт: кто, когда, на какой точке.
              </>,
              <>
                Журнал сканов используется для начисления баллов и диагностики сканеров.
                Никто кроме тебя и администраторов клуба не видит твою историю посещений.
              </>,
            ]}
          />
          <P>
            Мы <b>не продаём, не передаём третьим лицам и не используем для аналитики/ML</b>{" "}
            твои данные.
          </P>
        </Section>

        <Section h="Кому передаём данные">
          <List
            items={[
              <>
                <b>Resend</b> (resend.com, US/EU) — провайдер транзакционной почты. Получает твой
                email, чтобы отправить письмо для входа или сброса пароля.
              </>,
              <>
                <b>Sentry</b> (sentry.io, EU) — диагностика ошибок. Может попасть IP и user-agent;
                персональные данные мы отдельно туда не пишем.
              </>,
              <>
                <b>Хостинг</b> — datacheap.nl (NL VPS). Данные базы лежат там.
              </>,
            ]}
          />
        </Section>

        <Section h="Твои права">
          <List
            items={[
              <>
                Запросить копию своих данных — пиши на{" "}
                <a href="mailto:cityrnng@yandex.com" className="text-ink underline underline-offset-4 hover:text-brand-red">cityrnng@yandex.com</a>.
              </>,
              <>
                Удалить аккаунт целиком — там же. Удалим в течение 30 дней.
              </>,
              <>Поменять имя/город/контакты — в личном кабинете самостоятельно.</>,
            ]}
          />
        </Section>

        <Section h="Если что-то изменится">
          <P>
            Когда меняем эту политику — напишем тебе на email и обновим дату внизу. Не молча.
          </P>
        </Section>

        <p className="border-t border-ink/15 pt-6 font-mono text-[11px] text-muted">
          Последнее обновление: 19 мая 2026. Версия 1.
        </p>
      </Wrap>
    </section>
  );
}

function Section({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="type-h2">{h}</h2>
      <div className="flex max-w-[720px] flex-col gap-3 text-[15px] leading-[1.6] text-graphite">
        {children}
      </div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2 pl-5 [&>li]:list-disc [&>li]:marker:text-brand-red">
      {items.map((it, idx) => (
        <li key={idx}>{it}</li>
      ))}
    </ul>
  );
}
