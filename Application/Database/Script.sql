DROP DATABASE IF EXISTS plantdata;

CREATE DATABASE plantdata;

\c plantdata

GRANT ALL PRIVILEGES ON DATABASE plantdata TO postgres;

SET client_encoding = 'UTF8';

-- -----------------------------------------------------
-- Table data
-- -----------------------------------------------------

DROP TABLE IF EXISTS data CASCADE;

CREATE TABLE IF NOT EXISTS data (
  id                SERIAL NOT NULL,
  air_temperature   VARCHAR(70) ,
  air_humidity      VARCHAR(70) ,
  tank_water_level  VARCHAR(50) ,
  soil_moisture     VARCHAR(70) ,
  save_time TIMESTAMP DEFAULT current_timestamp ,
  PRIMARY KEY (id)
);

\dt
\df
