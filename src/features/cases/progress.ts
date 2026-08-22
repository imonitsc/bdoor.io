import type { Enums } from '@/types/database';

export type MilestoneStatus = Enums<'milestone_status'>;

export type MilestoneLike = {
  status: MilestoneStatus;
  weight: number;
};

/**
 * Weighted milestone completion.
 *
 * Deliberately NOT derived from the case status: mapping fifteen statuses onto
 * a percentage produces numbers that jump backwards and mean nothing. This is
 * "how much of the agreed work is done", which is a claim we can defend.
 *
 * Skipped milestones leave the denominator, so removing an inapplicable step
 * does not make the case look less complete than it is.
 */
export function milestoneProgress(milestones: readonly MilestoneLike[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const counted = milestones.filter((m) => m.status !== 'skipped');
  const total = counted.reduce((sum, m) => sum + m.weight, 0);
  const completed = counted
    .filter((m) => m.status === 'complete')
    .reduce((sum, m) => sum + m.weight, 0);

  return {
    completed: counted.filter((m) => m.status === 'complete').length,
    total: counted.length,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
