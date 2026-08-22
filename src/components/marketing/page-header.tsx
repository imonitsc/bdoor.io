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
    <Section tone="surface" className="border-b border-border py-12 md:py-16">
      <div className="container-page">
        <h1 className="max-w-3xl text-3xl leading-tight text-ink md:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </Section>
  );
}
