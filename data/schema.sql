DROP table IF EXISTS favourite;

CREATE TABLE favourite(
id serial primary key not Null,
title varchar(256) not null,
description text not null,
author varchar(256) not null,
isbn varchar(256) not null,
image_url varchar(256) not null
);
