CREATE DATABASE IF NOT EXISTS riwi_harvest_db;
USE riwi_harvest_db;

CREATE TABLE `coders` (
	`id_coder` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`full_name` VARCHAR(100) NOT NULL,
	`name` VARCHAR(50) NOT NULL,
	`lastname` VARCHAR(50) NOT NULL,
	`email` VARCHAR(100) NOT NULL UNIQUE,
	`doc_type` ENUM('CC', 'TI', 'CE', 'PA', 'PPT', 'RC'),
	`document` VARCHAR(20) NOT NULL UNIQUE,
	`cel_number` VARCHAR(40),
	`gender` ENUM('male', 'female', 'other'),
	`id_clan` INTEGER,
	`status` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY(`id_coder`)
);


CREATE TABLE `grades` (
	`id_grades` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`grade` DECIMAL(5,2) CHECK(grade BETWEEN 0 AND 100),
	`fedback` TEXT(8000),
	`id_coder` INTEGER NOT NULL,
	`id_module` INTEGER NOT NULL,
	`grade_type` ENUM('Module assessment', 'Training', 'Review'),
	PRIMARY KEY(`id_grades`)
);


CREATE TABLE `clan` (
	`id_clan` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`clan_name` VARCHAR(50) NOT NULL,
	`branch` ENUM('Medellin', 'Barranquilla') NOT NULL,
	`shift` ENUM('am', 'pm') NOT NULL,
	`id_cohort` INTEGER NOT NULL,
	`status` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY(`id_clan`)
);


CREATE TABLE `cohorts` (
	`id_cohort` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`number` INTEGER NOT NULL,
	`start_date` DATE NOT NULL,
	`state` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY(`id_cohort`)
);


CREATE TABLE `modules` (
	`id_module` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`module_name` VARCHAR(200) NOT NULL,
	`id_course` INTEGER NOT NULL,
	PRIMARY KEY(`id_module`)
);


CREATE TABLE `courses` (
	`id_course` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`courses_name` VARCHAR(255) NOT NULL,
	`status` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY(`id_course`)
);


CREATE TABLE `attendances` (
	`id_attendance` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`id_coder` INTEGER NOT NULL,
	`id_module` INTEGER NOT NULL,
	`attendance_status` ENUM('P', 'R', 'FI', 'FJ') NOT NULL,
	`attendace_counter` INTEGER NOT NULL DEFAULT 1,
	`observation` VARCHAR(120) NOT NULL,
	PRIMARY KEY(`id_attendance`)
);


ALTER TABLE `coders`
ADD FOREIGN KEY(`id_clan`) REFERENCES `clan`(`id_clan`)
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE `modules`
ADD FOREIGN KEY(`id_course`) REFERENCES `courses`(`id_course`)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE `grades`
ADD FOREIGN KEY(`id_coder`) REFERENCES `coders`(`id_coder`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `grades`
ADD FOREIGN KEY(`id_module`) REFERENCES `modules`(`id_module`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `attendances`
ADD FOREIGN KEY(`id_module`) REFERENCES `modules`(`id_module`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `attendances`
ADD FOREIGN KEY(`id_coder`) REFERENCES `coders`(`id_coder`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `clan`
ADD FOREIGN KEY(`id_cohort`) REFERENCES `cohorts`(`id_cohort`)
ON UPDATE NO ACTION ON DELETE NO ACTION;

