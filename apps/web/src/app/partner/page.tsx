import { Wrap } from "@/components/site/wrap";
import { PartnerVerifyForm } from "@/components/partner/partner-verify-form";
import { listMyMemberships } from "@/lib/api-partner";

export const metadata = { title: "Партнёрский кабинет · CITYRNNG" };

export default async function PartnerHomePage() {
  const memberships = await listMyMemberships();

  return (
    <main>
      <section className="border-b border-ink">
        <Wrap className="py-10">
          <span className="type-mono-caps">партнёрский кабинет</span>
          <h1 className="type-hero mt-3" style={{ fontSize: 40 }}>
            Погасить код
          </h1>
          <p className="mt-3 max-w-prose text-[15px] text-graphite">
            Клиент показывает 6-значный код в&nbsp;своём приложении. Введи его
            ниже и&nbsp;нажми «Проверить» — код погасится, если он&nbsp;настоящий
            и&nbsp;принадлежит твоему заведению.
          </p>
        </Wrap>
      </section>
      <section>
        <Wrap className="max-w-xl py-10">
          {memberships.length === 0 ? (
            <div className="border border-ink p-6">
              <span className="type-mono-caps">нет привязки</span>
              <h2 className="type-h3 mt-3">
                Аккаунт пока не&nbsp;привязан к&nbsp;партнёру.
              </h2>
              <p className="mt-3 text-[15px] text-graphite">
                Свяжись с&nbsp;администратором CITYRNNG, чтобы добавить твой
                email в&nbsp;команду заведения. После этого здесь появится
                форма для&nbsp;проверки кодов.
              </p>
            </div>
          ) : (
            <PartnerVerifyForm memberships={memberships} />
          )}
        </Wrap>
      </section>
    </main>
  );
}
