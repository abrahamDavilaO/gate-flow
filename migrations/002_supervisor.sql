alter table appointments add column if not exists supervisor text;

create index if not exists appointments_departed_idx on appointments (departed_at);
