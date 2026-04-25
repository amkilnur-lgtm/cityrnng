import { PageHero, PageShell } from "@/components/site/page-shell";
import { LegalDraftNotice } from "@/components/site/legal-draft-notice";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Условия · CITYRNNG" };

export default async function TermsPage() {
  const state = await getSiteState();
  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="условия"
        title="Условия использования"
        lede="Документ в подготовке. Финальная версия будет согласована с юристом до публичного релиза."
      />
      <LegalDraftNotice slug="terms" />
    </PageShell>
  );
}
