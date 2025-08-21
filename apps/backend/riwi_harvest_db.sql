CREATE DATABASE IF NOT EXISTS riwi_harvest_db;
USE riwi_harvest_db;

CREATE TABLE `coders` (
	`id_coder` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`id_doc_type` INTEGER NOT NULL,
	`document` INTEGER NOT NULL UNIQUE,
	`name` VARCHAR(50) NOT NULL,
	`lastname` VARCHAR(50) NOT NULL,
	`email` VARCHAR(100) NOT NULL UNIQUE,
	`id_clan` INTEGER,
	`gender` ENUM('male', 'female', 'other') NOT NULL,
	`status` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY(`id_coder`)
);


CREATE TABLE `documents_types` (
	`id_doc_type` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`type` VARCHAR(30) NOT NULL,
	`status` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY(`id_doc_type`)
);


CREATE TABLE `grades` (
	`id_grades` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`grade` DECIMAL(5,2) CHECK(grade BETWEEN 0 AND 100),
	`fedback` TEXT(8000),
	`id_coder` INTEGER NOT NULL,
	`id_module` INTEGER NOT NULL,
	PRIMARY KEY(`id_grades`)
);


CREATE TABLE `clan` (
	`id_clan` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` VARCHAR(50) NOT NULL,
	`status` BOOLEAN NOT NULL DEFAULT 1,
	`branch` ENUM() NOT NULL,
	`shift` ENUM('AM', 'PM') NOT NULL,
	PRIMARY KEY(`id_clan`)
);


CREATE TABLE `modules` (
	`id_module` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` VARCHAR(200) NOT NULL,
	`id_course` INTEGER NOT NULL,
	PRIMARY KEY(`id_module`)
);


CREATE TABLE `courses` (
	`id_course` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`name` VARCHAR(255) NOT NULL,
	`status` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY(`id_course`)
);


CREATE TABLE `attendances_status` (
	`id_attendace_status` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`status` VARCHAR(20) NOT NULL,
	PRIMARY KEY(`id_attendace_status`)
);


CREATE TABLE `attendances` (
	`id_attendance` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`id_coder` INTEGER NOT NULL,
	`id_module` INTEGER NOT NULL,
	`id_attendance_status` INTEGER NOT NULL,
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
ALTER TABLE `coders`
ADD FOREIGN KEY(`id_doc_type`) REFERENCES `documents_types`(`id_doc_type`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `attendances`
ADD FOREIGN KEY(`id_module`) REFERENCES `modules`(`id_module`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `attendances`
ADD FOREIGN KEY(`id_attendance_status`) REFERENCES `attendances_status`(`id_attendace_status`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `attendances`
ADD FOREIGN KEY(`id_coder`) REFERENCES `coders`(`id_coder`)
ON UPDATE CASCADE ON DELETE CASCADE;