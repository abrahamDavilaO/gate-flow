alter table appointments add column if not exists delay_category text;
alter table appointments add column if not exists delay_notes text;
alter table appointments add column if not exists delay_recorded_at timestamptz;