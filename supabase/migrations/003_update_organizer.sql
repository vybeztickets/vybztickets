update public.events
set organizer_id = '928d27dc-43a6-4298-a1cc-9d4fd4f33572'
where organizer_id = '0c027a85-59a3-4602-b6c6-12f6c0a0d933';

insert into public.profiles (id, full_name, email, role)
values ('928d27dc-43a6-4298-a1cc-9d4fd4f33572', 'Nicola Ramirez', 'nicozecchinato1@gmail.com', 'organizer')
on conflict (id) do update set role = 'organizer';
