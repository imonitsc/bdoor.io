import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeading } from '@/components/dashboard/page-heading';
import { CaseStatusBadge } from '@/components/dashboard/status-badge';
import { MilestoneControls } from '@/components/dashboard/milestone-controls';
import { MessageThread, type MessageView } from '@/components/dashboard/message-thread';
import { UploadForm } from '@/components/documents/upload-form';
import { DownloadButton } from '@/components/documents/download-button';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { requirePartnerOrganization } from '@/lib/auth/require-organization';
import { getCaseDetail } from '@/features/cases/queries';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartnerCaseDetail({
  params,
}: {
  params: Promise<{ locale: string; caseId: string }>;
}) {
  const { locale, caseId } = await params;
  setRequestLocale(locale);

  const [{ session, active }, detail, t, tPartner, format] = await Promise.all([
    requirePartnerOrganization(),
    getCaseDetail(caseId),
    getTranslations('workspace.case'),
    getTranslations('partnerWorkspace'),
    getFormatter(),
  ]);

  if (!detail) notFound();

  const supabase = await createClient();
  const [documentsResult, threadsResult] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, category, status, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
    supabase
      .from('message_threads')
      .select(
        'id, subject, messages(id, body, author_kind, is_internal_note, created_at, profiles:author_id(full_name))',
      )
      .eq('case_id', caseId)
      .order('updated_at', { ascending: false })
      .limit(5),
  ]);

  type ThreadRow = {
    id: string;
    subject: string;
    messages: Array<{
      id: string;
      body: string;
      author_kind: string;
      is_internal_note: boolean;
      created_at: string;
      profiles: { full_name: string } | null;
    }>;
  };

  const documents = documentsResult.data ?? [];
  const threads = (threadsResult.data ?? []) as unknown as ThreadRow[];
  const label = (en: string, bn: string) => (locale === 'bn' ? bn : en);
  const partnerMilestones = detail.milestones.filter((m) => m.ownerKind === 'partner');

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={detail.summary.title}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{detail.summary.reference}</span>
            <CaseStatusBadge status={detail.summary.status} />
          </span>
        }
      />

      <Alert tone="restricted">{tPartner('assignment.scopeNote')}</Alert>

      <Tabs defaultValue="tasks">
        <TabsList aria-label={detail.summary.title}>
          <TabsTrigger value="tasks">{t('actions')}</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
          <TabsTrigger value="messages">{t('messages')}</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          {partnerMilestones.length === 0 ? (
            <EmptyState title={t('noActions')} />
          ) : (
            <ul className="flex flex-col gap-3">
              {partnerMilestones.map((milestone) => (
                <li key={milestone.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="text-ink text-sm font-medium">
                        {label(milestone.labelEn, milestone.labelBn)}
                      </p>
                      {milestone.dueOn ? (
                        <p className="text-muted text-xs">
                          {format.dateTime(new Date(milestone.dueOn), 'short')}
                        </p>
                      ) : null}
                    </div>
                    <MilestoneControls milestoneId={milestone.id} status={milestone.status} />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="flex flex-col gap-5">
            {documents.length === 0 ? (
              <EmptyState title={t('documents')} />
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
                        {format.dateTime(new Date(document.created_at), 'short')}
                      </p>
                    </div>
                    <DownloadButton documentId={document.id} />
                  </li>
                ))}
              </ul>
            )}

            <Card className="p-5">
              <CardHeader className="p-0">
                <CardTitle as="h2">{t('submissions')}</CardTitle>
                <CardDescription>{tPartner('notes.help')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <UploadForm organizationId={active.organizationId} caseId={caseId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          {threads.length === 0 ? (
            <EmptyState title={t('messages')} />
          ) : (
            <div className="flex flex-col gap-6">
              {threads.map((thread) => (
                <Card key={thread.id} className="p-5">
                  <MessageThread
                    threadId={thread.id}
                    subject={thread.subject}
                    currentUserId={session.userId}
                    messages={[...(thread.messages ?? [])]
                      .sort((a, b) => a.created_at.localeCompare(b.created_at))
                      .map<MessageView>((m) => ({
                        id: m.id,
                        body: m.body,
                        authorKind: m.author_kind,
                        authorName: m.profiles?.full_name ?? null,
                        isInternal: m.is_internal_note,
                        createdAt: m.created_at,
                      }))}
                  />
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <IndependenceDisclosure />
    </div>
  );
}
