create table if not exists docks (
  id text primary key,
  label text not null,
  kind text not null,
  bay_order integer not null,
  status text not null default 'libre'
);

create table if not exists appointments (
  id text primary key,
  token text not null unique,
  carrier text not null,
  plate text not null,
  trailer_plate text,
  driver_name text not null,
  driver_license text not null,
  phone text,
  operation text not null,
  reference_code text,
  cargo text,
  scheduled_at timestamptz not null,
  docs_license boolean not null default false,
  docs_circulation boolean not null default false,
  docs_insurance boolean not null default false,
  docs_carta_porte boolean not null default false,
  status text not null,
  dock_id text references docks(id),
  created_at timestamptz not null default now(),
  arrived_at timestamptz,
  load_started_at timestamptz,
  departed_at timestamptz,
  rejected_reason text
);

create index if not exists appointments_plate_idx on appointments (plate);
create index if not exists appointments_status_idx on appointments (status);
create index if not exists appointments_token_idx on appointments (token);
create index if not exists appointments_scheduled_idx on appointments (scheduled_at);

create table if not exists yard_events (
  id text primary key,
  appointment_id text not null references appointments(id),
  kind text not null,
  at timestamptz not null default now(),
  detail text
);

create index if not exists yard_events_appointment_idx on yard_events (appointment_id, at);

create table if not exists app_meta (
  key text primary key,
  value text not null
);
