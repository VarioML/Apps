
drop table if exists test_a;
drop table if exists test_b;
drop table if exists test_c;

create  table test_a ( 
	id integer primary key,
	name varchar(20)
);

create  table test_b ( 
	id integer primary key,
	name varchar(20)
);

create  table test_c ( 
	id integer primary key,
	name varchar(20)
);

insert into test_a(id,name) values (1,'a' ),(2,'b');
commit;

