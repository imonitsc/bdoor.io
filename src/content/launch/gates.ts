export type LaunchGateStatus = 'open' | 'partial' | 'closed';

export type LaunchGate = {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  title: string;
  owner: string;
  status: LaunchGateStatus;
  evidence: string;
  blockingConsequence: string;
};

/**
 * Internal launch register. Public pages must not treat a `partial` or `open`
 * P0 gate as cleared. This file is the machine-readable twin of
 * docs/launch/launch-gates.md.
 */
export const LAUNCH_GATES: readonly LaunchGate[] = [
  {
    id: 'A',
    title: 'Legal',
    owner: 'Qualified Bangladesh counsel and owner',
    status: 'open',
    evidence: 'All legal pages are drafts awaiting professional review.',
    blockingConsequence: 'Must not take paying customers on these terms.',
  },
  {
    id: 'B',
    title: 'Identity and trust',
    owner: 'Owner',
    status: 'open',
    evidence: 'No verified legal entity, address, phone or leadership biographies.',
    blockingConsequence: 'Must not publish operator identity.',
  },
  {
    id: 'C',
    title: 'Partners',
    owner: 'Owner and verifying staff',
    status: 'open',
    evidence: 'No live verified partner organisation. Seed data is fictional.',
    blockingConsequence: 'Must not advertise verified partners.',
  },
  {
    id: 'D',
    title: 'Security',
    owner: 'Engineering',
    status: 'partial',
    evidence:
      'Auth, RLS, storage and negative tests pass in CI. Preview shares production Supabase. Screening and malware are mocks.',
    blockingConsequence:
      'Must not onboard real identity documents at scale until a scanner and split environments exist.',
  },
  {
    id: 'E',
    title: 'Operations',
    owner: 'Operations lead',
    status: 'partial',
    evidence: 'In-app queues exist. Email is mock. SLAs are not rehearsed.',
    blockingConsequence: 'Must not promise operational SLAs.',
  },
  {
    id: 'F',
    title: 'Production release',
    owner: 'Owner',
    status: 'open',
    evidence: 'This branch has not been approved for promotion.',
    blockingConsequence: 'Must not merge or promote to production.',
  },
];

export function p0GatesOpen(): boolean {
  return LAUNCH_GATES.some((gate) => gate.status !== 'closed');
}
