import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connect, disconnect, inRolledBackTransaction, selectAs } from './helpers/db';

let client: Awaited<ReturnType<typeof connect>>;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

describe('package_versions RLS', () => {
  it('lets anonymous users read only published package versions', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      const { rows: packages } = await tx.query<{ id: string }>(
        `insert into public.service_packages (slug, segment, name_en, name_bn, sort_order)
         values ('test-solo', 'new_business', 'Test Solo', 'টেস্ট', 1)
         returning id`,
      );
      const packageId = packages[0]!.id;

      const { rows: published } = await tx.query<{ id: string }>(
        `insert into public.package_versions (
           package_id, version_no, status, effective_from, checkout_enabled,
           public_label_en, public_label_bn, summary_en, summary_bn
         ) values ($1, 1, 'published', current_date, true,
           'BDT 1', '১ টাকা', 'Published', 'প্রকাশিত')
         returning id`,
        [packageId],
      );

      await tx.query(
        `insert into public.package_versions (
           package_id, version_no, status, effective_from, checkout_enabled,
           public_label_en, public_label_bn, summary_en, summary_bn
         ) values ($1, 2, 'draft', current_date, false,
           'BDT 2', '২ টাকা', 'Draft', 'খসড়া')`,
        [packageId],
      );

      const anonRows = await selectAs(
        tx,
        null,
        `select id from public.package_versions where package_id = $1`,
        [packageId],
      );

      expect(anonRows).toHaveLength(1);
      expect(anonRows[0]?.id).toBe(published[0]!.id);
    });
  });

  it('hides draft international offers from anonymous users', async () => {
    await inRolledBackTransaction(client, async (tx) => {
      await tx.query(
        `insert into public.international_offers (
           slug, country_code, route_en, route_bn, status, checkout_enabled,
           public_label_en, public_label_bn, summary_en, summary_bn
         ) values
         ('test-draft-offer', 'US', 'Draft LLC', 'খসড়া', 'draft', false,
          'USD 1', 'USD ১', 'Draft', 'খসড়া'),
         ('test-published-offer', 'GB', 'Published LTD', 'প্রকাশিত', 'published', false,
          'GBP 1', 'GBP ১', 'Published', 'প্রকাশিত')`,
      );

      const anonRows = await selectAs(
        tx,
        null,
        `select slug from public.international_offers where slug like 'test-%'`,
      );

      expect(anonRows.map((r) => r.slug)).toEqual(['test-published-offer']);
    });
  });
});
