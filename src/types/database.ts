// AUTO-GENERATED — DO NOT EDIT BY HAND.
//
// Regenerate with either of:
//   supabase gen types typescript --local > src/types/database.ts
//   node scripts/local-db/gen-types.mjs        (introspects the local test DB)
//
// The `compliance` schema is deliberately absent: it is not exposed through the
// Data API, and application code must reach it only through server-side helpers.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      "audit_logs": {
        Row: {
          "id": number
          "actor_id": string | null
          "actor_role": string | null
          "action": string
          "target_type": string
          "target_id": string | null
          "organization_id": string | null
          "case_id": string | null
          "correlation_id": string | null
          "metadata": Json
          "origin": string | null
          "created_at": string
        }
        Insert: {
          "id"?: number
          "actor_id"?: string | null
          "actor_role"?: string | null
          "action": string
          "target_type": string
          "target_id"?: string | null
          "organization_id"?: string | null
          "case_id"?: string | null
          "correlation_id"?: string | null
          "metadata"?: Json
          "origin"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: number
          "actor_id"?: string | null
          "actor_role"?: string | null
          "action"?: string
          "target_type"?: string
          "target_id"?: string | null
          "organization_id"?: string | null
          "case_id"?: string | null
          "correlation_id"?: string | null
          "metadata"?: Json
          "origin"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "authorities": {
        Row: {
          "id": string
          "slug": string
          "name_en": string
          "name_bn": string
          "role_en": string
          "role_bn": string
          "website_url": string | null
          "summary_en": string | null
          "summary_bn": string | null
          "disclaimer_en": string | null
          "disclaimer_bn": string | null
          "status": Database["public"]["Enums"]["publication_status"]
          "last_verified_at": string | null
          "sort_order": number
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "slug": string
          "name_en": string
          "name_bn": string
          "role_en": string
          "role_bn": string
          "website_url"?: string | null
          "summary_en"?: string | null
          "summary_bn"?: string | null
          "disclaimer_en"?: string | null
          "disclaimer_bn"?: string | null
          "status"?: Database["public"]["Enums"]["publication_status"]
          "last_verified_at"?: string | null
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "slug"?: string
          "name_en"?: string
          "name_bn"?: string
          "role_en"?: string
          "role_bn"?: string
          "website_url"?: string | null
          "summary_en"?: string | null
          "summary_bn"?: string | null
          "disclaimer_en"?: string | null
          "disclaimer_bn"?: string | null
          "status"?: Database["public"]["Enums"]["publication_status"]
          "last_verified_at"?: string | null
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "authority_queries": {
        Row: {
          "id": string
          "submission_id": string
          "case_id": string
          "raised_on": string
          "respond_by": string | null
          "question": string
          "response": string | null
          "responded_on": string | null
          "responded_by": string | null
          "status": string
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "submission_id": string
          "case_id": string
          "raised_on": string
          "respond_by"?: string | null
          "question": string
          "response"?: string | null
          "responded_on"?: string | null
          "responded_by"?: string | null
          "status"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "submission_id"?: string
          "case_id"?: string
          "raised_on"?: string
          "respond_by"?: string | null
          "question"?: string
          "response"?: string | null
          "responded_on"?: string | null
          "responded_by"?: string | null
          "status"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "authority_submissions": {
        Row: {
          "id": string
          "case_id": string
          "authority_name": string
          "submission_type": string
          "reference_no": string | null
          "submitted_on": string
          "submitted_by_org_id": string | null
          "submitted_by_user_id": string | null
          "outcome": string | null
          "outcome_on": string | null
          "notes": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "authority_name": string
          "submission_type": string
          "reference_no"?: string | null
          "submitted_on": string
          "submitted_by_org_id"?: string | null
          "submitted_by_user_id"?: string | null
          "outcome"?: string | null
          "outcome_on"?: string | null
          "notes"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "authority_name"?: string
          "submission_type"?: string
          "reference_no"?: string | null
          "submitted_on"?: string
          "submitted_by_org_id"?: string | null
          "submitted_by_user_id"?: string | null
          "outcome"?: string | null
          "outcome_on"?: string | null
          "notes"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "beneficial_owners": {
        Row: {
          "id": string
          "company_id": string
          "person_id": string | null
          "full_name": string
          "nationality": string | null
          "country_of_residence": string | null
          "date_of_birth": string | null
          "effective_ownership_percent": number | null
          "control_description": string | null
          "is_pep": boolean
          "pep_details": string | null
          "declared_by": string | null
          "declared_at": string
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "company_id": string
          "person_id"?: string | null
          "full_name": string
          "nationality"?: string | null
          "country_of_residence"?: string | null
          "date_of_birth"?: string | null
          "effective_ownership_percent"?: number | null
          "control_description"?: string | null
          "is_pep"?: boolean
          "pep_details"?: string | null
          "declared_by"?: string | null
          "declared_at"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "company_id"?: string
          "person_id"?: string | null
          "full_name"?: string
          "nationality"?: string | null
          "country_of_residence"?: string | null
          "date_of_birth"?: string | null
          "effective_ownership_percent"?: number | null
          "control_description"?: string | null
          "is_pep"?: boolean
          "pep_details"?: string | null
          "declared_by"?: string | null
          "declared_at"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "case_milestones": {
        Row: {
          "id": string
          "case_id": string
          "code": string
          "label_en": string
          "label_bn": string
          "description_en": string | null
          "description_bn": string | null
          "owner_kind": string
          "status": Database["public"]["Enums"]["milestone_status"]
          "weight": number
          "sort_order": number
          "due_on": string | null
          "completed_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "code": string
          "label_en": string
          "label_bn": string
          "description_en"?: string | null
          "description_bn"?: string | null
          "owner_kind"?: string
          "status"?: Database["public"]["Enums"]["milestone_status"]
          "weight"?: number
          "sort_order"?: number
          "due_on"?: string | null
          "completed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "code"?: string
          "label_en"?: string
          "label_bn"?: string
          "description_en"?: string | null
          "description_bn"?: string | null
          "owner_kind"?: string
          "status"?: Database["public"]["Enums"]["milestone_status"]
          "weight"?: number
          "sort_order"?: number
          "due_on"?: string | null
          "completed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "case_participants": {
        Row: {
          "id": string
          "case_id": string
          "user_id": string
          "role": string
          "added_by": string | null
          "added_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "user_id": string
          "role": string
          "added_by"?: string | null
          "added_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "user_id"?: string
          "role"?: string
          "added_by"?: string | null
          "added_at"?: string
        }
        Relationships: []
      }
      "case_partner_assignments": {
        Row: {
          "id": string
          "case_id": string
          "partner_org_id": string
          "status": Database["public"]["Enums"]["assignment_status"]
          "scope_note": string
          "customer_authorized_at": string | null
          "customer_authorized_by": string | null
          "conflict_check_confirmed": boolean
          "offered_by": string | null
          "offered_at": string
          "responded_at": string | null
          "decline_reason": string | null
          "completed_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "partner_org_id": string
          "status"?: Database["public"]["Enums"]["assignment_status"]
          "scope_note"?: string
          "customer_authorized_at"?: string | null
          "customer_authorized_by"?: string | null
          "conflict_check_confirmed"?: boolean
          "offered_by"?: string | null
          "offered_at"?: string
          "responded_at"?: string | null
          "decline_reason"?: string | null
          "completed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "partner_org_id"?: string
          "status"?: Database["public"]["Enums"]["assignment_status"]
          "scope_note"?: string
          "customer_authorized_at"?: string | null
          "customer_authorized_by"?: string | null
          "conflict_check_confirmed"?: boolean
          "offered_by"?: string | null
          "offered_at"?: string
          "responded_at"?: string | null
          "decline_reason"?: string | null
          "completed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "case_services": {
        Row: {
          "id": string
          "case_id": string
          "service_id": string
          "name_snapshot": string
          "is_primary": boolean
          "added_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "service_id": string
          "name_snapshot": string
          "is_primary"?: boolean
          "added_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "service_id"?: string
          "name_snapshot"?: string
          "is_primary"?: boolean
          "added_at"?: string
        }
        Relationships: []
      }
      "case_status_history": {
        Row: {
          "id": string
          "case_id": string
          "from_status": Database["public"]["Enums"]["case_status"] | null
          "to_status": Database["public"]["Enums"]["case_status"]
          "from_waiting_on": Database["public"]["Enums"]["case_waiting_on"] | null
          "to_waiting_on": Database["public"]["Enums"]["case_waiting_on"] | null
          "reason": string
          "public_note": string | null
          "internal_note": string | null
          "actor_id": string | null
          "actor_kind": string
          "created_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "from_status"?: Database["public"]["Enums"]["case_status"] | null
          "to_status": Database["public"]["Enums"]["case_status"]
          "from_waiting_on"?: Database["public"]["Enums"]["case_waiting_on"] | null
          "to_waiting_on"?: Database["public"]["Enums"]["case_waiting_on"] | null
          "reason": string
          "public_note"?: string | null
          "internal_note"?: string | null
          "actor_id"?: string | null
          "actor_kind"?: string
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "from_status"?: Database["public"]["Enums"]["case_status"] | null
          "to_status"?: Database["public"]["Enums"]["case_status"]
          "from_waiting_on"?: Database["public"]["Enums"]["case_waiting_on"] | null
          "to_waiting_on"?: Database["public"]["Enums"]["case_waiting_on"] | null
          "reason"?: string
          "public_note"?: string | null
          "internal_note"?: string | null
          "actor_id"?: string | null
          "actor_kind"?: string
          "created_at"?: string
        }
        Relationships: []
      }
      "case_status_transitions": {
        Row: {
          "from_status": Database["public"]["Enums"]["case_status"]
          "to_status": Database["public"]["Enums"]["case_status"]
          "allowed_actors": string[]
          "requires_reason": boolean
        }
        Insert: {
          "from_status": Database["public"]["Enums"]["case_status"]
          "to_status": Database["public"]["Enums"]["case_status"]
          "allowed_actors"?: string[]
          "requires_reason"?: boolean
        }
        Update: {
          "from_status"?: Database["public"]["Enums"]["case_status"]
          "to_status"?: Database["public"]["Enums"]["case_status"]
          "allowed_actors"?: string[]
          "requires_reason"?: boolean
        }
        Relationships: []
      }
      "cases": {
        Row: {
          "id": string
          "reference": string
          "organization_id": string
          "company_id": string | null
          "session_id": string | null
          "title": string
          "status": Database["public"]["Enums"]["case_status"]
          "waiting_on": Database["public"]["Enums"]["case_waiting_on"]
          "waiting_since": string | null
          "elapsed_days_banked": number
          "estimated_days_min": number | null
          "estimated_days_max": number | null
          "assigned_manager_id": string | null
          "risk_rating": Database["public"]["Enums"]["risk_rating"] | null
          "opened_at": string
          "closed_at": string | null
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "reference": string
          "organization_id": string
          "company_id"?: string | null
          "session_id"?: string | null
          "title": string
          "status"?: Database["public"]["Enums"]["case_status"]
          "waiting_on"?: Database["public"]["Enums"]["case_waiting_on"]
          "waiting_since"?: string | null
          "elapsed_days_banked"?: number
          "estimated_days_min"?: number | null
          "estimated_days_max"?: number | null
          "assigned_manager_id"?: string | null
          "risk_rating"?: Database["public"]["Enums"]["risk_rating"] | null
          "opened_at"?: string
          "closed_at"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "reference"?: string
          "organization_id"?: string
          "company_id"?: string | null
          "session_id"?: string | null
          "title"?: string
          "status"?: Database["public"]["Enums"]["case_status"]
          "waiting_on"?: Database["public"]["Enums"]["case_waiting_on"]
          "waiting_since"?: string | null
          "elapsed_days_banked"?: number
          "estimated_days_min"?: number | null
          "estimated_days_max"?: number | null
          "assigned_manager_id"?: string | null
          "risk_rating"?: Database["public"]["Enums"]["risk_rating"] | null
          "opened_at"?: string
          "closed_at"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "companies": {
        Row: {
          "id": string
          "organization_id": string
          "legal_name": string
          "trading_name": string | null
          "structure": string
          "registration_no": string | null
          "incorporation_date": string | null
          "etin": string | null
          "bin": string | null
          "status": string
          "authorized_capital": number | null
          "paid_up_capital": number | null
          "currency": Database["public"]["Enums"]["currency_code"]
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "organization_id": string
          "legal_name": string
          "trading_name"?: string | null
          "structure": string
          "registration_no"?: string | null
          "incorporation_date"?: string | null
          "etin"?: string | null
          "bin"?: string | null
          "status"?: string
          "authorized_capital"?: number | null
          "paid_up_capital"?: number | null
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "organization_id"?: string
          "legal_name"?: string
          "trading_name"?: string | null
          "structure"?: string
          "registration_no"?: string | null
          "incorporation_date"?: string | null
          "etin"?: string | null
          "bin"?: string | null
          "status"?: string
          "authorized_capital"?: number | null
          "paid_up_capital"?: number | null
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "company_addresses": {
        Row: {
          "id": string
          "company_id": string
          "kind": string
          "line1": string
          "line2": string | null
          "city": string
          "district": string | null
          "postcode": string | null
          "country": string
          "is_current": boolean
          "valid_from": string | null
          "valid_to": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "company_id": string
          "kind"?: string
          "line1": string
          "line2"?: string | null
          "city": string
          "district"?: string | null
          "postcode"?: string | null
          "country"?: string
          "is_current"?: boolean
          "valid_from"?: string | null
          "valid_to"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "company_id"?: string
          "kind"?: string
          "line1"?: string
          "line2"?: string | null
          "city"?: string
          "district"?: string | null
          "postcode"?: string | null
          "country"?: string
          "is_current"?: boolean
          "valid_from"?: string | null
          "valid_to"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "company_people": {
        Row: {
          "id": string
          "company_id": string
          "user_id": string | null
          "full_name": string
          "role": string
          "email": string | null
          "phone": string | null
          "nationality": string | null
          "country_of_residence": string | null
          "date_of_birth": string | null
          "occupation": string | null
          "is_signatory": boolean
          "appointed_on": string | null
          "resigned_on": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "company_id": string
          "user_id"?: string | null
          "full_name": string
          "role": string
          "email"?: string | null
          "phone"?: string | null
          "nationality"?: string | null
          "country_of_residence"?: string | null
          "date_of_birth"?: string | null
          "occupation"?: string | null
          "is_signatory"?: boolean
          "appointed_on"?: string | null
          "resigned_on"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "company_id"?: string
          "user_id"?: string | null
          "full_name"?: string
          "role"?: string
          "email"?: string | null
          "phone"?: string | null
          "nationality"?: string | null
          "country_of_residence"?: string | null
          "date_of_birth"?: string | null
          "occupation"?: string | null
          "is_signatory"?: boolean
          "appointed_on"?: string | null
          "resigned_on"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "compliance_obligations": {
        Row: {
          "id": string
          "organization_id": string
          "company_id": string | null
          "case_id": string | null
          "obligation_type": string
          "label_en": string
          "label_bn": string
          "authority_name": string | null
          "responsible_kind": string
          "owner_user_id": string | null
          "due_on": string
          "status": Database["public"]["Enums"]["obligation_status"]
          "source": string
          "source_rule_ref": string | null
          "required_documents": string[]
          "renewal_case_id": string | null
          "evidence_document_id": string | null
          "completed_at": string | null
          "completed_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "organization_id": string
          "company_id"?: string | null
          "case_id"?: string | null
          "obligation_type": string
          "label_en": string
          "label_bn": string
          "authority_name"?: string | null
          "responsible_kind"?: string
          "owner_user_id"?: string | null
          "due_on": string
          "status"?: Database["public"]["Enums"]["obligation_status"]
          "source"?: string
          "source_rule_ref"?: string | null
          "required_documents"?: string[]
          "renewal_case_id"?: string | null
          "evidence_document_id"?: string | null
          "completed_at"?: string | null
          "completed_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "organization_id"?: string
          "company_id"?: string | null
          "case_id"?: string | null
          "obligation_type"?: string
          "label_en"?: string
          "label_bn"?: string
          "authority_name"?: string | null
          "responsible_kind"?: string
          "owner_user_id"?: string | null
          "due_on"?: string
          "status"?: Database["public"]["Enums"]["obligation_status"]
          "source"?: string
          "source_rule_ref"?: string | null
          "required_documents"?: string[]
          "renewal_case_id"?: string | null
          "evidence_document_id"?: string | null
          "completed_at"?: string | null
          "completed_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "compliance_reminders": {
        Row: {
          "id": string
          "obligation_id": string
          "offset_days": number
          "channel": Database["public"]["Enums"]["notification_channel"]
          "scheduled_for": string
          "sent_at": string | null
          "failed_at": string | null
          "failure_reason": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "obligation_id": string
          "offset_days": number
          "channel"?: Database["public"]["Enums"]["notification_channel"]
          "scheduled_for": string
          "sent_at"?: string | null
          "failed_at"?: string | null
          "failure_reason"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "obligation_id"?: string
          "offset_days"?: number
          "channel"?: Database["public"]["Enums"]["notification_channel"]
          "scheduled_for"?: string
          "sent_at"?: string | null
          "failed_at"?: string | null
          "failure_reason"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "consent_records": {
        Row: {
          "id": string
          "user_id": string | null
          "organization_id": string | null
          "case_id": string | null
          "consent_type": Database["public"]["Enums"]["consent_type"]
          "policy_version": string
          "locale": Database["public"]["Enums"]["locale_code"]
          "granted": boolean
          "ip_hash": string | null
          "user_agent_hash": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "user_id"?: string | null
          "organization_id"?: string | null
          "case_id"?: string | null
          "consent_type": Database["public"]["Enums"]["consent_type"]
          "policy_version": string
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "granted"?: boolean
          "ip_hash"?: string | null
          "user_agent_hash"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "user_id"?: string | null
          "organization_id"?: string | null
          "case_id"?: string | null
          "consent_type"?: Database["public"]["Enums"]["consent_type"]
          "policy_version"?: string
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "granted"?: boolean
          "ip_hash"?: string | null
          "user_agent_hash"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "contact_requests": {
        Row: {
          "id": string
          "full_name": string
          "email": string
          "phone": string | null
          "topic": string
          "message": string
          "locale": Database["public"]["Enums"]["locale_code"]
          "consent_given": boolean
          "handled_by": string | null
          "handled_at": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "full_name": string
          "email": string
          "phone"?: string | null
          "topic": string
          "message": string
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "consent_given"?: boolean
          "handled_by"?: string | null
          "handled_at"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "full_name"?: string
          "email"?: string
          "phone"?: string | null
          "topic"?: string
          "message"?: string
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "consent_given"?: boolean
          "handled_by"?: string | null
          "handled_at"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "content_pages": {
        Row: {
          "id": string
          "slug": string
          "kind": string
          "title_en": string
          "title_bn": string
          "excerpt_en": string | null
          "excerpt_bn": string | null
          "body_en": string
          "body_bn": string
          "status": Database["public"]["Enums"]["publication_status"]
          "is_compliance_sensitive": boolean
          "last_reviewed_at": string | null
          "reviewed_by": string | null
          "next_review_due": string | null
          "published_at": string | null
          "reading_minutes": number | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "slug": string
          "kind"?: string
          "title_en": string
          "title_bn": string
          "excerpt_en"?: string | null
          "excerpt_bn"?: string | null
          "body_en"?: string
          "body_bn"?: string
          "status"?: Database["public"]["Enums"]["publication_status"]
          "is_compliance_sensitive"?: boolean
          "last_reviewed_at"?: string | null
          "reviewed_by"?: string | null
          "next_review_due"?: string | null
          "published_at"?: string | null
          "reading_minutes"?: number | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "slug"?: string
          "kind"?: string
          "title_en"?: string
          "title_bn"?: string
          "excerpt_en"?: string | null
          "excerpt_bn"?: string | null
          "body_en"?: string
          "body_bn"?: string
          "status"?: Database["public"]["Enums"]["publication_status"]
          "is_compliance_sensitive"?: boolean
          "last_reviewed_at"?: string | null
          "reviewed_by"?: string | null
          "next_review_due"?: string | null
          "published_at"?: string | null
          "reading_minutes"?: number | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "content_revisions": {
        Row: {
          "id": string
          "page_id": string
          "revision_no": number
          "title_en": string
          "title_bn": string
          "body_en": string
          "body_bn": string
          "change_note": string | null
          "created_by": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "page_id": string
          "revision_no": number
          "title_en": string
          "title_bn": string
          "body_en": string
          "body_bn": string
          "change_note"?: string | null
          "created_by"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "page_id"?: string
          "revision_no"?: number
          "title_en"?: string
          "title_bn"?: string
          "body_en"?: string
          "body_bn"?: string
          "change_note"?: string | null
          "created_by"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "content_sources": {
        Row: {
          "id": string
          "page_id": string | null
          "service_id": string | null
          "label": string
          "reference": string
          "url": string | null
          "checked_at": string | null
          "checked_by": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "page_id"?: string | null
          "service_id"?: string | null
          "label": string
          "reference": string
          "url"?: string | null
          "checked_at"?: string | null
          "checked_by"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "page_id"?: string | null
          "service_id"?: string | null
          "label"?: string
          "reference"?: string
          "url"?: string | null
          "checked_at"?: string | null
          "checked_by"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "countries": {
        Row: {
          "code": string
          "name_en": string
          "name_bn": string
          "summary_en": string | null
          "summary_bn": string | null
          "status": Database["public"]["Enums"]["publication_status"]
          "sort_order": number
          "is_flagship": boolean
          "official_sources": Json
          "last_verified_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "code": string
          "name_en": string
          "name_bn": string
          "summary_en"?: string | null
          "summary_bn"?: string | null
          "status"?: Database["public"]["Enums"]["publication_status"]
          "sort_order"?: number
          "is_flagship"?: boolean
          "official_sources"?: Json
          "last_verified_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "code"?: string
          "name_en"?: string
          "name_bn"?: string
          "summary_en"?: string | null
          "summary_bn"?: string | null
          "status"?: Database["public"]["Enums"]["publication_status"]
          "sort_order"?: number
          "is_flagship"?: boolean
          "official_sources"?: Json
          "last_verified_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "data_subject_requests": {
        Row: {
          "id": string
          "user_id": string
          "organization_id": string | null
          "request_type": string
          "status": string
          "detail": string | null
          "legal_hold_reason": string | null
          "handled_by": string | null
          "responded_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "user_id": string
          "organization_id"?: string | null
          "request_type": string
          "status"?: string
          "detail"?: string | null
          "legal_hold_reason"?: string | null
          "handled_by"?: string | null
          "responded_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "user_id"?: string
          "organization_id"?: string | null
          "request_type"?: string
          "status"?: string
          "detail"?: string | null
          "legal_hold_reason"?: string | null
          "handled_by"?: string | null
          "responded_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "document_access_logs": {
        Row: {
          "id": string
          "document_id": string
          "version_id": string | null
          "actor_id": string | null
          "actor_org_id": string | null
          "action": string
          "correlation_id": string | null
          "ip_hash": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "document_id": string
          "version_id"?: string | null
          "actor_id"?: string | null
          "actor_org_id"?: string | null
          "action": string
          "correlation_id"?: string | null
          "ip_hash"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "document_id"?: string
          "version_id"?: string | null
          "actor_id"?: string | null
          "actor_org_id"?: string | null
          "action"?: string
          "correlation_id"?: string | null
          "ip_hash"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "document_requests": {
        Row: {
          "id": string
          "case_id": string
          "requirement_code": string | null
          "label_en": string
          "label_bn": string
          "help_en": string | null
          "help_bn": string | null
          "category": string
          "subject_person_id": string | null
          "company_id": string | null
          "status": Database["public"]["Enums"]["document_status"]
          "is_mandatory": boolean
          "due_on": string | null
          "requested_by": string | null
          "fulfilled_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "requirement_code"?: string | null
          "label_en": string
          "label_bn": string
          "help_en"?: string | null
          "help_bn"?: string | null
          "category"?: string
          "subject_person_id"?: string | null
          "company_id"?: string | null
          "status"?: Database["public"]["Enums"]["document_status"]
          "is_mandatory"?: boolean
          "due_on"?: string | null
          "requested_by"?: string | null
          "fulfilled_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "requirement_code"?: string | null
          "label_en"?: string
          "label_bn"?: string
          "help_en"?: string | null
          "help_bn"?: string | null
          "category"?: string
          "subject_person_id"?: string | null
          "company_id"?: string | null
          "status"?: Database["public"]["Enums"]["document_status"]
          "is_mandatory"?: boolean
          "due_on"?: string | null
          "requested_by"?: string | null
          "fulfilled_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "document_retention_rules": {
        Row: {
          "id": string
          "retention_category": string
          "label_en": string
          "label_bn": string
          "retain_years": number
          "legal_basis": string
          "allows_early_deletion": boolean
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "retention_category": string
          "label_en": string
          "label_bn": string
          "retain_years": number
          "legal_basis": string
          "allows_early_deletion"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "retention_category"?: string
          "label_en"?: string
          "label_bn"?: string
          "retain_years"?: number
          "legal_basis"?: string
          "allows_early_deletion"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "document_scan_results": {
        Row: {
          "id": string
          "version_id": string
          "provider": string
          "status": Database["public"]["Enums"]["document_scan_status"]
          "signature": string | null
          "raw_summary": string | null
          "scanned_at": string
        }
        Insert: {
          "id"?: string
          "version_id": string
          "provider": string
          "status": Database["public"]["Enums"]["document_scan_status"]
          "signature"?: string | null
          "raw_summary"?: string | null
          "scanned_at"?: string
        }
        Update: {
          "id"?: string
          "version_id"?: string
          "provider"?: string
          "status"?: Database["public"]["Enums"]["document_scan_status"]
          "signature"?: string | null
          "raw_summary"?: string | null
          "scanned_at"?: string
        }
        Relationships: []
      }
      "document_versions": {
        Row: {
          "id": string
          "document_id": string
          "version_no": number
          "storage_path": string
          "file_name": string
          "mime_type": string
          "byte_size": number
          "checksum_sha256": string | null
          "scan_status": Database["public"]["Enums"]["document_scan_status"]
          "scan_provider": string | null
          "scanned_at": string | null
          "uploaded_by": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "document_id": string
          "version_no": number
          "storage_path": string
          "file_name": string
          "mime_type": string
          "byte_size": number
          "checksum_sha256"?: string | null
          "scan_status"?: Database["public"]["Enums"]["document_scan_status"]
          "scan_provider"?: string | null
          "scanned_at"?: string | null
          "uploaded_by"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "document_id"?: string
          "version_no"?: number
          "storage_path"?: string
          "file_name"?: string
          "mime_type"?: string
          "byte_size"?: number
          "checksum_sha256"?: string | null
          "scan_status"?: Database["public"]["Enums"]["document_scan_status"]
          "scan_provider"?: string | null
          "scanned_at"?: string | null
          "uploaded_by"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "documents": {
        Row: {
          "id": string
          "organization_id": string
          "case_id": string | null
          "request_id": string | null
          "company_id": string | null
          "person_id": string | null
          "bucket_id": string
          "title": string
          "category": string
          "visibility": Database["public"]["Enums"]["document_visibility"]
          "status": Database["public"]["Enums"]["document_status"]
          "current_version": number
          "retention_category": string
          "retain_until": string | null
          "deletion_eligible_at": string | null
          "expires_on": string | null
          "uploaded_by": string | null
          "uploaded_by_org_id": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "organization_id": string
          "case_id"?: string | null
          "request_id"?: string | null
          "company_id"?: string | null
          "person_id"?: string | null
          "bucket_id": string
          "title": string
          "category"?: string
          "visibility"?: Database["public"]["Enums"]["document_visibility"]
          "status"?: Database["public"]["Enums"]["document_status"]
          "current_version"?: number
          "retention_category"?: string
          "retain_until"?: string | null
          "deletion_eligible_at"?: string | null
          "expires_on"?: string | null
          "uploaded_by"?: string | null
          "uploaded_by_org_id"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "organization_id"?: string
          "case_id"?: string | null
          "request_id"?: string | null
          "company_id"?: string | null
          "person_id"?: string | null
          "bucket_id"?: string
          "title"?: string
          "category"?: string
          "visibility"?: Database["public"]["Enums"]["document_visibility"]
          "status"?: Database["public"]["Enums"]["document_status"]
          "current_version"?: number
          "retention_category"?: string
          "retain_until"?: string | null
          "deletion_eligible_at"?: string | null
          "expires_on"?: string | null
          "uploaded_by"?: string | null
          "uploaded_by_org_id"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "engagement_acceptances": {
        Row: {
          "id": string
          "case_id": string
          "quote_version_id": string | null
          "acceptance_type": Database["public"]["Enums"]["consent_type"]
          "accepted_by": string
          "organization_id": string
          "partner_org_id": string | null
          "document_version": string
          "locale": Database["public"]["Enums"]["locale_code"]
          "ip_hash": string | null
          "accepted_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "quote_version_id"?: string | null
          "acceptance_type": Database["public"]["Enums"]["consent_type"]
          "accepted_by": string
          "organization_id": string
          "partner_org_id"?: string | null
          "document_version": string
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "ip_hash"?: string | null
          "accepted_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "quote_version_id"?: string | null
          "acceptance_type"?: Database["public"]["Enums"]["consent_type"]
          "accepted_by"?: string
          "organization_id"?: string
          "partner_org_id"?: string | null
          "document_version"?: string
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "ip_hash"?: string | null
          "accepted_at"?: string
        }
        Relationships: []
      }
      "evidence_claims": {
        Row: {
          "id": string
          "claim_text_en": string
          "claim_text_bn": string | null
          "source_type": Database["public"]["Enums"]["evidence_source_type"]
          "source_url": string | null
          "source_published_at": string | null
          "last_verified_at": string | null
          "reviewer_user_id": string | null
          "status": Database["public"]["Enums"]["evidence_status"]
          "allowed_countries": string[]
          "allowed_services": string[]
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id": string
          "claim_text_en": string
          "claim_text_bn"?: string | null
          "source_type": Database["public"]["Enums"]["evidence_source_type"]
          "source_url"?: string | null
          "source_published_at"?: string | null
          "last_verified_at"?: string | null
          "reviewer_user_id"?: string | null
          "status"?: Database["public"]["Enums"]["evidence_status"]
          "allowed_countries"?: string[]
          "allowed_services"?: string[]
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "claim_text_en"?: string
          "claim_text_bn"?: string | null
          "source_type"?: Database["public"]["Enums"]["evidence_source_type"]
          "source_url"?: string | null
          "source_published_at"?: string | null
          "last_verified_at"?: string | null
          "reviewer_user_id"?: string | null
          "status"?: Database["public"]["Enums"]["evidence_status"]
          "allowed_countries"?: string[]
          "allowed_services"?: string[]
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "feature_flags": {
        Row: {
          "key": string
          "description": string
          "is_enabled": boolean
          "rollout_note": string | null
          "updated_by": string | null
          "updated_at": string
        }
        Insert: {
          "key": string
          "description": string
          "is_enabled"?: boolean
          "rollout_note"?: string | null
          "updated_by"?: string | null
          "updated_at"?: string
        }
        Update: {
          "key"?: string
          "description"?: string
          "is_enabled"?: boolean
          "rollout_note"?: string | null
          "updated_by"?: string | null
          "updated_at"?: string
        }
        Relationships: []
      }
      "government_disbursements": {
        Row: {
          "id": string
          "advance_id": string
          "case_id": string
          "authority_name": string
          "purpose": string
          "amount_minor": number
          "currency": Database["public"]["Enums"]["currency_code"]
          "paid_on": string
          "challan_no": string | null
          "receipt_document_id": string | null
          "recorded_by": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "advance_id": string
          "case_id": string
          "authority_name": string
          "purpose": string
          "amount_minor": number
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "paid_on": string
          "challan_no"?: string | null
          "receipt_document_id"?: string | null
          "recorded_by"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "advance_id"?: string
          "case_id"?: string
          "authority_name"?: string
          "purpose"?: string
          "amount_minor"?: number
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "paid_on"?: string
          "challan_no"?: string | null
          "receipt_document_id"?: string | null
          "recorded_by"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "government_fee_advances": {
        Row: {
          "id": string
          "case_id": string
          "organization_id": string
          "payment_id": string | null
          "currency": Database["public"]["Enums"]["currency_code"]
          "received_minor": number
          "disbursed_minor": number
          "refunded_minor": number
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "organization_id": string
          "payment_id"?: string | null
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "received_minor"?: number
          "disbursed_minor"?: number
          "refunded_minor"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "organization_id"?: string
          "payment_id"?: string | null
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "received_minor"?: number
          "disbursed_minor"?: number
          "refunded_minor"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "identity_records": {
        Row: {
          "id": string
          "subject_person_id": string | null
          "subject_user_id": string | null
          "organization_id": string
          "document_type": string
          "issuing_country": string | null
          "identifier_last4": string | null
          "identifier_token": string | null
          "issued_on": string | null
          "expires_on": string | null
          "verified_at": string | null
          "verified_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "subject_person_id"?: string | null
          "subject_user_id"?: string | null
          "organization_id": string
          "document_type": string
          "issuing_country"?: string | null
          "identifier_last4"?: string | null
          "identifier_token"?: string | null
          "issued_on"?: string | null
          "expires_on"?: string | null
          "verified_at"?: string | null
          "verified_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "subject_person_id"?: string | null
          "subject_user_id"?: string | null
          "organization_id"?: string
          "document_type"?: string
          "issuing_country"?: string | null
          "identifier_last4"?: string | null
          "identifier_token"?: string | null
          "issued_on"?: string | null
          "expires_on"?: string | null
          "verified_at"?: string | null
          "verified_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "industries": {
        Row: {
          "id": string
          "slug": string
          "name_en": string
          "name_bn": string
          "summary_en": string | null
          "summary_bn": string | null
          "body_en": string | null
          "body_bn": string | null
          "status": Database["public"]["Enums"]["publication_status"]
          "last_verified_at": string | null
          "sort_order": number
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "slug": string
          "name_en": string
          "name_bn": string
          "summary_en"?: string | null
          "summary_bn"?: string | null
          "body_en"?: string | null
          "body_bn"?: string | null
          "status"?: Database["public"]["Enums"]["publication_status"]
          "last_verified_at"?: string | null
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "slug"?: string
          "name_en"?: string
          "name_bn"?: string
          "summary_en"?: string | null
          "summary_bn"?: string | null
          "body_en"?: string | null
          "body_bn"?: string | null
          "status"?: Database["public"]["Enums"]["publication_status"]
          "last_verified_at"?: string | null
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "integration_events": {
        Row: {
          "id": string
          "integration": string
          "event_type": string
          "status": string
          "attempts": number
          "next_attempt_at": string | null
          "correlation_id": string | null
          "payload": Json
          "last_error": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "integration": string
          "event_type": string
          "status"?: string
          "attempts"?: number
          "next_attempt_at"?: string | null
          "correlation_id"?: string | null
          "payload"?: Json
          "last_error"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "integration"?: string
          "event_type"?: string
          "status"?: string
          "attempts"?: number
          "next_attempt_at"?: string | null
          "correlation_id"?: string | null
          "payload"?: Json
          "last_error"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "international_offers": {
        Row: {
          "id": string
          "slug": string
          "country_code": string
          "route_en": string
          "route_bn": string
          "status": Database["public"]["Enums"]["publication_status"]
          "checkout_enabled": boolean
          "public_label_en": string
          "public_label_bn": string
          "summary_en": string
          "summary_bn": string
          "disclosures": Json
          "fee_components": Json
          "partner_agreement_id": string | null
          "source_reviewed_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "slug": string
          "country_code": string
          "route_en": string
          "route_bn": string
          "status"?: Database["public"]["Enums"]["publication_status"]
          "checkout_enabled"?: boolean
          "public_label_en": string
          "public_label_bn": string
          "summary_en": string
          "summary_bn": string
          "disclosures"?: Json
          "fee_components"?: Json
          "partner_agreement_id"?: string | null
          "source_reviewed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "slug"?: string
          "country_code"?: string
          "route_en"?: string
          "route_bn"?: string
          "status"?: Database["public"]["Enums"]["publication_status"]
          "checkout_enabled"?: boolean
          "public_label_en"?: string
          "public_label_bn"?: string
          "summary_en"?: string
          "summary_bn"?: string
          "disclosures"?: Json
          "fee_components"?: Json
          "partner_agreement_id"?: string | null
          "source_reviewed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "invoice_items": {
        Row: {
          "id": string
          "invoice_id": string
          "quote_item_id": string | null
          "category": Database["public"]["Enums"]["quote_item_category"]
          "description_en": string
          "description_bn": string
          "quantity": number
          "unit_amount_minor": number
          "tax_rate_bp": number
          "payee": Database["public"]["Enums"]["payee_type"]
          "sort_order": number
        }
        Insert: {
          "id"?: string
          "invoice_id": string
          "quote_item_id"?: string | null
          "category": Database["public"]["Enums"]["quote_item_category"]
          "description_en": string
          "description_bn": string
          "quantity"?: number
          "unit_amount_minor": number
          "tax_rate_bp"?: number
          "payee": Database["public"]["Enums"]["payee_type"]
          "sort_order"?: number
        }
        Update: {
          "id"?: string
          "invoice_id"?: string
          "quote_item_id"?: string | null
          "category"?: Database["public"]["Enums"]["quote_item_category"]
          "description_en"?: string
          "description_bn"?: string
          "quantity"?: number
          "unit_amount_minor"?: number
          "tax_rate_bp"?: number
          "payee"?: Database["public"]["Enums"]["payee_type"]
          "sort_order"?: number
        }
        Relationships: []
      }
      "invoices": {
        Row: {
          "id": string
          "case_id": string
          "organization_id": string
          "quote_version_id": string | null
          "number": string
          "status": Database["public"]["Enums"]["invoice_status"]
          "currency": Database["public"]["Enums"]["currency_code"]
          "subtotal_minor": number
          "tax_minor": number
          "total_minor": number
          "paid_minor": number
          "issued_at": string | null
          "due_on": string | null
          "voided_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "organization_id": string
          "quote_version_id"?: string | null
          "number": string
          "status"?: Database["public"]["Enums"]["invoice_status"]
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "subtotal_minor"?: number
          "tax_minor"?: number
          "total_minor"?: number
          "paid_minor"?: number
          "issued_at"?: string | null
          "due_on"?: string | null
          "voided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "organization_id"?: string
          "quote_version_id"?: string | null
          "number"?: string
          "status"?: Database["public"]["Enums"]["invoice_status"]
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "subtotal_minor"?: number
          "tax_minor"?: number
          "total_minor"?: number
          "paid_minor"?: number
          "issued_at"?: string | null
          "due_on"?: string | null
          "voided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "kyc_cases": {
        Row: {
          "id": string
          "case_id": string
          "organization_id": string
          "subject_type": Database["public"]["Enums"]["kyc_subject_type"]
          "subject_person_id": string | null
          "subject_company_id": string | null
          "subject_label": string
          "overall_status": Database["public"]["Enums"]["kyc_check_status"]
          "risk_rating": Database["public"]["Enums"]["risk_rating"] | null
          "opened_at": string
          "decided_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "organization_id": string
          "subject_type"?: Database["public"]["Enums"]["kyc_subject_type"]
          "subject_person_id"?: string | null
          "subject_company_id"?: string | null
          "subject_label": string
          "overall_status"?: Database["public"]["Enums"]["kyc_check_status"]
          "risk_rating"?: Database["public"]["Enums"]["risk_rating"] | null
          "opened_at"?: string
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "organization_id"?: string
          "subject_type"?: Database["public"]["Enums"]["kyc_subject_type"]
          "subject_person_id"?: string | null
          "subject_company_id"?: string | null
          "subject_label"?: string
          "overall_status"?: Database["public"]["Enums"]["kyc_check_status"]
          "risk_rating"?: Database["public"]["Enums"]["risk_rating"] | null
          "opened_at"?: string
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "kyc_checks": {
        Row: {
          "id": string
          "kyc_case_id": string
          "check_type": Database["public"]["Enums"]["kyc_check_type"]
          "status": Database["public"]["Enums"]["kyc_check_status"]
          "customer_note": string | null
          "performed_by": string | null
          "performed_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "kyc_case_id": string
          "check_type": Database["public"]["Enums"]["kyc_check_type"]
          "status"?: Database["public"]["Enums"]["kyc_check_status"]
          "customer_note"?: string | null
          "performed_by"?: string | null
          "performed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "kyc_case_id"?: string
          "check_type"?: Database["public"]["Enums"]["kyc_check_type"]
          "status"?: Database["public"]["Enums"]["kyc_check_status"]
          "customer_note"?: string | null
          "performed_by"?: string | null
          "performed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "leads": {
        Row: {
          "id": string
          "session_id": string | null
          "user_id": string | null
          "organization_id": string | null
          "full_name": string | null
          "email": string | null
          "phone": string | null
          "country": string | null
          "intent": string | null
          "source": string
          "status": string
          "assigned_to": string | null
          "notes": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "session_id"?: string | null
          "user_id"?: string | null
          "organization_id"?: string | null
          "full_name"?: string | null
          "email"?: string | null
          "phone"?: string | null
          "country"?: string | null
          "intent"?: string | null
          "source"?: string
          "status"?: string
          "assigned_to"?: string | null
          "notes"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "session_id"?: string | null
          "user_id"?: string | null
          "organization_id"?: string | null
          "full_name"?: string | null
          "email"?: string | null
          "phone"?: string | null
          "country"?: string | null
          "intent"?: string | null
          "source"?: string
          "status"?: string
          "assigned_to"?: string | null
          "notes"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "membership_permission_overrides": {
        Row: {
          "id": string
          "membership_id": string
          "permission_key": string
          "effect": string
          "reason": string
          "granted_by": string | null
          "expires_at": string | null
          "revoked_at": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "membership_id": string
          "permission_key": string
          "effect": string
          "reason": string
          "granted_by"?: string | null
          "expires_at"?: string | null
          "revoked_at"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "membership_id"?: string
          "permission_key"?: string
          "effect"?: string
          "reason"?: string
          "granted_by"?: string | null
          "expires_at"?: string | null
          "revoked_at"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "message_reads": {
        Row: {
          "message_id": string
          "user_id": string
          "read_at": string
        }
        Insert: {
          "message_id": string
          "user_id": string
          "read_at"?: string
        }
        Update: {
          "message_id"?: string
          "user_id"?: string
          "read_at"?: string
        }
        Relationships: []
      }
      "message_threads": {
        Row: {
          "id": string
          "case_id": string
          "subject": string
          "audience": string
          "is_closed": boolean
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "subject": string
          "audience"?: string
          "is_closed"?: boolean
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "subject"?: string
          "audience"?: string
          "is_closed"?: boolean
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "messages": {
        Row: {
          "id": string
          "thread_id": string
          "author_id": string | null
          "author_kind": string
          "body": string
          "is_internal_note": boolean
          "document_id": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "thread_id": string
          "author_id"?: string | null
          "author_kind"?: string
          "body": string
          "is_internal_note"?: boolean
          "document_id"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "thread_id"?: string
          "author_id"?: string | null
          "author_kind"?: string
          "body"?: string
          "is_internal_note"?: boolean
          "document_id"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "notification_preferences": {
        Row: {
          "user_id": string
          "kind": string
          "channel": Database["public"]["Enums"]["notification_channel"]
          "enabled": boolean
          "updated_at": string
        }
        Insert: {
          "user_id": string
          "kind": string
          "channel": Database["public"]["Enums"]["notification_channel"]
          "enabled"?: boolean
          "updated_at"?: string
        }
        Update: {
          "user_id"?: string
          "kind"?: string
          "channel"?: Database["public"]["Enums"]["notification_channel"]
          "enabled"?: boolean
          "updated_at"?: string
        }
        Relationships: []
      }
      "notifications": {
        Row: {
          "id": string
          "user_id": string
          "organization_id": string | null
          "case_id": string | null
          "kind": string
          "title_en": string
          "title_bn": string
          "body_en": string | null
          "body_bn": string | null
          "href": string | null
          "read_at": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "user_id": string
          "organization_id"?: string | null
          "case_id"?: string | null
          "kind": string
          "title_en": string
          "title_bn": string
          "body_en"?: string | null
          "body_bn"?: string | null
          "href"?: string | null
          "read_at"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "user_id"?: string
          "organization_id"?: string | null
          "case_id"?: string | null
          "kind"?: string
          "title_en"?: string
          "title_bn"?: string
          "body_en"?: string | null
          "body_bn"?: string | null
          "href"?: string | null
          "read_at"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "organization_invitations": {
        Row: {
          "id": string
          "organization_id": string
          "email": string
          "role": Database["public"]["Enums"]["organization_role"]
          "status": Database["public"]["Enums"]["invitation_status"]
          "token_hash": string
          "invited_by": string | null
          "accepted_by": string | null
          "expires_at": string
          "accepted_at": string | null
          "revoked_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "organization_id": string
          "email": string
          "role": Database["public"]["Enums"]["organization_role"]
          "status"?: Database["public"]["Enums"]["invitation_status"]
          "token_hash": string
          "invited_by"?: string | null
          "accepted_by"?: string | null
          "expires_at": string
          "accepted_at"?: string | null
          "revoked_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "organization_id"?: string
          "email"?: string
          "role"?: Database["public"]["Enums"]["organization_role"]
          "status"?: Database["public"]["Enums"]["invitation_status"]
          "token_hash"?: string
          "invited_by"?: string | null
          "accepted_by"?: string | null
          "expires_at"?: string
          "accepted_at"?: string | null
          "revoked_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "organization_memberships": {
        Row: {
          "id": string
          "organization_id": string
          "user_id": string
          "role": Database["public"]["Enums"]["organization_role"]
          "invited_by": string | null
          "joined_at": string
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "organization_id": string
          "user_id": string
          "role": Database["public"]["Enums"]["organization_role"]
          "invited_by"?: string | null
          "joined_at"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "organization_id"?: string
          "user_id"?: string
          "role"?: Database["public"]["Enums"]["organization_role"]
          "invited_by"?: string | null
          "joined_at"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "organizations": {
        Row: {
          "id": string
          "kind": Database["public"]["Enums"]["organization_kind"]
          "name": string
          "slug": string
          "country": string
          "contact_email": string | null
          "contact_phone": string | null
          "locale": Database["public"]["Enums"]["locale_code"]
          "is_active": boolean
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "kind": Database["public"]["Enums"]["organization_kind"]
          "name": string
          "slug": string
          "country"?: string
          "contact_email"?: string | null
          "contact_phone"?: string | null
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "is_active"?: boolean
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "kind"?: Database["public"]["Enums"]["organization_kind"]
          "name"?: string
          "slug"?: string
          "country"?: string
          "contact_email"?: string | null
          "contact_phone"?: string | null
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "is_active"?: boolean
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "ownership_links": {
        Row: {
          "id": string
          "company_id": string
          "owner_person_id": string | null
          "owner_company_id": string | null
          "owner_entity_name": string | null
          "owner_entity_country": string | null
          "ownership_percent": number
          "control_method": string
          "is_direct": boolean
          "created_at": string
        }
        Insert: {
          "id"?: string
          "company_id": string
          "owner_person_id"?: string | null
          "owner_company_id"?: string | null
          "owner_entity_name"?: string | null
          "owner_entity_country"?: string | null
          "ownership_percent": number
          "control_method"?: string
          "is_direct"?: boolean
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "company_id"?: string
          "owner_person_id"?: string | null
          "owner_company_id"?: string | null
          "owner_entity_name"?: string | null
          "owner_entity_country"?: string | null
          "ownership_percent"?: number
          "control_method"?: string
          "is_direct"?: boolean
          "created_at"?: string
        }
        Relationships: []
      }
      "package_fee_components": {
        Row: {
          "id": string
          "package_version_id": string
          "layer": Database["public"]["Enums"]["quote_item_category"]
          "label_en": string
          "label_bn": string
          "amount_minor": number
          "currency": Database["public"]["Enums"]["currency_code"]
          "is_estimate": boolean
          "is_refundable": boolean
          "payee": Database["public"]["Enums"]["payee_type"]
          "tax_treatment": Database["public"]["Enums"]["tax_treatment_status"]
          "source_url": string | null
          "reviewed_at": string | null
          "sort_order": number
          "created_at": string
        }
        Insert: {
          "id"?: string
          "package_version_id": string
          "layer": Database["public"]["Enums"]["quote_item_category"]
          "label_en": string
          "label_bn": string
          "amount_minor": number
          "currency": Database["public"]["Enums"]["currency_code"]
          "is_estimate"?: boolean
          "is_refundable"?: boolean
          "payee": Database["public"]["Enums"]["payee_type"]
          "tax_treatment"?: Database["public"]["Enums"]["tax_treatment_status"]
          "source_url"?: string | null
          "reviewed_at"?: string | null
          "sort_order"?: number
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "package_version_id"?: string
          "layer"?: Database["public"]["Enums"]["quote_item_category"]
          "label_en"?: string
          "label_bn"?: string
          "amount_minor"?: number
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "is_estimate"?: boolean
          "is_refundable"?: boolean
          "payee"?: Database["public"]["Enums"]["payee_type"]
          "tax_treatment"?: Database["public"]["Enums"]["tax_treatment_status"]
          "source_url"?: string | null
          "reviewed_at"?: string | null
          "sort_order"?: number
          "created_at"?: string
        }
        Relationships: []
      }
      "package_versions": {
        Row: {
          "id": string
          "package_id": string
          "version_no": number
          "status": Database["public"]["Enums"]["publication_status"]
          "effective_from": string
          "effective_to": string | null
          "checkout_enabled": boolean
          "public_label_en": string
          "public_label_bn": string
          "summary_en": string
          "summary_bn": string
          "inclusions": Json
          "exclusions": Json
          "limits": Json
          "assumptions": Json
          "approved_by": string | null
          "approved_at": string | null
          "source_reviewed_at": string | null
          "source_url": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "package_id": string
          "version_no": number
          "status"?: Database["public"]["Enums"]["publication_status"]
          "effective_from": string
          "effective_to"?: string | null
          "checkout_enabled"?: boolean
          "public_label_en": string
          "public_label_bn": string
          "summary_en": string
          "summary_bn": string
          "inclusions"?: Json
          "exclusions"?: Json
          "limits"?: Json
          "assumptions"?: Json
          "approved_by"?: string | null
          "approved_at"?: string | null
          "source_reviewed_at"?: string | null
          "source_url"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "package_id"?: string
          "version_no"?: number
          "status"?: Database["public"]["Enums"]["publication_status"]
          "effective_from"?: string
          "effective_to"?: string | null
          "checkout_enabled"?: boolean
          "public_label_en"?: string
          "public_label_bn"?: string
          "summary_en"?: string
          "summary_bn"?: string
          "inclusions"?: Json
          "exclusions"?: Json
          "limits"?: Json
          "assumptions"?: Json
          "approved_by"?: string | null
          "approved_at"?: string | null
          "source_reviewed_at"?: string | null
          "source_url"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "partner_capabilities": {
        Row: {
          "id": string
          "partner_id": string
          "service_id": string | null
          "category_id": string | null
          "is_active": boolean
          "created_at": string
        }
        Insert: {
          "id"?: string
          "partner_id": string
          "service_id"?: string | null
          "category_id"?: string | null
          "is_active"?: boolean
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "partner_id"?: string
          "service_id"?: string | null
          "category_id"?: string | null
          "is_active"?: boolean
          "created_at"?: string
        }
        Relationships: []
      }
      "partner_verifications": {
        Row: {
          "id": string
          "partner_id": string
          "status": Database["public"]["Enums"]["partner_verification_status"]
          "evidence_document_id": string | null
          "note": string | null
          "decided_by": string
          "decided_at": string
        }
        Insert: {
          "id"?: string
          "partner_id": string
          "status": Database["public"]["Enums"]["partner_verification_status"]
          "evidence_document_id"?: string | null
          "note"?: string | null
          "decided_by": string
          "decided_at"?: string
        }
        Update: {
          "id"?: string
          "partner_id"?: string
          "status"?: Database["public"]["Enums"]["partner_verification_status"]
          "evidence_document_id"?: string | null
          "note"?: string | null
          "decided_by"?: string
          "decided_at"?: string
        }
        Relationships: []
      }
      "partners": {
        Row: {
          "id": string
          "organization_id": string
          "legal_name": string
          "practice_type": string
          "bar_council_ref": string | null
          "registration_no": string | null
          "geographic_coverage": string[]
          "website": string | null
          "contact_name": string | null
          "contact_email": string | null
          "contact_phone": string | null
          "verification_status": Database["public"]["Enums"]["partner_verification_status"]
          "conflict_policy_accepted_at": string | null
          "dpa_accepted_at": string | null
          "insurance_expires_on": string | null
          "payment_details": Json | null
          "notes": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "organization_id": string
          "legal_name": string
          "practice_type": string
          "bar_council_ref"?: string | null
          "registration_no"?: string | null
          "geographic_coverage"?: string[]
          "website"?: string | null
          "contact_name"?: string | null
          "contact_email"?: string | null
          "contact_phone"?: string | null
          "verification_status"?: Database["public"]["Enums"]["partner_verification_status"]
          "conflict_policy_accepted_at"?: string | null
          "dpa_accepted_at"?: string | null
          "insurance_expires_on"?: string | null
          "payment_details"?: Json | null
          "notes"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "organization_id"?: string
          "legal_name"?: string
          "practice_type"?: string
          "bar_council_ref"?: string | null
          "registration_no"?: string | null
          "geographic_coverage"?: string[]
          "website"?: string | null
          "contact_name"?: string | null
          "contact_email"?: string | null
          "contact_phone"?: string | null
          "verification_status"?: Database["public"]["Enums"]["partner_verification_status"]
          "conflict_policy_accepted_at"?: string | null
          "dpa_accepted_at"?: string | null
          "insurance_expires_on"?: string | null
          "payment_details"?: Json | null
          "notes"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "payment_events": {
        Row: {
          "id": string
          "payment_id": string | null
          "provider": string
          "event_id": string
          "event_type": string
          "signature_verified": boolean
          "payload": Json
          "processed_at": string | null
          "error": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "payment_id"?: string | null
          "provider": string
          "event_id": string
          "event_type": string
          "signature_verified"?: boolean
          "payload"?: Json
          "processed_at"?: string | null
          "error"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "payment_id"?: string | null
          "provider"?: string
          "event_id"?: string
          "event_type"?: string
          "signature_verified"?: boolean
          "payload"?: Json
          "processed_at"?: string | null
          "error"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "payments": {
        Row: {
          "id": string
          "invoice_id": string | null
          "case_id": string
          "organization_id": string
          "provider": string
          "provider_ref": string | null
          "checkout_session_id": string | null
          "status": Database["public"]["Enums"]["payment_status"]
          "currency": Database["public"]["Enums"]["currency_code"]
          "amount_minor": number
          "refunded_minor": number
          "is_sandbox": boolean
          "reconciled_at": string | null
          "reconciled_by": string | null
          "reconcile_note": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "invoice_id"?: string | null
          "case_id": string
          "organization_id": string
          "provider": string
          "provider_ref"?: string | null
          "checkout_session_id"?: string | null
          "status"?: Database["public"]["Enums"]["payment_status"]
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "amount_minor": number
          "refunded_minor"?: number
          "is_sandbox"?: boolean
          "reconciled_at"?: string | null
          "reconciled_by"?: string | null
          "reconcile_note"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "invoice_id"?: string | null
          "case_id"?: string
          "organization_id"?: string
          "provider"?: string
          "provider_ref"?: string | null
          "checkout_session_id"?: string | null
          "status"?: Database["public"]["Enums"]["payment_status"]
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "amount_minor"?: number
          "refunded_minor"?: number
          "is_sandbox"?: boolean
          "reconciled_at"?: string | null
          "reconciled_by"?: string | null
          "reconcile_note"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "permission_catalog": {
        Row: {
          "key": string
          "category": string
          "description": string
          "requires_aal2": boolean
          "created_at": string
        }
        Insert: {
          "key": string
          "category": string
          "description": string
          "requires_aal2"?: boolean
          "created_at"?: string
        }
        Update: {
          "key"?: string
          "category"?: string
          "description"?: string
          "requires_aal2"?: boolean
          "created_at"?: string
        }
        Relationships: []
      }
      "platform_invitations": {
        Row: {
          "id": string
          "email": string
          "template_code": string
          "status": Database["public"]["Enums"]["invitation_status"]
          "token_hash": string
          "invited_by": string | null
          "accepted_by": string | null
          "reason": string
          "expires_at": string
          "accepted_at": string | null
          "revoked_at": string | null
          "revoked_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "email": string
          "template_code": string
          "status"?: Database["public"]["Enums"]["invitation_status"]
          "token_hash": string
          "invited_by"?: string | null
          "accepted_by"?: string | null
          "reason": string
          "expires_at": string
          "accepted_at"?: string | null
          "revoked_at"?: string | null
          "revoked_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "email"?: string
          "template_code"?: string
          "status"?: Database["public"]["Enums"]["invitation_status"]
          "token_hash"?: string
          "invited_by"?: string | null
          "accepted_by"?: string | null
          "reason"?: string
          "expires_at"?: string
          "accepted_at"?: string | null
          "revoked_at"?: string | null
          "revoked_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "platform_roles": {
        Row: {
          "user_id": string
          "role": Database["public"]["Enums"]["platform_role"]
          "granted_by": string | null
          "granted_at": string
          "expires_at": string | null
        }
        Insert: {
          "user_id": string
          "role": Database["public"]["Enums"]["platform_role"]
          "granted_by"?: string | null
          "granted_at"?: string
          "expires_at"?: string | null
        }
        Update: {
          "user_id"?: string
          "role"?: Database["public"]["Enums"]["platform_role"]
          "granted_by"?: string | null
          "granted_at"?: string
          "expires_at"?: string | null
        }
        Relationships: []
      }
      "platform_settings": {
        Row: {
          "key": string
          "value": Json
          "description": string
          "is_public": boolean
          "updated_by": string | null
          "updated_at": string
        }
        Insert: {
          "key": string
          "value": Json
          "description": string
          "is_public"?: boolean
          "updated_by"?: string | null
          "updated_at"?: string
        }
        Update: {
          "key"?: string
          "value"?: Json
          "description"?: string
          "is_public"?: boolean
          "updated_by"?: string | null
          "updated_at"?: string
        }
        Relationships: []
      }
      "profiles": {
        Row: {
          "id": string
          "full_name": string
          "display_name": string | null
          "email": string | null
          "phone": string | null
          "country_of_residence": string | null
          "preferred_locale": Database["public"]["Enums"]["locale_code"]
          "avatar_url": string | null
          "onboarded_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id": string
          "full_name"?: string
          "display_name"?: string | null
          "email"?: string | null
          "phone"?: string | null
          "country_of_residence"?: string | null
          "preferred_locale"?: Database["public"]["Enums"]["locale_code"]
          "avatar_url"?: string | null
          "onboarded_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "full_name"?: string
          "display_name"?: string | null
          "email"?: string | null
          "phone"?: string | null
          "country_of_residence"?: string | null
          "preferred_locale"?: Database["public"]["Enums"]["locale_code"]
          "avatar_url"?: string | null
          "onboarded_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "questionnaire_answers": {
        Row: {
          "id": string
          "session_id": string
          "question_key": string
          "value": Json
          "answered_at": string
        }
        Insert: {
          "id"?: string
          "session_id": string
          "question_key": string
          "value": Json
          "answered_at"?: string
        }
        Update: {
          "id"?: string
          "session_id"?: string
          "question_key"?: string
          "value"?: Json
          "answered_at"?: string
        }
        Relationships: []
      }
      "questionnaire_sessions": {
        Row: {
          "id": string
          "user_id": string | null
          "organization_id": string | null
          "anon_key_hash": string | null
          "locale": Database["public"]["Enums"]["locale_code"]
          "current_step": string
          "completed_at": string | null
          "claimed_at": string | null
          "expires_at": string
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "user_id"?: string | null
          "organization_id"?: string | null
          "anon_key_hash"?: string | null
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "current_step"?: string
          "completed_at"?: string | null
          "claimed_at"?: string | null
          "expires_at"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "user_id"?: string | null
          "organization_id"?: string | null
          "anon_key_hash"?: string | null
          "locale"?: Database["public"]["Enums"]["locale_code"]
          "current_step"?: string
          "completed_at"?: string | null
          "claimed_at"?: string | null
          "expires_at"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "quote_items": {
        Row: {
          "id": string
          "quote_version_id": string
          "category": Database["public"]["Enums"]["quote_item_category"]
          "service_id": string | null
          "description_en": string
          "description_bn": string
          "quantity": number
          "unit_amount_minor": number
          "currency": Database["public"]["Enums"]["currency_code"]
          "tax_treatment": string
          "tax_rate_bp": number
          "is_included": boolean
          "is_refundable": boolean
          "is_estimate": boolean
          "payee": Database["public"]["Enums"]["payee_type"]
          "payee_name": string | null
          "notes_en": string | null
          "notes_bn": string | null
          "sort_order": number
          "created_at": string
        }
        Insert: {
          "id"?: string
          "quote_version_id": string
          "category": Database["public"]["Enums"]["quote_item_category"]
          "service_id"?: string | null
          "description_en": string
          "description_bn": string
          "quantity"?: number
          "unit_amount_minor": number
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "tax_treatment"?: string
          "tax_rate_bp"?: number
          "is_included"?: boolean
          "is_refundable"?: boolean
          "is_estimate"?: boolean
          "payee": Database["public"]["Enums"]["payee_type"]
          "payee_name"?: string | null
          "notes_en"?: string | null
          "notes_bn"?: string | null
          "sort_order"?: number
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "quote_version_id"?: string
          "category"?: Database["public"]["Enums"]["quote_item_category"]
          "service_id"?: string | null
          "description_en"?: string
          "description_bn"?: string
          "quantity"?: number
          "unit_amount_minor"?: number
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "tax_treatment"?: string
          "tax_rate_bp"?: number
          "is_included"?: boolean
          "is_refundable"?: boolean
          "is_estimate"?: boolean
          "payee"?: Database["public"]["Enums"]["payee_type"]
          "payee_name"?: string | null
          "notes_en"?: string | null
          "notes_bn"?: string | null
          "sort_order"?: number
          "created_at"?: string
        }
        Relationships: []
      }
      "quote_versions": {
        Row: {
          "id": string
          "quote_id": string
          "version_no": number
          "status": Database["public"]["Enums"]["quote_status"]
          "currency": Database["public"]["Enums"]["currency_code"]
          "subtotal_minor": number
          "tax_minor": number
          "total_minor": number
          "bdoor_revenue_minor": number
          "pass_through_minor": number
          "valid_until": string
          "notes_en": string | null
          "notes_bn": string | null
          "prepared_by": string | null
          "approved_by": string | null
          "approved_at": string | null
          "sent_at": string | null
          "accepted_at": string | null
          "superseded_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "quote_id": string
          "version_no": number
          "status"?: Database["public"]["Enums"]["quote_status"]
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "subtotal_minor"?: number
          "tax_minor"?: number
          "total_minor"?: number
          "bdoor_revenue_minor"?: number
          "pass_through_minor"?: number
          "valid_until": string
          "notes_en"?: string | null
          "notes_bn"?: string | null
          "prepared_by"?: string | null
          "approved_by"?: string | null
          "approved_at"?: string | null
          "sent_at"?: string | null
          "accepted_at"?: string | null
          "superseded_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "quote_id"?: string
          "version_no"?: number
          "status"?: Database["public"]["Enums"]["quote_status"]
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "subtotal_minor"?: number
          "tax_minor"?: number
          "total_minor"?: number
          "bdoor_revenue_minor"?: number
          "pass_through_minor"?: number
          "valid_until"?: string
          "notes_en"?: string | null
          "notes_bn"?: string | null
          "prepared_by"?: string | null
          "approved_by"?: string | null
          "approved_at"?: string | null
          "sent_at"?: string | null
          "accepted_at"?: string | null
          "superseded_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "quotes": {
        Row: {
          "id": string
          "case_id": string
          "organization_id": string
          "reference": string
          "current_version": number
          "status": Database["public"]["Enums"]["quote_status"]
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "organization_id": string
          "reference": string
          "current_version"?: number
          "status"?: Database["public"]["Enums"]["quote_status"]
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "organization_id"?: string
          "reference"?: string
          "current_version"?: number
          "status"?: Database["public"]["Enums"]["quote_status"]
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "receipts": {
        Row: {
          "id": string
          "case_id": string
          "organization_id": string
          "kind": string
          "payment_id": string | null
          "disbursement_id": string | null
          "document_id": string | null
          "number": string | null
          "issued_on": string
          "amount_minor": number | null
          "currency": Database["public"]["Enums"]["currency_code"]
          "created_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "organization_id": string
          "kind": string
          "payment_id"?: string | null
          "disbursement_id"?: string | null
          "document_id"?: string | null
          "number"?: string | null
          "issued_on"?: string
          "amount_minor"?: number | null
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "organization_id"?: string
          "kind"?: string
          "payment_id"?: string | null
          "disbursement_id"?: string | null
          "document_id"?: string | null
          "number"?: string | null
          "issued_on"?: string
          "amount_minor"?: number | null
          "currency"?: Database["public"]["Enums"]["currency_code"]
          "created_at"?: string
        }
        Relationships: []
      }
      "recommendation_results": {
        Row: {
          "id": string
          "session_id": string
          "suggested_structure": string | null
          "service_slugs": string[]
          "assumptions": string[]
          "partner_questions": string[]
          "requires_manual_review": boolean
          "manual_review_reasons": string[]
          "rule_keys_matched": string[]
          "engine_version": string
          "created_at": string
        }
        Insert: {
          "id"?: string
          "session_id": string
          "suggested_structure"?: string | null
          "service_slugs"?: string[]
          "assumptions"?: string[]
          "partner_questions"?: string[]
          "requires_manual_review"?: boolean
          "manual_review_reasons"?: string[]
          "rule_keys_matched"?: string[]
          "engine_version"?: string
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "session_id"?: string
          "suggested_structure"?: string | null
          "service_slugs"?: string[]
          "assumptions"?: string[]
          "partner_questions"?: string[]
          "requires_manual_review"?: boolean
          "manual_review_reasons"?: string[]
          "rule_keys_matched"?: string[]
          "engine_version"?: string
          "created_at"?: string
        }
        Relationships: []
      }
      "recommendation_rules": {
        Row: {
          "id": string
          "key": string
          "description": string
          "conditions": Json
          "outcome": Json
          "priority": number
          "is_active": boolean
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "key": string
          "description": string
          "conditions": Json
          "outcome": Json
          "priority"?: number
          "is_active"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "key"?: string
          "description"?: string
          "conditions"?: Json
          "outcome"?: Json
          "priority"?: number
          "is_active"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "refunds": {
        Row: {
          "id": string
          "payment_id": string
          "amount_minor": number
          "reason": string
          "provider_ref": string | null
          "status": string
          "requested_by": string | null
          "approved_by": string | null
          "created_at": string
          "completed_at": string | null
        }
        Insert: {
          "id"?: string
          "payment_id": string
          "amount_minor": number
          "reason": string
          "provider_ref"?: string | null
          "status"?: string
          "requested_by"?: string | null
          "approved_by"?: string | null
          "created_at"?: string
          "completed_at"?: string | null
        }
        Update: {
          "id"?: string
          "payment_id"?: string
          "amount_minor"?: number
          "reason"?: string
          "provider_ref"?: string | null
          "status"?: string
          "requested_by"?: string | null
          "approved_by"?: string | null
          "created_at"?: string
          "completed_at"?: string | null
        }
        Relationships: []
      }
      "renewal_cases": {
        Row: {
          "id": string
          "obligation_id": string
          "case_id": string
          "previous_case_id": string | null
          "period_label": string
          "created_at": string
        }
        Insert: {
          "id"?: string
          "obligation_id": string
          "case_id": string
          "previous_case_id"?: string | null
          "period_label": string
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "obligation_id"?: string
          "case_id"?: string
          "previous_case_id"?: string | null
          "period_label"?: string
          "created_at"?: string
        }
        Relationships: []
      }
      "role_assignments": {
        Row: {
          "id": string
          "user_id": string
          "template_code": string
          "scope_kind": string
          "scope_id": string | null
          "organization_id": string | null
          "granted_by": string | null
          "reason": string
          "starts_at": string
          "expires_at": string | null
          "revoked_at": string | null
          "revoked_by": string | null
          "revoke_reason": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "user_id": string
          "template_code": string
          "scope_kind": string
          "scope_id"?: string | null
          "organization_id"?: string | null
          "granted_by"?: string | null
          "reason": string
          "starts_at"?: string
          "expires_at"?: string | null
          "revoked_at"?: string | null
          "revoked_by"?: string | null
          "revoke_reason"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "user_id"?: string
          "template_code"?: string
          "scope_kind"?: string
          "scope_id"?: string | null
          "organization_id"?: string | null
          "granted_by"?: string | null
          "reason"?: string
          "starts_at"?: string
          "expires_at"?: string | null
          "revoked_at"?: string | null
          "revoked_by"?: string | null
          "revoke_reason"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "role_template_permissions": {
        Row: {
          "template_code": string
          "permission_key": string
        }
        Insert: {
          "template_code": string
          "permission_key": string
        }
        Update: {
          "template_code"?: string
          "permission_key"?: string
        }
        Relationships: []
      }
      "role_templates": {
        Row: {
          "code": string
          "workspace": string
          "label_en": string
          "label_bn": string
          "description": string
          "is_assignable": boolean
          "requires_mfa": boolean
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "code": string
          "workspace": string
          "label_en": string
          "label_bn": string
          "description": string
          "is_assignable"?: boolean
          "requires_mfa"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "code"?: string
          "workspace"?: string
          "label_en"?: string
          "label_bn"?: string
          "description"?: string
          "is_assignable"?: boolean
          "requires_mfa"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "service_categories": {
        Row: {
          "id": string
          "slug": string
          "name_en": string
          "name_bn": string
          "summary_en": string | null
          "summary_bn": string | null
          "icon": string | null
          "sort_order": number
          "is_active": boolean
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "slug": string
          "name_en": string
          "name_bn": string
          "summary_en"?: string | null
          "summary_bn"?: string | null
          "icon"?: string | null
          "sort_order"?: number
          "is_active"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "slug"?: string
          "name_en"?: string
          "name_bn"?: string
          "summary_en"?: string | null
          "summary_bn"?: string | null
          "icon"?: string | null
          "sort_order"?: number
          "is_active"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "service_faqs": {
        Row: {
          "id": string
          "service_id": string | null
          "question_en": string
          "question_bn": string
          "answer_en": string
          "answer_bn": string
          "is_global": boolean
          "is_compliance_sensitive": boolean
          "internal_source_ref": string | null
          "last_reviewed_at": string | null
          "reviewed_by": string | null
          "status": Database["public"]["Enums"]["publication_status"]
          "sort_order": number
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "service_id"?: string | null
          "question_en": string
          "question_bn": string
          "answer_en": string
          "answer_bn": string
          "is_global"?: boolean
          "is_compliance_sensitive"?: boolean
          "internal_source_ref"?: string | null
          "last_reviewed_at"?: string | null
          "reviewed_by"?: string | null
          "status"?: Database["public"]["Enums"]["publication_status"]
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "service_id"?: string | null
          "question_en"?: string
          "question_bn"?: string
          "answer_en"?: string
          "answer_bn"?: string
          "is_global"?: boolean
          "is_compliance_sensitive"?: boolean
          "internal_source_ref"?: string | null
          "last_reviewed_at"?: string | null
          "reviewed_by"?: string | null
          "status"?: Database["public"]["Enums"]["publication_status"]
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "service_fee_components": {
        Row: {
          "id": string
          "service_id": string
          "category": Database["public"]["Enums"]["quote_item_category"]
          "label_en": string
          "label_bn": string
          "payee": Database["public"]["Enums"]["payee_type"]
          "amount_bdt": number | null
          "is_estimate": boolean
          "is_refundable": boolean
          "tax_treatment": string
          "source_ref": string | null
          "reviewed_at": string | null
          "sort_order": number
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "service_id": string
          "category": Database["public"]["Enums"]["quote_item_category"]
          "label_en": string
          "label_bn": string
          "payee": Database["public"]["Enums"]["payee_type"]
          "amount_bdt"?: number | null
          "is_estimate"?: boolean
          "is_refundable"?: boolean
          "tax_treatment"?: string
          "source_ref"?: string | null
          "reviewed_at"?: string | null
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "service_id"?: string
          "category"?: Database["public"]["Enums"]["quote_item_category"]
          "label_en"?: string
          "label_bn"?: string
          "payee"?: Database["public"]["Enums"]["payee_type"]
          "amount_bdt"?: number | null
          "is_estimate"?: boolean
          "is_refundable"?: boolean
          "tax_treatment"?: string
          "source_ref"?: string | null
          "reviewed_at"?: string | null
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "service_milestone_templates": {
        Row: {
          "id": string
          "service_id": string
          "code": string
          "label_en": string
          "label_bn": string
          "description_en": string | null
          "description_bn": string | null
          "owner_kind": string
          "typical_days": number | null
          "weight": number
          "sort_order": number
          "created_at": string
        }
        Insert: {
          "id"?: string
          "service_id": string
          "code": string
          "label_en": string
          "label_bn": string
          "description_en"?: string | null
          "description_bn"?: string | null
          "owner_kind"?: string
          "typical_days"?: number | null
          "weight"?: number
          "sort_order"?: number
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "service_id"?: string
          "code"?: string
          "label_en"?: string
          "label_bn"?: string
          "description_en"?: string | null
          "description_bn"?: string | null
          "owner_kind"?: string
          "typical_days"?: number | null
          "weight"?: number
          "sort_order"?: number
          "created_at"?: string
        }
        Relationships: []
      }
      "service_packages": {
        Row: {
          "id": string
          "slug": string
          "segment": Database["public"]["Enums"]["package_segment"]
          "jurisdiction_code": string
          "name_en": string
          "name_bn": string
          "sort_order": number
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "slug": string
          "segment": Database["public"]["Enums"]["package_segment"]
          "jurisdiction_code"?: string
          "name_en": string
          "name_bn": string
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "slug"?: string
          "segment"?: Database["public"]["Enums"]["package_segment"]
          "jurisdiction_code"?: string
          "name_en"?: string
          "name_bn"?: string
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "service_price_versions": {
        Row: {
          "id": string
          "service_id": string
          "effective_from": string
          "effective_to": string | null
          "starting_fee_bdt": number | null
          "approved_by": string | null
          "approved_at": string | null
          "notes": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "service_id": string
          "effective_from": string
          "effective_to"?: string | null
          "starting_fee_bdt"?: number | null
          "approved_by"?: string | null
          "approved_at"?: string | null
          "notes"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "service_id"?: string
          "effective_from"?: string
          "effective_to"?: string | null
          "starting_fee_bdt"?: number | null
          "approved_by"?: string | null
          "approved_at"?: string | null
          "notes"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "service_requirements": {
        Row: {
          "id": string
          "service_id": string
          "code": string
          "label_en": string
          "label_bn": string
          "help_en": string | null
          "help_bn": string | null
          "applies_to": string
          "is_mandatory": boolean
          "sort_order": number
          "created_at": string
        }
        Insert: {
          "id"?: string
          "service_id": string
          "code": string
          "label_en": string
          "label_bn": string
          "help_en"?: string | null
          "help_bn"?: string | null
          "applies_to"?: string
          "is_mandatory"?: boolean
          "sort_order"?: number
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "service_id"?: string
          "code"?: string
          "label_en"?: string
          "label_bn"?: string
          "help_en"?: string | null
          "help_bn"?: string | null
          "applies_to"?: string
          "is_mandatory"?: boolean
          "sort_order"?: number
          "created_at"?: string
        }
        Relationships: []
      }
      "services": {
        Row: {
          "id": string
          "category_id": string
          "slug": string
          "name_en": string
          "name_bn": string
          "summary_en": string
          "summary_bn": string
          "who_for_en": string | null
          "who_for_bn": string | null
          "included_en": string[]
          "included_bn": string[]
          "not_included_en": string[]
          "not_included_bn": string[]
          "eligibility_en": string | null
          "eligibility_bn": string | null
          "authority_name_en": string | null
          "authority_name_bn": string | null
          "starting_fee_bdt": number | null
          "fee_notes_en": string | null
          "fee_notes_bn": string | null
          "estimated_days_min": number | null
          "estimated_days_max": number | null
          "time_reviewed_at": string | null
          "time_reviewed_by": string | null
          "internal_source_ref": string | null
          "requires_partner": boolean
          "is_regulated": boolean
          "status": Database["public"]["Enums"]["publication_status"]
          "next_review_due": string | null
          "sort_order": number
          "created_at": string
          "updated_at": string
          "delivery_mode": Database["public"]["Enums"]["delivery_mode"]
          "country_code": string
          "industry_slugs": string[]
          "business_stage": string[]
        }
        Insert: {
          "id"?: string
          "category_id": string
          "slug": string
          "name_en": string
          "name_bn": string
          "summary_en": string
          "summary_bn": string
          "who_for_en"?: string | null
          "who_for_bn"?: string | null
          "included_en"?: string[]
          "included_bn"?: string[]
          "not_included_en"?: string[]
          "not_included_bn"?: string[]
          "eligibility_en"?: string | null
          "eligibility_bn"?: string | null
          "authority_name_en"?: string | null
          "authority_name_bn"?: string | null
          "starting_fee_bdt"?: number | null
          "fee_notes_en"?: string | null
          "fee_notes_bn"?: string | null
          "estimated_days_min"?: number | null
          "estimated_days_max"?: number | null
          "time_reviewed_at"?: string | null
          "time_reviewed_by"?: string | null
          "internal_source_ref"?: string | null
          "requires_partner"?: boolean
          "is_regulated"?: boolean
          "status"?: Database["public"]["Enums"]["publication_status"]
          "next_review_due"?: string | null
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
          "delivery_mode"?: Database["public"]["Enums"]["delivery_mode"]
          "country_code"?: string
          "industry_slugs"?: string[]
          "business_stage"?: string[]
        }
        Update: {
          "id"?: string
          "category_id"?: string
          "slug"?: string
          "name_en"?: string
          "name_bn"?: string
          "summary_en"?: string
          "summary_bn"?: string
          "who_for_en"?: string | null
          "who_for_bn"?: string | null
          "included_en"?: string[]
          "included_bn"?: string[]
          "not_included_en"?: string[]
          "not_included_bn"?: string[]
          "eligibility_en"?: string | null
          "eligibility_bn"?: string | null
          "authority_name_en"?: string | null
          "authority_name_bn"?: string | null
          "starting_fee_bdt"?: number | null
          "fee_notes_en"?: string | null
          "fee_notes_bn"?: string | null
          "estimated_days_min"?: number | null
          "estimated_days_max"?: number | null
          "time_reviewed_at"?: string | null
          "time_reviewed_by"?: string | null
          "internal_source_ref"?: string | null
          "requires_partner"?: boolean
          "is_regulated"?: boolean
          "status"?: Database["public"]["Enums"]["publication_status"]
          "next_review_due"?: string | null
          "sort_order"?: number
          "created_at"?: string
          "updated_at"?: string
          "delivery_mode"?: Database["public"]["Enums"]["delivery_mode"]
          "country_code"?: string
          "industry_slugs"?: string[]
          "business_stage"?: string[]
        }
        Relationships: []
      }
      "task_comments": {
        Row: {
          "id": string
          "task_id": string
          "author_id": string | null
          "body": string
          "is_internal": boolean
          "created_at": string
        }
        Insert: {
          "id"?: string
          "task_id": string
          "author_id"?: string | null
          "body": string
          "is_internal"?: boolean
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "task_id"?: string
          "author_id"?: string | null
          "body"?: string
          "is_internal"?: boolean
          "created_at"?: string
        }
        Relationships: []
      }
      "tasks": {
        Row: {
          "id": string
          "case_id": string
          "title": string
          "description": string | null
          "visibility": Database["public"]["Enums"]["task_visibility"]
          "status": Database["public"]["Enums"]["task_status"]
          "owner_kind": string
          "assigned_user_id": string | null
          "assigned_org_id": string | null
          "due_on": string | null
          "completed_at": string | null
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "case_id": string
          "title": string
          "description"?: string | null
          "visibility"?: Database["public"]["Enums"]["task_visibility"]
          "status"?: Database["public"]["Enums"]["task_status"]
          "owner_kind"?: string
          "assigned_user_id"?: string | null
          "assigned_org_id"?: string | null
          "due_on"?: string | null
          "completed_at"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "case_id"?: string
          "title"?: string
          "description"?: string | null
          "visibility"?: Database["public"]["Enums"]["task_visibility"]
          "status"?: Database["public"]["Enums"]["task_status"]
          "owner_kind"?: string
          "assigned_user_id"?: string | null
          "assigned_org_id"?: string | null
          "due_on"?: string | null
          "completed_at"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "user_security_settings": {
        Row: {
          "user_id": string
          "mfa_required": boolean
          "mfa_enrolled_at": string | null
          "last_password_change": string | null
          "last_sign_in_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "user_id": string
          "mfa_required"?: boolean
          "mfa_enrolled_at"?: string | null
          "last_password_change"?: string | null
          "last_sign_in_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "user_id"?: string
          "mfa_required"?: boolean
          "mfa_enrolled_at"?: string | null
          "last_password_change"?: string | null
          "last_sign_in_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "webhook_events": {
        Row: {
          "id": string
          "source": string
          "event_id": string
          "event_type": string
          "signature_verified": boolean
          "received_at": string
          "processed_at": string | null
          "status": string
          "error": string | null
          "payload_hash": string | null
        }
        Insert: {
          "id"?: string
          "source": string
          "event_id": string
          "event_type": string
          "signature_verified"?: boolean
          "received_at"?: string
          "processed_at"?: string | null
          "status"?: string
          "error"?: string | null
          "payload_hash"?: string | null
        }
        Update: {
          "id"?: string
          "source"?: string
          "event_id"?: string
          "event_type"?: string
          "signature_verified"?: boolean
          "received_at"?: string
          "processed_at"?: string | null
          "status"?: string
          "error"?: string | null
          "payload_hash"?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      "case_status_history_public": {
        Row: {
          "id": string | null
          "case_id": string | null
          "from_status": Database["public"]["Enums"]["case_status"] | null
          "to_status": Database["public"]["Enums"]["case_status"] | null
          "from_waiting_on": Database["public"]["Enums"]["case_waiting_on"] | null
          "to_waiting_on": Database["public"]["Enums"]["case_waiting_on"] | null
          "public_note": string | null
          "actor_kind": string | null
          "created_at": string | null
        }
        Relationships: []
      }
      "verified_partners_public": {
        Row: {
          "id": string | null
          "name": string | null
          "practice_type": string | null
          "geographic_coverage": string[] | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      "assignment_status": "offered" | "accepted" | "declined" | "withdrawn" | "completed"
      "case_status": "draft" | "awaiting_kyc" | "kyc_review" | "quote_ready" | "awaiting_acceptance" | "awaiting_payment" | "documents_required" | "partner_review" | "ready_to_submit" | "submitted" | "authority_query" | "customer_action_required" | "approved" | "rejected" | "closed" | "cancelled"
      "case_waiting_on": "none" | "customer" | "partner" | "authority" | "payment"
      "compliance_decision_type": "approved" | "rejected" | "escalated" | "more_information_required"
      "consent_type": "terms_of_service" | "privacy_policy" | "kyc_declaration" | "quote_acceptance" | "partner_engagement" | "partner_data_sharing" | "marketing"
      "currency_code": "BDT" | "USD" | "GBP" | "AED" | "SGD"
      "delivery_mode": "online" | "hybrid" | "in_person"
      "document_scan_status": "pending" | "clean" | "infected" | "quarantined" | "skipped"
      "document_status": "requested" | "uploaded" | "under_review" | "accepted" | "replacement_requested" | "expired" | "archived"
      "document_visibility": "customer" | "internal" | "partner_shared"
      "evidence_source_type": "official_website" | "legislation" | "owner_approved" | "partner_verified" | "internal_review"
      "evidence_status": "draft" | "verified" | "expired" | "withdrawn"
      "invitation_status": "pending" | "accepted" | "revoked" | "expired"
      "invoice_status": "draft" | "issued" | "part_paid" | "paid" | "void" | "refunded"
      "kyc_check_status": "not_started" | "pending" | "passed" | "failed" | "manual_review" | "waived"
      "kyc_check_type": "identity" | "address" | "beneficial_owner" | "pep" | "sanctions" | "adverse_media" | "source_of_funds"
      "kyc_subject_type": "individual" | "entity"
      "locale_code": "en" | "bn"
      "milestone_status": "pending" | "in_progress" | "blocked" | "complete" | "skipped"
      "notification_channel": "in_app" | "email"
      "obligation_status": "upcoming" | "due" | "overdue" | "in_progress" | "completed" | "waived"
      "organization_kind": "customer" | "partner"
      "organization_role": "customer_owner" | "customer_member" | "partner_owner" | "partner_staff"
      "package_segment": "new_business" | "existing_business"
      "partner_verification_status": "unverified" | "in_review" | "verified" | "suspended" | "rejected"
      "payee_type": "bdoor" | "government_authority" | "partner_firm" | "third_party"
      "payment_status": "pending" | "paid" | "failed" | "cancelled" | "partially_refunded" | "refunded"
      "platform_role": "case_manager" | "compliance_officer" | "finance" | "admin" | "super_admin"
      "publication_status": "draft" | "published" | "coming_soon" | "retired"
      "quote_item_category": "platform_service_fee" | "government_fee_estimate" | "partner_professional_fee" | "third_party_cost" | "tax" | "payment_processing_fee" | "discount"
      "quote_status": "draft" | "internal_review" | "sent" | "accepted" | "expired" | "superseded" | "withdrawn"
      "risk_rating": "low" | "medium" | "high" | "prohibited"
      "task_status": "open" | "in_progress" | "blocked" | "done" | "cancelled"
      "task_visibility": "customer" | "internal" | "partner"
      "tax_treatment_status": "pending_review" | "inclusive" | "exclusive" | "not_applicable"
    }
    CompositeTypes: Record<string, never>
  }
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
