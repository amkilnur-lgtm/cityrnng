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
        lede="Коротко: храним только то, что нужно, чтобы засчитать пробежку и начислить баллы. Strava-данные удаляются через 7 дней, как требует Strava. Отключаешься — всё уходит за сутки."
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
                <b>Email</b> — чтобы прислать тебе магик-линк для входа и контактировать
                по событиям. Никаких рассылок без твоего явного согласия.
              </>,
              <>
                <b>Имя / отображаемое имя / профильные поля</b> (город, Telegram, Instagram) —
                то, что ты сам заполняешь в личном кабинете. Можешь удалить в любой момент.
              </>,
              <>
                <b>Данные о пробежках со Strava</b> (если подключил): дистанция, время, координаты
                старта и финиша, тип активности. Используются для матча с расписанием Ситираннинга
                и начисления баллов.
              </>,
              <>
                <b>История точек посещения и баллы.</b> Создаём при матче пробежки с событием —
                это уже наши производные данные, нужны для ленты в кабинете и истории редимов.
              </>,
              <>
                <b>Технические метаданные</b>: IP-адрес сессии, user-agent, timestamps. Нужны для
                безопасности и отладки.
              </>,
            ]}
          />
        </Section>

        <Section h="Как работает интеграция со Strava">
          <P>
            Чтобы засчитывать пробежки автоматически, мы подключаемся к Strava по протоколу OAuth2.
            На странице подключения ты явно даёшь нашему приложению разрешение читать твои
            активности (scope <code className="bg-paper-2 px-1.5 py-0.5 font-mono text-[13px] text-ink">activity:read</code>). В любой момент можешь
            отозвать доступ — в Strava или у нас на странице профиля.
          </P>
          <P>
            <b>Что мы храним из Strava и как долго:</b>
          </P>
          <List
            items={[
              <>
                Сырые данные активности (дистанция, время, координаты) — <b>не дольше 7 дней</b>{" "}
                в нашем кеше. Этого требует API-соглашение Strava (§7.1).
              </>,
              <>
                После 7 дней сырые записи удаляются автоматически. Остаются только наши
                производные: что мы посчитали тебе как посещение события и начислили баллов.
              </>,
              <>
                При <b>отключении Strava</b> на странице профиля — все Strava-производные данные
                (активности и связанные посещения) удаляются <b>в течение 48 часов</b>, как требует
                Strava (§2.14.vi). Баллы, которые уже начислены, остаются как часть твоей истории
                в кабинете.
              </>,
            ]}
          />
          <P>
            Мы <b>не продаём, не передаём третьим лицам и не используем для аналитики/ML</b>{" "}
            твои Strava-данные. Никто кроме тебя не видит твою историю пробежек у нас.
          </P>
        </Section>

        <Section h="Кому передаём данные">
          <List
            items={[
              <>
                <b>Resend</b> (resend.com, US/EU) — провайдер транзакционной почты. Получает твой
                email, чтобы отправить магик-линк.
              </>,
              <>
                <b>Strava</b> (strava.com, US) — если ты подключил аккаунт. Мы делаем запросы
                к их API, они видят, что от твоего имени пришёл запрос.
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
              <>
                Отключить Strava — кнопка «Отключить Strava» в личном кабинете. Strava-данные
                уходят сразу.
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
