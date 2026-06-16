-- GifHub.App – Schema V6 Migration (GIF Metadata for high-value content)
-- Run this in the Supabase SQL Editor AFTER schema-v5-blog-posts.sql

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'gifs' and column_name = 'usage_scenario'
  ) then
    alter table public.gifs add column usage_scenario text;
    alter table public.gifs add column professionalism_score int;
    alter table public.gifs add column suggested_caption text;
  end if;
end $$;
