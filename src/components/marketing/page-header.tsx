import { Section } from '@/components/ui/section';

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Section tone="surface" className="border-border border-b py-14 md:py-20">
      <div className="container-page">
        <h1 className="text-ink max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted mt-4 max-w-2xl text-lg leading-relaxed">{description}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </Section>
  );
}
