import { PageHero, PageShell } from "@/components/site/page-shell";
import { LegalDraftNotice } from "@/components/site/legal-draft-notice";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Политика приватности · CITYRNNG" };

export default async function PrivacyPage() {
  const state = await getSiteState();
  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="приватность"
        title="Политика приватности"
        lede="Документ в подготовке. Соберём отдельно требования по 152-ФЗ + GDPR-friendly параграфы перед запуском."
      />
      <LegalDraftNotice slug="privacy" />
    </PageShell>
  );
}
