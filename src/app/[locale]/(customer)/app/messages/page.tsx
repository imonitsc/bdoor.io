import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { MessageThread, type MessageView } from '@/components/dashboard/message-thread';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session } = await requireCustomerOrganization();

  const t = await getTranslations('workspace.messages');
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from('message_threads')
    .select(
      'id, subject, case_id, updated_at, cases(reference), messages(id, body, author_kind, is_internal_note, created_at, author_id, profiles:author_id(full_name))',
    )
    .order('updated_at', { ascending: false })
    .limit(20);

  type Row = {
    id: string;
    subject: string;
    cases: { reference: string } | null;
    messages: Array<{
      id: string;
      body: string;
      author_kind: string;
      is_internal_note: boolean;
      created_at: string;
      profiles: { full_name: string } | null;
    }>;
  };

  const rows = (threads ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />

      {rows.length === 0 ? (
        <EmptyState icon={<MessageSquare className="size-5" />} title={t('noThreads')} />
      ) : (
        <div className="flex flex-col gap-6">
          {rows.map((thread) => {
            const messages: MessageView[] = [...(thread.messages ?? [])]
              .sort((a, b) => a.created_at.localeCompare(b.created_at))
              .map((m) => ({
                id: m.id,
                body: m.body,
                authorKind: m.author_kind,
                authorName: m.profiles?.full_name ?? null,
                isInternal: m.is_internal_note,
                createdAt: m.created_at,
              }));

            return (
              <Card key={thread.id} className="p-5">
                <MessageThread
                  threadId={thread.id}
                  subject={
                    thread.cases ? t('threadFor', { case: thread.cases.reference }) : thread.subject
                  }
                  messages={messages}
                  currentUserId={session.userId}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
