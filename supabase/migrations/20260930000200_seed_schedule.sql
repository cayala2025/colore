-- Seed the weekly schedule (CLAUDE.md). Admin can edit it later.
-- Mon closed; Tue–Wed: 11–13, 16–18, 18–20; Thu–Sun: those plus 20–22. 30 seats each.
insert into public.schedule_slots (weekday, start_time, end_time, capacity)
select d.weekday, t.start_time, t.end_time, 30
from (values (2), (3), (4), (5), (6), (7)) as d(weekday)
cross join (values
  ('11:00'::time, '13:00'::time),
  ('16:00'::time, '18:00'::time),
  ('18:00'::time, '20:00'::time),
  ('20:00'::time, '22:00'::time)
) as t(start_time, end_time)
where not (d.weekday in (2, 3) and t.start_time = '20:00')
on conflict (weekday, start_time) do nothing;
