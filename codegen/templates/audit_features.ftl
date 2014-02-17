-- create necessary audit columns and table for ${table.name()}
--  (we could e.g. do this only for special auditable tables (and columns),
--   which could be defined separately)
--
-- audit columns:  
alter table ${table.name()}
  add column created timestamp not null default current_timestamp;

alter table ${table.name()}
  add column created_by varchar(20) not null default current_user ;

-- create audit table:
drop table if exists ${table.name()}_audit;
create table ${table.name()}_audit as select * from ${table.name()} where 1=2;

alter table ${table.name()}_audit
  add column audit_oper char(1) not null  ;

alter table ${table.name()}_audit
  add column modified timestamp not null ;

alter table ${table.name()}_audit
  add column modified_by varchar(20) not null  ;

-- create audit trigger
--   note you may need to change delimiter char in some pl/sql editors etc. 
--   (the "unterminated dollar-quoted string error")
--
create or replace function ${table.name()}_log() returns trigger as $BODY$
  begin
    if (tg_op = 'DELETE') then
      insert into ${table.name()}_audit select  OLD.*, 'D', now(), user ;
      return old;
    elsif (tg_op = 'UPDATE') then
      if ( old.id != new.id) then
         raise exception 'Cannot update primary key';
      end if;
      insert into ${table.name()}_audit select  OLD.*, 'U', now(), user ;
      return new;    
    end if;
    return null;
  end;
$BODY$ LANGUAGE plpgsql;

create trigger ${table.name()}_audit_u after update
on ${table.name()} 
for each row 
when (old.* is distinct from new.*)
execute procedure ${table.name()}_log();

create trigger ${table.name()}_audit_d after delete
on ${table.name()} 
for each row 
execute procedure ${table.name()}_log();
