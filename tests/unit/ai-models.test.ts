import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ANSWER_MODEL, EMBEDDING_MODEL } from '@/features/ai/config';

/**
 * The model role registry (BI-OS §6.1). Chain resolution reads validated env,
 * so the override tests rebuild the module graph with stubbed variables —
 * serverEnv() caches per module instance and must not leak between cases.
 */

async function registryWith(env: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('@/features/ai/models');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('chain resolution', () => {
  it('ships single-model defaults with the verifier off — nothing invented in code', async () => {
    const models = await registryWith({});
    expect(models.modelChain('answer')).toEqual([DEFAULT_ANSWER_MODEL]);
    // Unconfigured, a high-risk question gets the answer chain — the same
    // route, never a weaker one.
    expect(models.modelChain('expert')).toEqual([DEFAULT_ANSWER_MODEL]);
    expect(models.modelChain('verifier')).toEqual([]);
    expect(models.verifierEnabled()).toBe(false);
    expect(models.modelChain('embedding')).toEqual([EMBEDDING_MODEL]);
  });

  it('builds the answer chain from the validated env, primary first', async () => {
    const models = await registryWith({
      AI_ANSWER_FALLBACK_MODELS: ' acme/backup-1 , acme/backup-2 ,acme/backup-1,, ',
    });
    // Trimmed, ordered, de-duplicated.
    expect(models.modelChain('answer')).toEqual([
      DEFAULT_ANSWER_MODEL,
      'acme/backup-1',
      'acme/backup-2',
    ]);
  });

  it('gives a configured expert chain the shared fallbacks too', async () => {
    const models = await registryWith({
      AI_EXPERT_MODEL: 'acme/expert-1',
      AI_ANSWER_FALLBACK_MODELS: 'acme/backup-1',
    });
    expect(models.modelChain('expert')).toEqual(['acme/expert-1', 'acme/backup-1']);
    expect(models.answerRoute('high')).toEqual({
      role: 'expert',
      chain: ['acme/expert-1', 'acme/backup-1'],
    });
    expect(models.answerRoute('standard').role).toBe('answer');
  });

  it('turns the verifier on by configuration alone', async () => {
    const models = await registryWith({ AI_VERIFIER_MODEL: 'acme/verifier-1' });
    expect(models.verifierEnabled()).toBe(true);
    expect(models.modelChain('verifier')).toEqual(['acme/verifier-1']);
  });
});

describe('the provider lock', () => {
  it('confines every slug to its own vendor', async () => {
    const { providerLockFor } = await registryWith({});
    // Bedrock and Vertex resell the same Anthropic model — availability, not
    // substitution. Anyone else gets exactly their own routes.
    expect(providerLockFor('anthropic/claude-sonnet-5')).toEqual([
      'anthropic',
      'bedrock',
      'vertex',
    ]);
    expect(providerLockFor('acme/some-model')).toEqual(['acme']);
  });
});

describe('risk classification', () => {
  it('routes tax, customs, FX and licensing to high risk; formation stays standard', async () => {
    const { classifyRisk, riskClassFor } = await registryWith({});

    expect(classifyRisk('How much VAT do I pay on imported machinery?')).toBe('high');
    expect(classifyRisk('Can I repatriate profit as a foreign shareholder?')).toBe('high');
    expect(classifyRisk('আমদানি শুল্ক কত?')).toBe('high');
    // Registration guidance is the bread-and-butter answer path.
    expect(classifyRisk('How do I register a private limited company?')).toBe('standard');

    expect(riskClassFor(['tax_vat'])).toBe('high');
    expect(riskClassFor(['formation_structure'])).toBe('standard');
    expect(riskClassFor([])).toBe('standard');
  });
});
