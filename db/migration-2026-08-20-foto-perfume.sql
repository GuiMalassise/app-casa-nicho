-- ============================================================================
-- Migração — 2026-08-20
-- Coluna de foto do perfume + bucket de Storage pra upload das imagens.
-- ============================================================================

alter table perfumes add column foto_url text;

insert into storage.buckets (id, name, public)
values ('perfumes', 'perfumes', true)
on conflict (id) do nothing;

create policy "empresa faz upload na própria pasta" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'perfumes'
        and (storage.foldername(name))[1] = (
            select empresa_id::text from usuarios where id = auth.uid()
        )
    );

create policy "empresa atualiza a própria pasta" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'perfumes'
        and (storage.foldername(name))[1] = (
            select empresa_id::text from usuarios where id = auth.uid()
        )
    )
    with check (
        bucket_id = 'perfumes'
        and (storage.foldername(name))[1] = (
            select empresa_id::text from usuarios where id = auth.uid()
        )
    );

create policy "empresa lê a própria pasta" on storage.objects
    for select to authenticated
    using (
        bucket_id = 'perfumes'
        and (storage.foldername(name))[1] = (
            select empresa_id::text from usuarios where id = auth.uid()
        )
    );
