import 'server-only';

import { serverEnv } from '@/lib/env';
import type { Enums } from '@/types/database';

export type CheckType = Enums<'kyc_check_type'>;

export type ScreeningSubject = {
  fullName: string;
  dateOfBirth?: string | null;
  nationality?: string | null;
  countryOfResidence?: string | null;
};

export type ScreeningOutcome = {
  provider: string;
  /**
   * True whenever the result came from the development stand-in. Every surface
   * that renders a screening result MUST show this — a mock result is not a
   * screening, and presenting it as one would be a serious misrepresentation.
   */
  isMock: boolean;
  matched: boolean;
  matchCount: number;
  payload: Record<string, unknown>;
};

export interface ScreeningProvider {
  readonly name: string;
  readonly isMock: boolean;
  screen(checkType: CheckType, subject: ScreeningSubject): Promise<ScreeningOutcome>;
}

/**
 * Development stand-in.
 *
 * It never contacts a sanctions or PEP list and never claims to. It returns
 * "no match" with `isMock: true` and a payload that says so in words, so that
 * a screenshot of a mock result can never be mistaken for a real one.
 */
class MockScreeningProvider implements ScreeningProvider {
  readonly name = 'mock';
  readonly isMock = true;

  async screen(checkType: CheckType, subject: ScreeningSubject): Promise<ScreeningOutcome> {
    return {
      provider: this.name,
      isMock: true,
      matched: false,
      matchCount: 0,
      payload: {
        notice:
          'NO SCREENING WAS PERFORMED. This is a development stand-in that always returns no match. ' +
          'It must not be relied on for any compliance decision.',
        checkType,
        subjectNameLength: subject.fullName.length,
      },
    };
  }
}

export function getScreeningProvider(): ScreeningProvider {
  const configured = serverEnv().SCREENING_PROVIDER;
  if (configured === 'mock') return new MockScreeningProvider();

  throw new Error(
    'SCREENING_PROVIDER is set to "live" but no adapter is implemented. ' +
      'Implement the ScreeningProvider interface in src/lib/screening/ and register it here.',
  );
}

export function screeningIsMock(): boolean {
  return serverEnv().SCREENING_PROVIDER === 'mock';
}
