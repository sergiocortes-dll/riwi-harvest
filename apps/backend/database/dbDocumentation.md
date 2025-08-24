# 📚 Documentación Base de Datos `riwi_harvest_db`

## 1. Geral Description

The riwi_harvest_db database was designed to manage information related to students (coders), their academic performance (grades), their attendance (attendances), and institutional organization through clans, cohorts, courses, and modules.

The main objective is to centralize and structure academic information, ensuring data integrity, traceability, and scalability. In addition, it facilitates the organized visualization of information, contributing to better decision-making.

## 2. Entity-Relationship Model

![alt text](New-ER-1.jpeg)

## 3. Table Relationships (Summary)

- cohorts 1 ────< clan (A cohort includes several clans).

- clan 1 ────< coders (A clan contains multiple students).

- courses 1 ────< modules (A course consists of several modules).

- modules 1 ────< grades (Each module can generate multiple grades).

- modules 1 ────< attendances (Each module records attendance).

- coders 1 ────< grades (A student can have multiple grades).

- coders 1 ────< attendances (A student can have multiple attendance records).

## 4. Technical Notes

- ENUM data types are used to restrict values and avoid inconsistencies.

- Foreign keys with CASCADE actions are defined to ensure referential integrity.

- UNIQUE constraints are applied to fields such as email and document to prevent duplicates.

- The status column in several tables acts as a logical control (active/inactive), instead of deleting records.

- The structure is designed for easy scalability, allowing new courses, modules, clans, or cohorts to be added without affecting the core logic.