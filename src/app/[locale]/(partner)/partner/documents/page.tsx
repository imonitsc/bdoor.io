import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { DownloadButton } from '@/components/documents/download-button';
import { requirePartnerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartnerDocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePartnerOrganization();

  const [t, tPartner, format] = await Promise.all([
    getTranslations('workspace.documents'),
    getTranslations('partnerWorkspace.assignment'),
    getFormatter(),
  ]);

  // RLS limits this to documents on accepted assignments the customer has
  // authorised for sharing — no organization filter is needed or wanted here.
  const supabase = await createClient();
  const { data } = await supabase
    .from('documents')
    .select('id, title, category, created_at, cases(reference)')
    .order('created_at', { ascending: false })
    .limit(100);

  type Row = {
    id: string;
    title: string;
    category: string;
    created_at: string;
    cases: { reference: string } | null;
  };
  const documents = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />
      <Alert tone="restricted">{tPartner('scopeNote')}</Alert>

      {documents.length === 0 ? (
        <EmptyState icon={<FileText className="size-5" />} title={t('noDocuments')} />
      ) : (
        <ul className="divide-border border-border divide-y border-y">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-ink truncate text-sm">{document.title}</p>
                <p className="text-muted text-xs">
                  {document.cases?.reference ? `${document.cases.reference} · ` : ''}
                  {format.dateTime(new Date(document.created_at), 'short')}
                </p>
              </div>
              <DownloadButton documentId={document.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
