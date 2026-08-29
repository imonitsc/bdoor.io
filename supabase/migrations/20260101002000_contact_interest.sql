-- International lead attribution (master instructions §11).
--
-- Country CTAs link to /contact?interest=<country-slug>, but the page used
-- to drop the parameter, so an enquiry about Qatar arrived as a blank
-- general message. The interest now survives as structured columns rather
-- than free text in the message body: values are resolved against the
-- commercial catalog server-side before insert (see
-- src/features/contact/interest.ts), never trusted from the query string.

alter table public.contact_requests
  add column interest_country text,
  add column interest_route text,
  add column source_path text;

comment on column public.contact_requests.interest_country is
  'Catalog country slug the enquiry is about (validated server-side); null '
  'for a general enquiry.';
comment on column public.contact_requests.interest_route is
  'Catalog route/package slug when one was named on the linking page.';
comment on column public.contact_requests.source_path is
  'Path of the page that linked to the contact form, when known.';
