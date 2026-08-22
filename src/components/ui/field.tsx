'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type FieldContextValue = {
  id: string;
  descriptionId: string;
  errorId: string;
  hasError: boolean;
};

const FieldContext = React.createContext<FieldContextValue | null>(null);

function useField(): FieldContextValue {
  const ctx = React.useContext(FieldContext);
  if (!ctx) throw new Error('Field subcomponents must be used inside <Field>.');
  return ctx;
}

export function Field({
  children,
  error,
  id: idProp,
  className,
}: {
  children: React.ReactNode;
  error?: string | undefined;
  id?: string;
  className?: string;
}) {
  const reactId = React.useId();
  const id = idProp ?? reactId;
  const value = React.useMemo(
    () => ({
      id,
      descriptionId: `${id}-description`,
      errorId: `${id}-error`,
      hasError: Boolean(error),
    }),
    [id, error],
  );

  return (
    <FieldContext.Provider value={value}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        {children}
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </FieldContext.Provider>
  );
}

export function FieldLabel({
  children,
  required,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { required?: boolean }) {
  const { id } = useField();
  return (
    <LabelPrimitive.Root
      htmlFor={id}
      className={cn('text-ink text-sm font-medium', className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="text-danger ms-1" aria-hidden="true">
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  );
}

export function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useField();
  return <p id={descriptionId} className={cn('text-muted text-sm', className)} {...props} />;
}

export function FieldError({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { errorId } = useField();
  return (
    <p
      id={errorId}
      className={cn('text-danger flex items-start gap-1.5 text-sm font-medium', className)}
      {...props}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Wires id / aria-describedby / aria-invalid onto whichever control is inside. */
export function FieldControl({
  children,
  hasDescription = true,
}: {
  children: React.ReactElement<Record<string, unknown>>;
  hasDescription?: boolean;
}) {
  const { id, descriptionId, errorId, hasError } = useField();
  const describedBy = [hasDescription ? descriptionId : null, hasError ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return React.cloneElement(children, {
    id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': hasError || undefined,
  });
}
