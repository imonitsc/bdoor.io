'use client';

import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/features/auth/actions';

export function SignOutButton() {
  const t = useTranslations('common');
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('signOut')}</span>
        <span className="sr-only sm:hidden">{t('signOut')}</span>
      </Button>
    </form>
  );
}
