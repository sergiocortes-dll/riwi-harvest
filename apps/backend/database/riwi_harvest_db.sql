CREATE DATABASE IF NOT EXISTS riwi_harvest_db;
USE riwi_harvest_db;


CREATE TABLE `coders` (
	`id_coder` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`user_full_name` VARCHAR(100),
	`user_name` VARCHAR(50) NOT NULL,
	`user_lastname` VARCHAR(50) NOT NULL,
	`user_number_id` VARCHAR(20) NOT NULL UNIQUE,
	`user_doc_type` ENUM('CC', 'TI', 'CE', 'PA', 'PPT', 'RC'),
	`user_email` VARCHAR(100) NOT NULL UNIQUE,
	`user_phone` VARCHAR(40) NOT NULL,
	`user_gender` ENUM('male', 'female', 'other') NOT NULL,
	`inscription_status` ENUM('Activo', 'Suspendido') NOT NULL,
	`user_city` VARCHAR(100) NOT NULL,
	`inscription_date_begin` DATETIME NOT NULL,
	`inscription_date_end` DATETIME,
	`id_clan` INTEGER,
	`id_roles` INTEGER NOT NULL,
	PRIMARY KEY(`id_coder`)
);


CREATE TABLE `roles` (
	`id_roles` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`rol_name` VARCHAR(100) NOT NULL,
	`rol_original_name` VARCHAR(50) NOT NULL,
	`role_short_name` VARCHAR(50) NOT NULL,
	PRIMARY KEY(`id_roles`)
);


CREATE TABLE `grades` (
	`id_grades` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`grade` DECIMAL(5,2) CHECK(grade BETWEEN 0 AND 100),
	`fedback` TEXT(65535),
	`id_coder` INTEGER NOT NULL,
	`grade_type` ENUM('Module assessment', 'Training', 'Review'),
	`id_task` INTEGER NOT NULL,
	PRIMARY KEY(`id_grades`)
);


CREATE TABLE `tasks` (
	`id_task` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`id_module` INTEGER NOT NULL,
	`task_name` VARCHAR(255) NOT NULL,
	`task_description` TEXT(65535),
	PRIMARY KEY(`id_task`)
);


CREATE TABLE `clan` (
	`id_clan` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`group_created_at` DATETIME NOT NULL,
	`group_name` VARCHAR(50) NOT NULL,
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
	`institution` ENUM('Barranquilla', 'Medellin') NOT NULL,
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
	`couse_full_name_link` VARCHAR(255) NOT NULL,
	`course_short_name` VARCHAR(100) NOT NULL,
	`id_course_category` INTEGER NOT NULL,
	`course_created_at` DATETIME NOT NULL,
	`course_date_begin` DATETIME NOT NULL,
	`course_date_end` DATETIME,
	`status` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY(`id_course`)
);


CREATE TABLE `courses_categories` (
	`id_course_category` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`course_category_name` VARCHAR(255) NOT NULL,
	`course_category_name_id` INTEGER NOT NULL,
	PRIMARY KEY(`id_course_category`)
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


CREATE TABLE `progress` (
	`id_progress` INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
	`id_coder` INTEGER NOT NULL,
	`id_couse` INTEGER NOT NULL,
	`student_progress` DECIMAL(5,2) NOT NULL,
	`student_grade` DECIMAL(5,2) NOT NULL,
	PRIMARY KEY(`id_progress`)
);


ALTER TABLE `coders`
ADD FOREIGN KEY(`id_clan`) REFERENCES `clan`(`id_clan`)
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE `modules`
ADD FOREIGN KEY(`id_course`) REFERENCES `courses`(`id_course`)
ON UPDATE CASCADE ON DELETE NO ACTION;
ALTER TABLE `grades`
ADD FOREIGN KEY(`id_coder`) REFERENCES `coders`(`id_coder`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `attendances`
ADD FOREIGN KEY(`id_module`) REFERENCES `modules`(`id_module`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `clan`
ADD FOREIGN KEY(`id_cohort`) REFERENCES `cohorts`(`id_cohort`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `grades`
ADD FOREIGN KEY(`id_task`) REFERENCES `tasks`(`id_task`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `attendances`
ADD FOREIGN KEY(`id_coder`) REFERENCES `coders`(`id_coder`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `tasks`
ADD FOREIGN KEY(`id_module`) REFERENCES `modules`(`id_module`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `courses`
ADD FOREIGN KEY(`id_course_category`) REFERENCES `courses_categories`(`id_course_category`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `progress`
ADD FOREIGN KEY(`id_coder`) REFERENCES `coders`(`id_coder`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `progress`
ADD FOREIGN KEY(`id_couse`) REFERENCES `courses`(`id_course`)
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `coders`
ADD FOREIGN KEY(`id_roles`) REFERENCES `roles`(`id_roles`)
ON UPDATE CASCADE ON DELETE SET NULL;