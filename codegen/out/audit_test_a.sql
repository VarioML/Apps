-- create necessary audit columns and table for test_a
--  (we could e.g. do this only for special auditable tables (and columns),
--   which could be defined separately)
--
-- audit columns:  
alter table test_a
  add column created timestamp not null default current_timestamp;

alter table test_a
  add column created_by varchar(20) not null default current_user ;

-- create audit table:
drop table if exists test_a_audit;
create table test_a_audit as select * from test_a where 1=2;

alter table test_a_audit
  add column audit_oper char(1) not null  ;

alter table test_a_audit
  add column modified timestamp not null ;

alter table test_a_audit
  add column modified_by varchar(20) not null  ;

-- create audit trigger
--   note you may need to change delimiter char in some pl/sql editors etc. 
--   (the "unterminated dollar-quoted string error")
--
create or replace function test_a_log() returns trigger as $BODY$
  begin
    if (tg_op = 'DELETE') then
      insert into test_a_audit select  OLD.*, 'D', now(), user ;
      return old;
    elsif (tg_op = 'UPDATE') then
      if ( old.id != new.id) then
         raise exception 'Cannot update primary key';
      end if;
      insert into test_a_audit select  OLD.*, 'U', now(), user ;
      return new;    
    end if;
    return null;
  end;
$BODY$ LANGUAGE plpgsql;

create trigger test_a_audit_u after update
on test_a 
for each row 
when (old.* is distinct from new.*)
execute procedure test_a_log();

create trigger test_a_audit_d after delete
on test_a 
for each row 
execute procedure test_a_log();
