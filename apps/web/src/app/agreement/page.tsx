import { PageHero, PageShell } from "@/components/site/page-shell";
import { LegalDraftNotice } from "@/components/site/legal-draft-notice";
import { getSiteState } from "@/lib/site-state";

export const metadata = { title: "Пользовательское соглашение · CITYRNNG" };

export default async function AgreementPage() {
  const state = await getSiteState();
  return (
    <PageShell state={state}>
      <PageHero
        eyebrow="соглашение"
        title="Пользовательское соглашение"
        lede="Документ в подготовке."
      />
      <LegalDraftNotice slug="agreement" />
    </PageShell>
  );
}
