import type { Topic } from './taxonomy';

/**
 * The starting source registry: the official Bangladesh institutions the
 * knowledge system watches, with the authority tier each one carries and how
 * often it deserves a re-check. The registry is editable in the admin screen;
 * this module only provides the initial rows and never overwrites an entry a
 * human has since changed.
 *
 * A `.gov.bd` domain earns nothing by itself. The tier here is the *ceiling*
 * for documents found through this source; every document still records its
 * own issuing authority, and review verifies that the document is genuine,
 * current and relevant before anything reaches a customer.
 *
 * Check frequencies: gazettes, SRO/circular feeds and fee pages run hot;
 * legislation and static guidance run weekly or slower. Hours, not cron
 * strings, so the scheduler can spread the load.
 */

export type RegistrySeed = {
  code: string;
  institution: string;
  institutionBn?: string;
  kind:
    | 'gazette'
    | 'legislation'
    | 'regulator'
    | 'agency'
    | 'ministry'
    | 'local_authority'
    | 'programme'
    | 'secondary';
  baseUrl: string;
  authorityTier: 1 | 2 | 3 | 4 | 5 | 6;
  topics: Topic[];
  checkFrequencyHours: number;
  notes?: string;
};

export const REGISTRY_SEED: readonly RegistrySeed[] = [
  {
    code: 'bd-gazette',
    institution: 'Bangladesh Government Press (Bangladesh Gazette)',
    institutionBn: 'বাংলাদেশ সরকারি মুদ্রণালয় (বাংলাদেশ গেজেট)',
    kind: 'gazette',
    baseUrl: 'https://www.dpp.gov.bd/bgpress/',
    authorityTier: 1,
    topics: [
      'formation_structure',
      'governance_rjsc',
      'tax_vat',
      'employment_labour',
      'import_export_customs',
      'environment_factory_fire',
      'sector_licensing',
    ],
    checkFrequencyHours: 24,
    notes:
      'Weekly and extraordinary gazettes. Highest authority; new SROs and statutory notifications land here first.',
  },
  {
    code: 'bdlaws',
    institution:
      'Laws of Bangladesh (Legislative and Parliamentary Affairs Division, Ministry of Law)',
    institutionBn: 'বাংলাদেশ কোড (আইন মন্ত্রণালয়)',
    kind: 'legislation',
    baseUrl: 'http://bdlaws.minlaw.gov.bd/',
    authorityTier: 2,
    topics: [
      'formation_structure',
      'governance_rjsc',
      'tax_vat',
      'employment_labour',
      'intellectual_property',
      'banking_fx_investment',
    ],
    checkFrequencyHours: 168,
    notes:
      'Consolidated Acts as maintained by the Ministry of Law. Amendments appear via the Gazette first.',
  },
  {
    code: 'rjsc',
    institution: 'Registrar of Joint Stock Companies and Firms (RJSC)',
    institutionBn: 'যৌথ মূলধন কোম্পানি ও ফার্মসমূহের নিবন্ধকের কার্যালয়',
    kind: 'regulator',
    baseUrl: 'https://roc.gov.bd/',
    authorityTier: 3,
    topics: ['formation_structure', 'governance_rjsc'],
    checkFrequencyHours: 72,
    notes:
      'Name clearance, incorporation, returns, fee schedules. Online portal at app.roc.gov.bd.',
  },
  {
    code: 'rjsc-portal',
    institution: 'RJSC online services portal',
    kind: 'regulator',
    baseUrl: 'https://app.roc.gov.bd/',
    authorityTier: 4,
    topics: ['formation_structure', 'governance_rjsc'],
    checkFrequencyHours: 72,
    notes: 'Service pages, forms and published fees for the online filing system.',
  },
  {
    code: 'nbr',
    institution: 'National Board of Revenue (NBR)',
    institutionBn: 'জাতীয় রাজস্ব বোর্ড',
    kind: 'regulator',
    baseUrl: 'https://nbr.gov.bd/',
    authorityTier: 3,
    topics: ['tax_vat', 'import_export_customs'],
    checkFrequencyHours: 48,
    notes: 'Income tax, VAT and customs SROs, circulars, paripatras and fee/rate schedules.',
  },
  {
    code: 'bida',
    institution: 'Bangladesh Investment Development Authority (BIDA)',
    institutionBn: 'বাংলাদেশ বিনিয়োগ উন্নয়ন কর্তৃপক্ষ',
    kind: 'agency',
    baseUrl: 'https://investbangladesh.gov.bd/',
    authorityTier: 3,
    topics: ['banking_fx_investment', 'formation_structure', 'international_expansion'],
    checkFrequencyHours: 168,
    notes: 'Foreign investment registration, work permits, branch/liaison office permissions.',
  },
  {
    code: 'banglabiz',
    institution: 'BanglaBiz national business service portal',
    kind: 'agency',
    baseUrl: 'https://banglabiz.gov.bd/',
    authorityTier: 5,
    topics: ['formation_structure', 'trade_licence_local', 'sector_licensing'],
    checkFrequencyHours: 168,
    notes:
      'Cross-agency procedure guidance; each procedure is verified against the issuing regulator.',
  },
  {
    code: 'bb',
    institution: 'Bangladesh Bank (including BFIU)',
    institutionBn: 'বাংলাদেশ ব্যাংক',
    kind: 'regulator',
    baseUrl: 'https://www.bb.org.bd/',
    authorityTier: 3,
    topics: ['banking_fx_investment'],
    checkFrequencyHours: 48,
    notes:
      'FE circulars, guidelines for foreign exchange transactions, remittance and capital rules.',
  },
  {
    code: 'mincom',
    institution: 'Ministry of Commerce',
    institutionBn: 'বাণিজ্য মন্ত্রণালয়',
    kind: 'ministry',
    baseUrl: 'https://mincom.gov.bd/',
    authorityTier: 3,
    topics: ['import_export_customs', 'sector_licensing'],
    checkFrequencyHours: 168,
  },
  {
    code: 'moind',
    institution: 'Ministry of Industries',
    institutionBn: 'শিল্প মন্ত্রণালয়',
    kind: 'ministry',
    baseUrl: 'https://moind.gov.bd/',
    authorityTier: 3,
    topics: ['sector_licensing', 'startup_funding'],
    checkFrequencyHours: 168,
  },
  {
    code: 'mole',
    institution: 'Ministry of Labour and Employment',
    institutionBn: 'শ্রম ও কর্মসংস্থান মন্ত্রণালয়',
    kind: 'ministry',
    baseUrl: 'https://mole.gov.bd/',
    authorityTier: 3,
    topics: ['employment_labour'],
    checkFrequencyHours: 168,
  },
  {
    code: 'dife',
    institution: 'Department of Inspection for Factories and Establishments (DIFE)',
    kind: 'regulator',
    baseUrl: 'https://dife.gov.bd/',
    authorityTier: 3,
    topics: ['employment_labour', 'environment_factory_fire'],
    checkFrequencyHours: 168,
    notes: 'Factory/establishment registration and labour inspection requirements.',
  },
  {
    code: 'doe',
    institution: 'Department of Environment',
    institutionBn: 'পরিবেশ অধিদপ্তর',
    kind: 'regulator',
    baseUrl: 'https://doe.gov.bd/',
    authorityTier: 3,
    topics: ['environment_factory_fire'],
    checkFrequencyHours: 168,
    notes: 'Environmental clearance certificates by category (green/yellow/orange/red).',
  },
  {
    code: 'fscd',
    institution: 'Fire Service and Civil Defence',
    institutionBn: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স',
    kind: 'regulator',
    baseUrl: 'https://fireservice.gov.bd/',
    authorityTier: 3,
    topics: ['environment_factory_fire'],
    checkFrequencyHours: 168,
    notes: 'Fire licence and fire-safety plan approvals.',
  },
  {
    code: 'ccie',
    institution: 'Office of the Chief Controller of Imports and Exports (CCI&E)',
    kind: 'regulator',
    baseUrl: 'https://ccie.gov.bd/',
    authorityTier: 3,
    topics: ['import_export_customs'],
    checkFrequencyHours: 72,
    notes: 'Import (IRC) and export (ERC) registration certificates and renewal fees.',
  },
  {
    code: 'epb',
    institution: 'Export Promotion Bureau',
    institutionBn: 'রপ্তানি উন্নয়ন ব্যুরো',
    kind: 'agency',
    baseUrl: 'https://epb.gov.bd/',
    authorityTier: 3,
    topics: ['import_export_customs'],
    checkFrequencyHours: 168,
  },
  {
    code: 'dpdt',
    institution: 'Department of Patents, Designs and Trademarks (DPDT)',
    kind: 'regulator',
    baseUrl: 'https://dpdt.gov.bd/',
    authorityTier: 3,
    topics: ['intellectual_property'],
    checkFrequencyHours: 168,
    notes: 'Trademark, patent and design registration procedures and fee schedules.',
  },
  {
    code: 'bsec',
    institution: 'Bangladesh Securities and Exchange Commission (BSEC)',
    kind: 'regulator',
    baseUrl: 'https://sec.gov.bd/',
    authorityTier: 3,
    topics: ['banking_fx_investment', 'governance_rjsc'],
    checkFrequencyHours: 168,
  },
  {
    code: 'btrc',
    institution: 'Bangladesh Telecommunication Regulatory Commission (BTRC)',
    kind: 'regulator',
    baseUrl: 'http://www.btrc.gov.bd/',
    authorityTier: 3,
    topics: ['sector_licensing'],
    checkFrequencyHours: 168,
  },
  {
    code: 'bsti',
    institution: 'Bangladesh Standards and Testing Institution (BSTI)',
    kind: 'regulator',
    baseUrl: 'https://bsti.gov.bd/',
    authorityTier: 3,
    topics: ['sector_licensing'],
    checkFrequencyHours: 168,
    notes: 'Mandatory certification marks for regulated products.',
  },
  {
    code: 'customs',
    institution: 'Bangladesh Customs (NBR)',
    kind: 'regulator',
    baseUrl: 'http://customs.gov.bd/',
    authorityTier: 3,
    topics: ['import_export_customs'],
    checkFrequencyHours: 72,
    notes: 'Tariff schedules, bond licences and customs procedures.',
  },
  {
    code: 'egp',
    institution: 'e-Government Procurement (e-GP), CPTU / BPPA',
    kind: 'agency',
    baseUrl: 'https://www.eprocure.gov.bd/',
    authorityTier: 3,
    topics: ['procurement'],
    checkFrequencyHours: 168,
    notes: 'Supplier registration, tender rules and e-GP participation requirements.',
  },
  {
    code: 'startup-bd',
    institution: 'Startup Bangladesh Limited',
    kind: 'programme',
    baseUrl: 'https://startupbangladesh.vc/',
    authorityTier: 5,
    topics: ['startup_funding'],
    checkFrequencyHours: 168,
    notes: 'State-owned venture programme. Funding terms are programme statements, not law.',
  },
  {
    code: 'idea',
    institution: 'iDEA Project (ICT Division)',
    kind: 'programme',
    baseUrl: 'https://idea.gov.bd/',
    authorityTier: 5,
    topics: ['startup_funding'],
    checkFrequencyHours: 168,
    notes: 'Startup grants and pre-seed programmes.',
  },
  {
    code: 'bscic',
    institution: 'Bangladesh Small and Cottage Industries Corporation (BSCIC)',
    kind: 'agency',
    baseUrl: 'https://bscic.gov.bd/',
    authorityTier: 3,
    topics: ['sector_licensing', 'startup_funding'],
    checkFrequencyHours: 168,
  },
  {
    code: 'beza',
    institution: 'Bangladesh Economic Zones Authority (BEZA)',
    kind: 'agency',
    baseUrl: 'https://beza.gov.bd/',
    authorityTier: 3,
    topics: ['banking_fx_investment', 'sector_licensing', 'international_expansion'],
    checkFrequencyHours: 168,
  },
  {
    code: 'bepza',
    institution: 'Bangladesh Export Processing Zones Authority (BEPZA)',
    kind: 'agency',
    baseUrl: 'https://bepza.gov.bd/',
    authorityTier: 3,
    topics: ['banking_fx_investment', 'sector_licensing', 'import_export_customs'],
    checkFrequencyHours: 168,
  },
  {
    code: 'bhtpa',
    institution: 'Bangladesh Hi-Tech Park Authority',
    kind: 'agency',
    baseUrl: 'https://bhtpa.gov.bd/',
    authorityTier: 3,
    topics: ['sector_licensing', 'startup_funding'],
    checkFrequencyHours: 168,
  },
  {
    code: 'dncc',
    institution: 'Dhaka North City Corporation',
    institutionBn: 'ঢাকা উত্তর সিটি কর্পোরেশন',
    kind: 'local_authority',
    baseUrl: 'https://dncc.gov.bd/',
    authorityTier: 3,
    topics: ['trade_licence_local'],
    checkFrequencyHours: 168,
    notes: 'Trade licence issue/renewal for its jurisdiction. Local requirement, not national.',
  },
  {
    code: 'dscc',
    institution: 'Dhaka South City Corporation',
    institutionBn: 'ঢাকা দক্ষিণ সিটি কর্পোরেশন',
    kind: 'local_authority',
    baseUrl: 'https://dscc.gov.bd/',
    authorityTier: 3,
    topics: ['trade_licence_local'],
    checkFrequencyHours: 168,
  },
  {
    code: 'ccc',
    institution: 'Chattogram City Corporation',
    institutionBn: 'চট্টগ্রাম সিটি কর্পোরেশন',
    kind: 'local_authority',
    baseUrl: 'https://ccc.gov.bd/',
    authorityTier: 3,
    topics: ['trade_licence_local'],
    checkFrequencyHours: 168,
  },
] as const;
