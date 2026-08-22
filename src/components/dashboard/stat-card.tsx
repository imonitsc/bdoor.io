import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'neutral' | 'warning' | 'success';
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
        {icon ? (
          <span
            className={cn(
              'shrink-0',
              tone === 'warning'
                ? 'text-warning'
                : tone === 'success'
                  ? 'text-success'
                  : 'text-muted',
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-ink mt-2 text-2xl font-semibold">{value}</p>
      {hint ? <p className="text-muted mt-1 text-sm">{hint}</p> : null}
    </Card>
  );
}
