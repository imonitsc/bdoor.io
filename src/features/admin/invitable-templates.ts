import type { Capability } from '@/lib/permissions/roles';

export type TemplateRow = { code: string; label_en: string; label_bn: string };
export type BundleRow = { template_code: string; permission_key: string };
export type InvitableTemplate = { code: string; label: string };

/**
 * Which internal roles to offer an administrator in the invite form.
 *
 * `app.may_invite_template()` is the enforcement. It lives in the private `app`
 * schema and is applied by the insert policy on `platform_invitations`, so no
 * client can call it. This applies the same rule to the same data purely to
 * decide what to show: a role is offered only when every permission it carries
 * is one the signed-in administrator already holds.
 *
 * Getting this wrong shows an option that fails on submit, or hides one that
 * would have worked. It cannot grant anything, because the database still
 * decides — which is the only reason it is acceptable to have the rule
 * expressed twice at all.
 */
export function invitableTemplates(
  templates: readonly TemplateRow[],
  bundles: readonly BundleRow[],
  held: ReadonlySet<Capability>,
  locale: string,
): InvitableTemplate[] {
  const permissionsByTemplate = new Map<string, string[]>();
  for (const row of bundles) {
    permissionsByTemplate.set(row.template_code, [
      ...(permissionsByTemplate.get(row.template_code) ?? []),
      row.permission_key,
    ]);
  }

  return templates
    .filter((template) =>
      (permissionsByTemplate.get(template.code) ?? []).every((key) => held.has(key as Capability)),
    )
    .map((template) => ({
      code: template.code,
      label: locale === 'bn' ? template.label_bn : template.label_en,
    }));
}
