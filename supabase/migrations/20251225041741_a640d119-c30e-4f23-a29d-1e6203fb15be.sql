-- Change default user access permissions to false (disabled by default)
ALTER TABLE public.user_access
  ALTER COLUMN can_book_appointments SET DEFAULT false,
  ALTER COLUMN can_apply_coupons SET DEFAULT false,
  ALTER COLUMN can_use_chatbot SET DEFAULT false,
  ALTER COLUMN can_view_services SET DEFAULT false,
  ALTER COLUMN can_contact_support SET DEFAULT false;