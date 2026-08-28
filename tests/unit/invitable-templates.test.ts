import { describe, expect, it } from 'vitest';
import {
  invitableTemplates,
  type BundleRow,
  type TemplateRow,
} from '@/features/admin/invitable-templates';
import { platformCapabilities, type Capability } from '@/lib/permissions/roles';

const TEMPLATES: TemplateRow[] = [
  { code: 'admin', label_en: 'Administrator', label_bn: 'অ্যাডমিনিস্ট্রেটর' },
  { code: 'case_manager', label_en: 'Case manager', label_bn: 'কেস ম্যানেজার' },
  { code: 'compliance_officer', label_en: 'Compliance officer', label_bn: 'কমপ্লায়েন্স অফিসার' },
  { code: 'finance', label_en: 'Finance', label_bn: 'ফাইন্যান্স' },
  { code: 'super_admin', label_en: 'Super administrator', label_bn: 'সুপার অ্যাডমিনিস্ট্রেটর' },
  { code: 'auditor', label_en: 'Auditor', label_bn: 'নিরীক্ষক' },
];

/** The seeded bundles, kept in step with the migration by the integration test. */
const BUNDLES: BundleRow[] = [
  ...bundle('admin', platformCapabilities(['admin'])),
  ...bundle('case_manager', platformCapabilities(['case_manager'])),
  ...bundle('compliance_officer', platformCapabilities(['compliance_officer'])),
  ...bundle('finance', platformCapabilities(['finance'])),
  ...bundle('super_admin', platformCapabilities(['super_admin'])),
  { template_code: 'auditor', permission_key: 'audit.read' },
];

function bundle(code: string, caps: Set<Capability>): BundleRow[] {
  return [...caps].map((key) => ({ template_code: code, permission_key: key }));
}

function codes(held: Set<Capability>): string[] {
  return invitableTemplates(TEMPLATES, BUNDLES, held, 'en').map((t) => t.code);
}

describe('invitableTemplates', () => {
  it('offers a super administrator everything', () => {
    expect(codes(platformCapabilities(['super_admin']))).toEqual([
      'admin',
      'case_manager',
      'compliance_officer',
      'finance',
      'super_admin',
      'auditor',
    ]);
  });

  it('withholds from an administrator exactly what they are denied', () => {
    const offered = codes(platformCapabilities(['admin']));
    expect(offered).toContain('admin');
    expect(offered).toContain('case_manager');
    expect(offered).toContain('auditor');
    // compliance_officer holds kyc.decide and risk.write; finance holds
    // refund.approve; super_admin holds both. All three are permissions plain
    // admin is deliberately denied.
    expect(offered).not.toContain('compliance_officer');
    expect(offered).not.toContain('finance');
    expect(offered).not.toContain('super_admin');
  });

  it('offers a case manager nothing that exceeds them', () => {
    const offered = codes(platformCapabilities(['case_manager']));
    expect(offered).toEqual(['case_manager']);
  });

  it('offers nothing at all to somebody holding no permissions', () => {
    // Every template here carries at least one permission, auditor included.
    expect(codes(new Set())).toEqual([]);
  });

  it('offers a template that carries no permissions to anyone', () => {
    // An empty bundle vacuously satisfies "every permission is held". That is
    // the correct reading — such a template grants nothing — but it is worth
    // pinning so a future empty bundle is a deliberate choice, not a surprise.
    const empty: TemplateRow[] = [
      { code: 'observer', label_en: 'Observer', label_bn: 'পর্যবেক্ষক' },
    ];
    expect(invitableTemplates(empty, [], new Set(), 'en').map((t) => t.code)).toEqual(['observer']);
  });

  it('uses the Bangla label for a Bangla locale', () => {
    const [first] = invitableTemplates(TEMPLATES, BUNDLES, platformCapabilities(['admin']), 'bn');
    expect(first?.label).toBe('অ্যাডমিনিস্ট্রেটর');
  });
});
