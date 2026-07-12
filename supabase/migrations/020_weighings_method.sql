-- Método de pesaje: báscula o cinta bovinométrica
alter table weighings
  add column if not exists method text check (method in ('bascula', 'cinta'));
