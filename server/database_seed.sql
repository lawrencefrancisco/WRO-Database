-- ============================================================
-- WRO Philippines DBMS – Demo Data Seed  (v2 – surrogate keys)
-- All id columns are AUTO_INCREMENT; business codes live in the
-- *_code columns. FK values are resolved by sub-SELECT on the
-- parent's business code so the order of insertion does not
-- matter and no hard-coded integer IDs are needed.
-- Run AFTER database.sql:
--   mysql -u root wro_philippines < server/database_seed.sql
-- ============================================================

USE wro_philippines;

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Seasons ─────────────────────────────────────────────────
INSERT INTO seasons (season_code, name, year, is_active) VALUES
('WRO_2022', 'WRO 2022', 2022, 1),
('WRO_2023', 'WRO 2023', 2023, 1),
('WRO_2024', 'WRO 2024', 2024, 1),
('WRO_2025', 'WRO 2025', 2025, 1);

-- ── 2. Default Users ──────────────────────────────────────────
INSERT INTO users (user_code, username, password_hash, name, role, email, is_active) VALUES
('USER_SUPERADMIN', 'admin',      'admin123',      'Lawrence Francisco', 'SUPER_ADMIN',  'admin@wrophilippines.org',    1),
('USER_EVENTADMIN', 'eventadmin', 'event123',      'Maria Santos',       'EVENT_ADMIN',  'event@wrophilippines.org',    1),
('USER_JUDGE1',     'judge1',     'judge123',      'Dr. Jose Reyes',     'JUDGE',        'judge1@wrophilippines.org',   1),
('USER_COACH1',     'coach1',     'coach123',      'Carlos Mendoza',     'COACH',        'coach1@gmail.com',            1),
('USER_VOLUNTEER1', 'volunteer1', 'volunteer123',  'Ana Garcia',         'VOLUNTEER',    'volunteer1@gmail.com',        1);

-- ── 3. Schools (30 schools across 5 regions) ──────────────────
INSERT INTO schools (school_code, school_name, school_type, school_level, deped_id, region, province, city, address, contact_number, email, school_head, robotics_coordinator, years_joined, status) VALUES
('SCH_001','Philippine Science High School','Private','Senior High School','DEP234501','NCR – National Capital Region','Metro Manila','Makati','123 Rizal Ave, Makati','02-5523-7891','office@philippinesciencehighschool.edu.ph','Maria Santos','Jose Reyes',2018,'active'),
('SCH_002','Ateneo de Manila University','Sectarian','College','DEP567802','NCR – National Capital Region','Metro Manila','Taguig','456 Mabini St, Taguig','02-4412-3344','office@ateneodemanilauni.edu.ph','Juan Cruz','Ana Bautista',2019,'active'),
('SCH_003','De La Salle University','Sectarian','College','DEP345603','NCR – National Capital Region','Metro Manila','Pasig','789 Quezon Blvd, Pasig','02-3321-5566','office@delasalleuni.edu.ph','Carlos Garcia','Rosa Mendoza',2020,'active'),
('SCH_004','University of Santo Tomas','Sectarian','College','DEP789004','NCR – National Capital Region','Metro Manila','Quezon City','101 JP Laurel St, Quezon City','02-7723-9988','office@universityofsantotomas.edu.ph','Eduardo Torres','Liza Aquino',2021,'active'),
('SCH_005','Far Eastern University','Private','College','DEP234505','NCR – National Capital Region','Metro Manila','Manila','202 Roxas Blvd, Manila','02-5589-1122','office@fareasternuni.edu.ph','Roberto Ramos','Gloria Dela Cruz',2018,'active'),
('SCH_006','Mapua University','Private','College','DEP678906','NCR – National Capital Region','Metro Manila','Mandaluyong','303 Rizal Ave, Mandaluyong','02-3312-4455','office@mapuauni.edu.ph','Miguel Villanueva','Cynthia Fernandez',2019,'active'),
('SCH_007','Adamson University','Sectarian','College','DEP456707','NCR – National Capital Region','Metro Manila','Marikina','404 Mabini St, Marikina','02-8834-6677','office@adamsonuni.edu.ph','Ramon Gonzales','Patricia Castro',2020,'active'),
('SCH_008','Technological Institute of the Philippines','Private','College','DEP123408','NCR – National Capital Region','Metro Manila','Muntinlupa','505 Quezon Blvd, Muntinlupa','02-7756-8899','office@technologicalinstituteofthephilippines.edu.ph','Antonio Flores','Marisol Diaz',2021,'active'),
('SCH_009','Jose Rizal University','Private','College','DEP890109','NCR – National Capital Region','Metro Manila','Las Piñas','606 JP Laurel St, Las Piñas','02-4478-2233','office@joserizaluni.edu.ph','Fernando Morales','Cristina Aguilar',2018,'active'),
('SCH_010','Centro Escolar University','Private','College','DEP345610','NCR – National Capital Region','Metro Manila','Parañaque','707 Roxas Blvd, Parañaque','02-6690-3344','office@centroescolaruni.edu.ph','Rodrigo Pascual','Rowena Santos',2019,'active'),
('SCH_011','Saint Jude Catholic School','Sectarian','High School','DEP234511','Region IV-A – CALABARZON','Laguna','Santa Rosa','123 Rizal Ave, Santa Rosa','049-5523-7891','office@saintjudecatholicschool.edu.ph','Maria Reyes','Jose Cruz',2020,'active'),
('SCH_012','Don Bosco Technical College','Sectarian','Senior High School','DEP567812','Region IV-A – CALABARZON','Laguna','Biñan','456 Mabini St, Biñan','049-4412-3344','office@donboscotechnicalcollege.edu.ph','Juan Bautista','Ana Garcia',2021,'active'),
('SCH_013','Holy Cross of Davao College','Sectarian','College','DEP345613','Region IV-A – CALABARZON','Laguna','San Pedro','789 Quezon Blvd, San Pedro','049-3321-5566','office@holycrossofdavaocollege.edu.ph','Carlos Mendoza','Rosa Torres',2018,'active'),
('SCH_014','University of San Carlos','Sectarian','College','DEP789014','Region IV-A – CALABARZON','Laguna','Calamba','101 JP Laurel St, Calamba','049-7723-9988','office@universityofsancarlos.edu.ph','Eduardo Aquino','Liza Ramos',2019,'active'),
('SCH_015','Cebu Institute of Technology','Private','College','DEP234515','Region IV-A – CALABARZON','Laguna','Los Baños','202 Roxas Blvd, Los Baños','049-5589-1122','office@cebuinstituteoftechnology.edu.ph','Roberto Dela Cruz','Gloria Villanueva',2020,'active'),
('SCH_016','Xavier University','Sectarian','College','DEP678916','Region IV-A – CALABARZON','Cavite','Cavite City','303 Rizal Ave, Cavite City','046-3312-4455','office@xavieruni.edu.ph','Miguel Fernandez','Cynthia Gonzales',2021,'active'),
('SCH_017','Mindanao State University','Public','College','DEP456717','Region VII – Central Visayas','Cebu','Cebu City','404 Mabini St, Cebu City','032-8834-6677','office@mindanaostateu.edu.ph','Ramon Castro','Patricia Flores',2018,'active'),
('SCH_018','Western Mindanao State University','Public','College','DEP123418','Region VII – Central Visayas','Cebu','Mandaue','505 Quezon Blvd, Mandaue','032-7756-8899','office@westernmindanaostateu.edu.ph','Antonio Diaz','Marisol Morales',2019,'active'),
('SCH_019','Laguna College of Business and Arts','Private','College','DEP890119','Region VII – Central Visayas','Cebu','Lapu-Lapu','606 JP Laurel St, Lapu-Lapu','032-4478-2233','office@lagunacollege.edu.ph','Fernando Aguilar','Cristina Pascual',2020,'active'),
('SCH_020','Lipa City Colleges','Private','College','DEP345620','Region VII – Central Visayas','Cebu','Talisay','707 Roxas Blvd, Talisay','032-6690-3344','office@lipacitycollege.edu.ph','Rodrigo Santos','Rowena Reyes',2021,'active'),
('SCH_021','STI College','Private','College','DEP234521','Region VII – Central Visayas','Cebu','Danao','808 Rizal Ave, Danao','032-5523-7892','office@sticollege.edu.ph','Maria Cruz','Jose Bautista',2018,'active'),
('SCH_022','AMA Computer College','Private','College','DEP567822','Region XI – Davao Region','Davao del Sur','Davao City','456 Mabini St, Davao City','082-4412-3345','office@amacomputercollege.edu.ph','Juan Garcia','Ana Mendoza',2019,'active'),
('SCH_023','National University','Private','College','DEP345623','Region XI – Davao Region','Davao del Sur','Davao City','789 Quezon Blvd, Davao City','082-3321-5567','office@nationaluni.edu.ph','Carlos Torres','Rosa Aquino',2020,'active'),
('SCH_024','San Beda University','Sectarian','College','DEP789024','Region XI – Davao Region','Davao del Sur','Digos','101 JP Laurel St, Digos','082-7723-9989','office@sanbeadauni.edu.ph','Eduardo Ramos','Liza Dela Cruz',2021,'active'),
('SCH_025','Letran College','Sectarian','College','DEP234525','Region XI – Davao Region','Davao del Norte','Tagum','202 Roxas Blvd, Tagum','084-5589-1123','office@letrancollege.edu.ph','Roberto Villanueva','Gloria Fernandez',2018,'active'),
('SCH_026','Assumption College','Sectarian','College','DEP678926','Region III – Central Luzon','Bulacan','Malolos','303 Rizal Ave, Malolos','044-3312-4456','office@assumptioncollege.edu.ph','Miguel Gonzales','Cynthia Castro',2019,'active'),
('SCH_027','Miriam College','Private','College','DEP456727','Region III – Central Luzon','Bulacan','Meycauayan','404 Mabini St, Meycauayan','044-8834-6678','office@miriamcollege.edu.ph','Ramon Flores','Patricia Diaz',2020,'active'),
('SCH_028','Holy Spirit of Manila','Sectarian','High School','DEP123428','Region III – Central Luzon','Bulacan','San Jose del Monte','505 Quezon Blvd, San Jose del Monte','044-7756-8900','office@holyspiritofmanila.edu.ph','Antonio Morales','Marisol Aguilar',2021,'active'),
('SCH_029','La Salle Green Hills','Sectarian','High School','DEP890129','Region III – Central Luzon','Pampanga','San Fernando','606 JP Laurel St, San Fernando','045-4478-2234','office@lasallegreenhills.edu.ph','Fernando Pascual','Cristina Santos',2018,'active'),
('SCH_030','Colegio de San Juan de Letran','Sectarian','College','DEP345630','Region III – Central Luzon','Pampanga','Angeles','707 Roxas Blvd, Angeles','045-6690-3345','office@colegiodesanjuandeletran.edu.ph','Rodrigo Reyes','Rowena Cruz',2019,'active');

-- ── 4. Coaches (school_id resolved by sub-SELECT on school_code)
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_001','Maria Santos','1982-03-15','Female','maria.santos@gmail.com','09181234567',id,'Robotics Teacher','M','Jose Santos - 09181234568','WRO Certified Coach',5,'Champion 2023','active' FROM schools WHERE school_code='SCH_001';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_002','Juan Reyes','1979-07-22','Male','juan.reyes@gmail.com','09271234567',id,'ICT Coordinator','L','Maria Reyes - 09271234568','LEGO Education Certified',4,'None','active' FROM schools WHERE school_code='SCH_002';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_003','Jose Cruz','1985-11-08','Male','jose.cruz@gmail.com','09361234567',id,'STEM Coordinator','M','Ana Cruz - 09361234568','Robotics Instructor Level 1',3,'Best Coach 2022','active' FROM schools WHERE school_code='SCH_003';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_004','Ana Bautista','1980-05-30','Female','ana.bautista@gmail.com','09451234567',id,'Science Teacher','S','Carlos Bautista - 09451234568','None',6,'None','active' FROM schools WHERE school_code='SCH_004';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_005','Carlos Garcia','1983-09-14','Male','carlos.garcia@gmail.com','09541234567',id,'Math Teacher','XL','Rosa Garcia - 09541234568','WRO Certified Coach',7,'Best Coach 2024','active' FROM schools WHERE school_code='SCH_005';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_006','Rosa Mendoza','1977-01-25','Female','rosa.mendoza@gmail.com','09631234567',id,'Robotics Teacher','M','Eduardo Mendoza - 09631234568','LEGO Education Certified',8,'Champion 2023','active' FROM schools WHERE school_code='SCH_006';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_007','Eduardo Torres','1986-06-18','Male','eduardo.torres@gmail.com','09721234567',id,'ICT Coordinator','L','Liza Torres - 09721234568','None',2,'None','active' FROM schools WHERE school_code='SCH_007';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_008','Liza Aquino','1981-12-03','Female','liza.aquino@gmail.com','09811234567',id,'STEM Coordinator','S','Roberto Aquino - 09811234568','WRO Certified Coach',4,'None','active' FROM schools WHERE school_code='SCH_008';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_009','Roberto Ramos','1978-04-27','Male','roberto.ramos@gmail.com','09901234567',id,'Science Teacher','XL','Gloria Ramos - 09901234568','Robotics Instructor Level 1',6,'Best Coach 2022','active' FROM schools WHERE school_code='SCH_009';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_010','Gloria Dela Cruz','1984-08-11','Female','gloria.delacruz@gmail.com','09121234567',id,'Robotics Teacher','M','Miguel Dela Cruz - 09121234568','None',3,'None','active' FROM schools WHERE school_code='SCH_010';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_011','Miguel Villanueva','1980-02-19','Male','miguel.villanueva@gmail.com','09221234567',id,'Math Teacher','L','Cynthia Villanueva - 09221234568','LEGO Education Certified',5,'Champion 2023','active' FROM schools WHERE school_code='SCH_011';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_012','Cynthia Fernandez','1987-10-07','Female','cynthia.fernandez@gmail.com','09321234567',id,'ICT Coordinator','S','Ramon Fernandez - 09321234568','None',1,'None','active' FROM schools WHERE school_code='SCH_012';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_013','Ramon Gonzales','1976-06-23','Male','ramon.gonzales@gmail.com','09421234567',id,'STEM Coordinator','XL','Patricia Gonzales - 09421234568','WRO Certified Coach',7,'Best Coach 2024','active' FROM schools WHERE school_code='SCH_013';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_014','Patricia Castro','1983-12-14','Female','patricia.castro@gmail.com','09521234567',id,'Science Teacher','M','Antonio Castro - 09521234568','Robotics Instructor Level 1',4,'None','active' FROM schools WHERE school_code='SCH_014';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_015','Antonio Flores','1979-04-01','Male','antonio.flores@gmail.com','09621234567',id,'Robotics Teacher','L','Marisol Flores - 09621234568','None',6,'Best Coach 2022','active' FROM schools WHERE school_code='SCH_015';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_016','Marisol Diaz','1985-09-28','Female','marisol.diaz@gmail.com','09721234568',id,'Math Teacher','S','Fernando Diaz - 09721234569','LEGO Education Certified',3,'None','active' FROM schools WHERE school_code='SCH_016';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_017','Fernando Morales','1982-01-16','Male','fernando.morales@gmail.com','09821234567',id,'ICT Coordinator','XL','Cristina Morales - 09821234568','None',5,'Champion 2023','active' FROM schools WHERE school_code='SCH_017';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_018','Cristina Aguilar','1977-07-09','Female','cristina.aguilar@gmail.com','09921234567',id,'STEM Coordinator','M','Rodrigo Aguilar - 09921234568','WRO Certified Coach',8,'None','active' FROM schools WHERE school_code='SCH_018';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_019','Rodrigo Pascual','1984-03-25','Male','rodrigo.pascual@gmail.com','09131234567',id,'Science Teacher','L','Rowena Pascual - 09131234568','Robotics Instructor Level 1',2,'Best Coach 2024','active' FROM schools WHERE school_code='SCH_019';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_020','Rowena Santos','1980-11-12','Female','rowena.santos@gmail.com','09231234567',id,'Robotics Teacher','S','Maria Santos - 09231234568','None',4,'None','active' FROM schools WHERE school_code='SCH_020';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_021','Maria Reyes','1986-05-30','Female','maria.reyes@gmail.com','09331234567',id,'Math Teacher','M','Juan Reyes - 09331234568','LEGO Education Certified',6,'None','active' FROM schools WHERE school_code='SCH_021';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_022','Juan Cruz','1978-08-17','Male','juan.cruz@gmail.com','09431234567',id,'ICT Coordinator','XL','Jose Cruz - 09431234568','WRO Certified Coach',7,'Champion 2023','active' FROM schools WHERE school_code='SCH_022';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_023','Jose Bautista','1983-02-04','Male','jose.bautista@gmail.com','09531234567',id,'STEM Coordinator','L','Ana Bautista - 09531234568','None',3,'None','active' FROM schools WHERE school_code='SCH_023';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_024','Ana Garcia','1981-10-21','Female','ana.garcia@gmail.com','09631234568',id,'Science Teacher','S','Carlos Garcia - 09631234569','Robotics Instructor Level 1',5,'Best Coach 2022','active' FROM schools WHERE school_code='SCH_024';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_025','Carlos Mendoza','1979-04-08','Male','carlos.mendoza@gmail.com','09731234567',id,'Robotics Teacher','M','Rosa Mendoza - 09731234568','None',4,'None','active' FROM schools WHERE school_code='SCH_025';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_026','Rosa Torres','1985-12-25','Female','rosa.torres@gmail.com','09831234567',id,'Math Teacher','L','Eduardo Torres - 09831234568','LEGO Education Certified',2,'None','active' FROM schools WHERE school_code='SCH_026';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_027','Eduardo Aquino','1976-06-12','Male','eduardo.aquino@gmail.com','09931234567',id,'ICT Coordinator','XL','Liza Aquino - 09931234568','WRO Certified Coach',8,'Best Coach 2024','active' FROM schools WHERE school_code='SCH_027';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_028','Liza Ramos','1982-02-28','Female','liza.ramos@gmail.com','09141234567',id,'STEM Coordinator','M','Roberto Ramos - 09141234568','None',6,'Champion 2023','active' FROM schools WHERE school_code='SCH_028';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_029','Roberto Dela Cruz','1980-09-15','Male','roberto.delacruz@gmail.com','09241234567',id,'Science Teacher','L','Gloria Dela Cruz - 09241234568','Robotics Instructor Level 1',4,'None','active' FROM schools WHERE school_code='SCH_029';
INSERT INTO coaches (coach_code, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status)
SELECT 'COA_030','Gloria Villanueva','1987-03-03','Female','gloria.villanueva@gmail.com','09341234567',id,'Robotics Teacher','S','Miguel Villanueva - 09341234568','None',1,'None','active' FROM schools WHERE school_code='SCH_030';

-- ── 5. Students (60 students) ──────────────────────────────────
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0001','Aiden Santos','2010-03-12',15,'Male','Grade 9',id,'Maria Santos','09181234000','parent.santos@gmail.com','None','None','M',2,1,'active' FROM schools WHERE school_code='SCH_001';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0002','Sofia Reyes','2011-07-25',14,'Female','Grade 8',id,'Juan Reyes','09271234000','parent.reyes@gmail.com','Asthma','None','S',1,1,'active' FROM schools WHERE school_code='SCH_001';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0003','Liam Cruz','2009-11-08',16,'Male','Grade 10',id,'Jose Cruz','09361234000','parent.cruz@gmail.com','None','Seafood','M',3,1,'active' FROM schools WHERE school_code='SCH_002';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0004','Emma Bautista','2012-05-30',13,'Female','Grade 7',id,'Ana Bautista','09451234000','parent.bautista@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_002';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0005','Noah Garcia','2010-09-14',15,'Male','Grade 9',id,'Carlos Garcia','09541234000','parent.garcia@gmail.com','None','Peanuts','M',2,1,'active' FROM schools WHERE school_code='SCH_003';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0006','Olivia Mendoza','2011-01-25',14,'Female','Grade 8',id,'Rosa Mendoza','09631234000','parent.mendoza@gmail.com','Allergic Rhinitis','None','S',1,1,'active' FROM schools WHERE school_code='SCH_003';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0007','Lucas Torres','2009-06-18',16,'Male','Grade 10',id,'Eduardo Torres','09721234000','parent.torres@gmail.com','None','None','L',4,1,'active' FROM schools WHERE school_code='SCH_004';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0008','Ava Aquino','2012-12-03',13,'Female','Grade 7',id,'Liza Aquino','09811234000','parent.aquino@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_004';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0009','Ethan Ramos','2010-04-27',15,'Male','Grade 9',id,'Roberto Ramos','09901234000','parent.ramos@gmail.com','Asthma','None','M',2,1,'active' FROM schools WHERE school_code='SCH_005';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0010','Isabella Dela Cruz','2011-08-11',14,'Female','Grade 8',id,'Gloria Dela Cruz','09121234000','parent.delacruz@gmail.com','None','None','S',1,1,'active' FROM schools WHERE school_code='SCH_005';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0011','Mason Villanueva','2009-02-19',16,'Male','Grade 10',id,'Miguel Villanueva','09221234000','parent.villanueva@gmail.com','None','Seafood','L',3,1,'active' FROM schools WHERE school_code='SCH_006';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0012','Mia Fernandez','2012-10-07',13,'Female','Grade 7',id,'Cynthia Fernandez','09321234000','parent.fernandez@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_006';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0013','Logan Gonzales','2010-06-23',15,'Male','Grade 9',id,'Ramon Gonzales','09421234000','parent.gonzales@gmail.com','None','None','M',2,1,'active' FROM schools WHERE school_code='SCH_007';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0014','Charlotte Castro','2011-12-14',14,'Female','Grade 8',id,'Patricia Castro','09521234000','parent.castro@gmail.com','Allergic Rhinitis','Peanuts','S',1,1,'active' FROM schools WHERE school_code='SCH_007';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0015','Oliver Flores','2009-04-01',16,'Male','Grade 10',id,'Antonio Flores','09621234000','parent.flores@gmail.com','None','None','M',4,1,'active' FROM schools WHERE school_code='SCH_008';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0016','Amelia Diaz','2012-09-28',13,'Female','Grade 7',id,'Marisol Diaz','09721234100','parent.diaz@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_008';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0017','Elijah Morales','2010-01-16',15,'Male','Grade 9',id,'Fernando Morales','09821234000','parent.morales@gmail.com','Asthma','None','M',2,1,'active' FROM schools WHERE school_code='SCH_009';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0018','Harper Aguilar','2011-07-09',14,'Female','Grade 8',id,'Cristina Aguilar','09921234000','parent.aguilar@gmail.com','None','None','S',1,1,'active' FROM schools WHERE school_code='SCH_009';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0019','James Pascual','2009-03-25',16,'Male','Grade 10',id,'Rodrigo Pascual','09131234000','parent.pascual@gmail.com','None','Seafood','L',3,1,'active' FROM schools WHERE school_code='SCH_010';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0020','Evelyn Santos','2012-11-12',13,'Female','Grade 7',id,'Rowena Santos','09231234000','parent.santos2@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_010';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0021','Mateo Reyes','2010-05-30',15,'Male','Grade 9',id,'Maria Reyes','09331234000','parent.reyes2@gmail.com','None','None','M',2,1,'active' FROM schools WHERE school_code='SCH_011';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0022','Aria Cruz','2011-08-17',14,'Female','Grade 8',id,'Juan Cruz','09431234000','parent.cruz2@gmail.com','None','None','S',1,1,'active' FROM schools WHERE school_code='SCH_011';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0023','Sebastian Bautista','2009-02-04',16,'Male','Grade 10',id,'Jose Bautista','09531234000','parent.bautista2@gmail.com','Allergic Rhinitis','None','M',4,1,'active' FROM schools WHERE school_code='SCH_012';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0024','Luna Garcia','2012-10-21',13,'Female','Grade 7',id,'Ana Garcia','09631234100','parent.garcia2@gmail.com','None','Peanuts','XS',0,1,'active' FROM schools WHERE school_code='SCH_012';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0025','Jack Mendoza','2010-04-08',15,'Male','Grade 9',id,'Carlos Mendoza','09731234000','parent.mendoza2@gmail.com','None','None','L',2,1,'active' FROM schools WHERE school_code='SCH_013';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0026','Chloe Torres','2011-12-25',14,'Female','Grade 8',id,'Rosa Torres','09831234000','parent.torres2@gmail.com','None','None','S',1,1,'active' FROM schools WHERE school_code='SCH_013';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0027','Aiden Aquino','2009-06-12',16,'Male','Grade 10',id,'Eduardo Aquino','09931234000','parent.aquino2@gmail.com','None','None','M',3,1,'active' FROM schools WHERE school_code='SCH_014';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0028','Sofia Ramos','2012-02-28',13,'Female','Grade 7',id,'Liza Ramos','09141234000','parent.ramos2@gmail.com','Asthma','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_014';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0029','Liam Dela Cruz','2010-09-15',15,'Male','Grade 9',id,'Roberto Dela Cruz','09241234000','parent.delacruz2@gmail.com','None','None','M',2,1,'active' FROM schools WHERE school_code='SCH_015';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0030','Emma Villanueva','2011-03-03',14,'Female','Grade 8',id,'Gloria Villanueva','09341234000','parent.villanueva2@gmail.com','None','Seafood','S',1,1,'active' FROM schools WHERE school_code='SCH_015';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0031','Noah Fernandez','2009-07-19',16,'Male','Grade 10',id,'Miguel Fernandez','09441234000','parent.fernandez2@gmail.com','None','None','L',4,1,'active' FROM schools WHERE school_code='SCH_016';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0032','Olivia Gonzales','2012-01-06',13,'Female','Grade 7',id,'Cynthia Gonzales','09541234100','parent.gonzales2@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_016';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0033','Lucas Castro','2010-08-23',15,'Male','Grade 9',id,'Ramon Castro','09641234000','parent.castro2@gmail.com','None','None','M',2,1,'active' FROM schools WHERE school_code='SCH_017';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0034','Ava Flores','2011-04-10',14,'Female','Grade 8',id,'Patricia Flores','09741234000','parent.flores2@gmail.com','Allergic Rhinitis','Peanuts','S',1,1,'active' FROM schools WHERE school_code='SCH_017';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0035','Ethan Diaz','2009-12-27',16,'Male','Grade 10',id,'Antonio Diaz','09841234000','parent.diaz2@gmail.com','None','None','M',3,1,'active' FROM schools WHERE school_code='SCH_018';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0036','Isabella Morales','2012-06-14',13,'Female','Grade 7',id,'Marisol Morales','09941234000','parent.morales2@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_018';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0037','Mason Aguilar','2010-02-01',15,'Male','Grade 9',id,'Fernando Aguilar','09151234000','parent.aguilar2@gmail.com','Asthma','None','M',2,1,'active' FROM schools WHERE school_code='SCH_019';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0038','Mia Pascual','2011-10-18',14,'Female','Grade 8',id,'Cristina Pascual','09251234000','parent.pascual2@gmail.com','None','None','S',1,1,'active' FROM schools WHERE school_code='SCH_019';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0039','Logan Santos','2009-05-05',16,'Male','Grade 10',id,'Rodrigo Santos','09351234000','parent.santos3@gmail.com','None','Seafood','L',4,1,'active' FROM schools WHERE school_code='SCH_020';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0040','Charlotte Reyes','2012-11-22',13,'Female','Grade 7',id,'Rowena Reyes','09451234100','parent.reyes3@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_020';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0041','Oliver Cruz','2010-03-11',15,'Male','Grade 9',id,'Maria Cruz','09551234000','parent.cruz3@gmail.com','None','None','M',2,1,'active' FROM schools WHERE school_code='SCH_021';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0042','Amelia Bautista','2011-09-28',14,'Female','Grade 8',id,'Juan Bautista','09651234000','parent.bautista3@gmail.com','None','Peanuts','S',1,1,'active' FROM schools WHERE school_code='SCH_021';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0043','Elijah Garcia','2009-01-15',16,'Male','Grade 10',id,'Jose Garcia','09751234000','parent.garcia3@gmail.com','None','None','M',3,1,'active' FROM schools WHERE school_code='SCH_022';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0044','Harper Mendoza','2012-07-02',13,'Female','Grade 7',id,'Ana Mendoza','09851234000','parent.mendoza3@gmail.com','Asthma','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_022';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0045','James Torres','2010-12-19',15,'Male','Grade 9',id,'Carlos Torres','09951234000','parent.torres3@gmail.com','Allergic Rhinitis','None','L',2,1,'active' FROM schools WHERE school_code='SCH_023';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0046','Evelyn Aquino','2011-06-06',14,'Female','Grade 8',id,'Rosa Aquino','09161234000','parent.aquino3@gmail.com','None','None','S',1,1,'active' FROM schools WHERE school_code='SCH_023';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0047','Mateo Ramos','2009-10-23',16,'Male','Grade 10',id,'Eduardo Ramos','09261234000','parent.ramos3@gmail.com','None','Seafood','M',4,1,'active' FROM schools WHERE school_code='SCH_024';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0048','Aria Dela Cruz','2012-04-10',13,'Female','Grade 7',id,'Liza Dela Cruz','09361234100','parent.delacruz3@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_024';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0049','Sebastian Villanueva','2010-08-27',15,'Male','Grade 9',id,'Roberto Villanueva','09461234000','parent.villanueva3@gmail.com','None','None','M',2,1,'active' FROM schools WHERE school_code='SCH_025';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0050','Luna Fernandez','2011-02-14',14,'Female','Grade 8',id,'Gloria Fernandez','09561234000','parent.fernandez3@gmail.com','None','None','S',1,1,'active' FROM schools WHERE school_code='SCH_025';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0051','Jack Gonzales','2009-06-01',16,'Male','Grade 10',id,'Miguel Gonzales','09661234000','parent.gonzales3@gmail.com','None','Peanuts','L',3,1,'active' FROM schools WHERE school_code='SCH_026';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0052','Chloe Castro','2012-12-18',13,'Female','Grade 7',id,'Cynthia Castro','09761234000','parent.castro3@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_026';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0053','Aiden Flores','2010-04-05',15,'Male','Grade 9',id,'Ramon Flores','09861234000','parent.flores3@gmail.com','Asthma','None','M',2,1,'active' FROM schools WHERE school_code='SCH_027';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0054','Sofia Diaz','2011-10-22',14,'Female','Grade 8',id,'Patricia Diaz','09961234000','parent.diaz3@gmail.com','None','None','S',1,1,'active' FROM schools WHERE school_code='SCH_027';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0055','Liam Morales','2009-02-09',16,'Male','Grade 10',id,'Antonio Morales','09171234000','parent.morales3@gmail.com','None','None','M',4,1,'active' FROM schools WHERE school_code='SCH_028';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0056','Emma Aguilar','2012-08-26',13,'Female','Grade 7',id,'Marisol Aguilar','09271234100','parent.aguilar3@gmail.com','Allergic Rhinitis','Peanuts','XS',0,1,'active' FROM schools WHERE school_code='SCH_028';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0057','Noah Pascual','2010-12-13',15,'Male','Grade 9',id,'Fernando Pascual','09371234000','parent.pascual3@gmail.com','None','None','L',2,1,'active' FROM schools WHERE school_code='SCH_029';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0058','Olivia Santos','2011-06-30',14,'Female','Grade 8',id,'Cristina Santos','09471234000','parent.santos4@gmail.com','None','Seafood','S',1,1,'active' FROM schools WHERE school_code='SCH_029';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0059','Lucas Reyes','2009-10-17',16,'Male','Grade 10',id,'Rodrigo Reyes','09571234000','parent.reyes4@gmail.com','None','None','M',3,1,'active' FROM schools WHERE school_code='SCH_030';
INSERT INTO students (student_code, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status)
SELECT 'STU_0060','Ava Cruz','2012-04-04',13,'Female','Grade 7',id,'Rowena Cruz','09671234000','parent.cruz4@gmail.com','None','None','XS',0,1,'active' FROM schools WHERE school_code='SCH_030';

-- ── 6. Competitions ───────────────────────────────────────────
INSERT INTO competitions (competition_code, name, season, theme, date, venue, organizer, registration_deadline, categories, status) VALUES
('COMP_001','WRO Philippines 2022 National Finals','WRO 2022','Smart Cities','2022-09-17','SMX Convention Center, Manila','WRO Philippines National Office','2022-09-01','["RoboMission – Elementary","RoboMission – Junior","RoboMission – Senior","Future Engineers","Future Innovators","RoboSports","WeDo","Advanced Robotics"]','completed'),
('COMP_002','WRO Philippines 2023 National Finals','WRO 2023','Connecting the World','2023-09-16','World Trade Center, Pasay','WRO Philippines National Office','2023-09-01','["RoboMission – Elementary","RoboMission – Junior","RoboMission – Senior","Future Engineers","Future Innovators","RoboSports","WeDo","Advanced Robotics"]','completed'),
('COMP_003','WRO Philippines 2024 National Finals','WRO 2024','Earth Allies','2024-09-14','Marriott Grand Ballroom, Pasay','WRO Philippines National Office','2024-09-01','["RoboMission – Elementary","RoboMission – Junior","RoboMission – Senior","Future Engineers","Future Innovators","RoboSports","WeDo","Advanced Robotics"]','completed'),
('COMP_004','WRO Philippines 2025 National Finals','WRO 2025','Future Innovators','2025-09-20','University of Santo Tomas, Manila','WRO Philippines National Office','2025-09-01','["RoboMission – Elementary","RoboMission – Junior","RoboMission – Senior","Future Engineers","Future Innovators","RoboSports","WeDo","Advanced Robotics"]','upcoming');

-- ── 7. Teams (30 teams) — FKs resolved via sub-SELECT ─────────
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0001','WRO 2022',(SELECT id FROM competitions WHERE competition_code='COMP_001'),'Team Alpha 1','RoboMission – Elementary','Elementary',(SELECT id FROM schools WHERE school_code='SCH_001'),(SELECT id FROM coaches WHERE coach_code='COA_001'),'LEGO Mindstorms EV3','LEGO Mindstorms Software','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0002','WRO 2023',(SELECT id FROM competitions WHERE competition_code='COMP_002'),'Team Omega 2','RoboMission – Junior','Junior',(SELECT id FROM schools WHERE school_code='SCH_002'),(SELECT id FROM coaches WHERE coach_code='COA_002'),'LEGO SPIKE Prime','SPIKE App','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0003','WRO 2024',(SELECT id FROM competitions WHERE competition_code='COMP_003'),'Team Phoenix 3','RoboMission – Senior','Senior',(SELECT id FROM schools WHERE school_code='SCH_003'),(SELECT id FROM coaches WHERE coach_code='COA_003'),'Arduino','Python','registered','partial','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0004','WRO 2025',(SELECT id FROM competitions WHERE competition_code='COMP_004'),'Team Vanguard 4','Future Engineers','Senior',(SELECT id FROM schools WHERE school_code='SCH_004'),(SELECT id FROM coaches WHERE coach_code='COA_004'),'Raspberry Pi','Python','registered','unpaid','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0005','WRO 2022',(SELECT id FROM competitions WHERE competition_code='COMP_001'),'Team Nexus 5','Future Innovators','Senior',(SELECT id FROM schools WHERE school_code='SCH_005'),(SELECT id FROM coaches WHERE coach_code='COA_005'),'LEGO Mindstorms EV3','EV3 Classroom','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0006','WRO 2023',(SELECT id FROM competitions WHERE competition_code='COMP_002'),'RoboElite 6','RoboSports','Junior',(SELECT id FROM schools WHERE school_code='SCH_006'),(SELECT id FROM coaches WHERE coach_code='COA_006'),'LEGO SPIKE Prime','Blockly','waitlisted','partial','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0007','WRO 2024',(SELECT id FROM competitions WHERE competition_code='COMP_003'),'TechWizards 7','WeDo','Elementary',(SELECT id FROM schools WHERE school_code='SCH_007'),(SELECT id FROM coaches WHERE coach_code='COA_007'),'LEGO SPIKE Essential','SPIKE App','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0008','WRO 2025',(SELECT id FROM competitions WHERE competition_code='COMP_004'),'BrainBots 8','Advanced Robotics','Senior',(SELECT id FROM schools WHERE school_code='SCH_008'),(SELECT id FROM coaches WHERE coach_code='COA_008'),'Custom Build','C++','registered','unpaid','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0009','WRO 2022',(SELECT id FROM competitions WHERE competition_code='COMP_001'),'InnovatorsX 9','RoboMission – Elementary','Elementary',(SELECT id FROM schools WHERE school_code='SCH_009'),(SELECT id FROM coaches WHERE coach_code='COA_009'),'LEGO Mindstorms NXT','Scratch','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0010','WRO 2023',(SELECT id FROM competitions WHERE competition_code='COMP_002'),'CircuitBreakers 10','RoboMission – Junior','Junior',(SELECT id FROM schools WHERE school_code='SCH_010'),(SELECT id FROM coaches WHERE coach_code='COA_010'),'VEX IQ','Blockly','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0011','WRO 2024',(SELECT id FROM competitions WHERE competition_code='COMP_003'),'ByteForce 11','RoboMission – Senior','Senior',(SELECT id FROM schools WHERE school_code='SCH_011'),(SELECT id FROM coaches WHERE coach_code='COA_011'),'LEGO Mindstorms EV3','Python','registered','partial','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0012','WRO 2025',(SELECT id FROM competitions WHERE competition_code='COMP_004'),'QuantumLeap 12','Future Engineers','Senior',(SELECT id FROM schools WHERE school_code='SCH_012'),(SELECT id FROM coaches WHERE coach_code='COA_012'),'Arduino','Arduino IDE','registered','unpaid','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0013','WRO 2022',(SELECT id FROM competitions WHERE competition_code='COMP_001'),'NanoMinds 13','Future Innovators','Senior',(SELECT id FROM schools WHERE school_code='SCH_013'),(SELECT id FROM coaches WHERE coach_code='COA_013'),'LEGO SPIKE Prime','SPIKE App','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0014','WRO 2023',(SELECT id FROM competitions WHERE competition_code='COMP_002'),'TechnoKids 14','RoboSports','Junior',(SELECT id FROM schools WHERE school_code='SCH_014'),(SELECT id FROM coaches WHERE coach_code='COA_014'),'LEGO Mindstorms EV3','EV3 Classroom','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0015','WRO 2024',(SELECT id FROM competitions WHERE competition_code='COMP_003'),'RoboStars 15','WeDo','Elementary',(SELECT id FROM schools WHERE school_code='SCH_015'),(SELECT id FROM coaches WHERE coach_code='COA_015'),'LEGO SPIKE Essential','Blockly','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0016','WRO 2025',(SELECT id FROM competitions WHERE competition_code='COMP_004'),'FutureBots 16','Advanced Robotics','Senior',(SELECT id FROM schools WHERE school_code='SCH_016'),(SELECT id FROM coaches WHERE coach_code='COA_016'),'Custom Build','C++','waitlisted','unpaid','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0017','WRO 2022',(SELECT id FROM competitions WHERE competition_code='COMP_001'),'MindBenders 17','RoboMission – Elementary','Elementary',(SELECT id FROM schools WHERE school_code='SCH_017'),(SELECT id FROM coaches WHERE coach_code='COA_017'),'LEGO Mindstorms EV3','LEGO Mindstorms Software','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0018','WRO 2023',(SELECT id FROM competitions WHERE competition_code='COMP_002'),'CodeCrushers 18','RoboMission – Junior','Junior',(SELECT id FROM schools WHERE school_code='SCH_018'),(SELECT id FROM coaches WHERE coach_code='COA_018'),'VEX IQ','Python','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0019','WRO 2024',(SELECT id FROM competitions WHERE competition_code='COMP_003'),'RoboSapiens 19','RoboMission – Senior','Senior',(SELECT id FROM schools WHERE school_code='SCH_019'),(SELECT id FROM coaches WHERE coach_code='COA_019'),'Arduino','C++','registered','partial','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0020','WRO 2025',(SELECT id FROM competitions WHERE competition_code='COMP_004'),'Techsmiths 20','Future Engineers','Senior',(SELECT id FROM schools WHERE school_code='SCH_020'),(SELECT id FROM coaches WHERE coach_code='COA_020'),'Raspberry Pi','Python','registered','unpaid','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0021','WRO 2022',(SELECT id FROM competitions WHERE competition_code='COMP_001'),'Team Alpha 21','Future Innovators','Senior',(SELECT id FROM schools WHERE school_code='SCH_021'),(SELECT id FROM coaches WHERE coach_code='COA_021'),'LEGO Mindstorms EV3','EV3 Classroom','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0022','WRO 2023',(SELECT id FROM competitions WHERE competition_code='COMP_002'),'Team Omega 22','RoboSports','Junior',(SELECT id FROM schools WHERE school_code='SCH_022'),(SELECT id FROM coaches WHERE coach_code='COA_022'),'LEGO SPIKE Prime','Blockly','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0023','WRO 2024',(SELECT id FROM competitions WHERE competition_code='COMP_003'),'Team Phoenix 23','WeDo','Elementary',(SELECT id FROM schools WHERE school_code='SCH_023'),(SELECT id FROM coaches WHERE coach_code='COA_023'),'LEGO SPIKE Essential','SPIKE App','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0024','WRO 2025',(SELECT id FROM competitions WHERE competition_code='COMP_004'),'Team Vanguard 24','Advanced Robotics','Senior',(SELECT id FROM schools WHERE school_code='SCH_024'),(SELECT id FROM coaches WHERE coach_code='COA_024'),'Custom Build','C++','registered','unpaid','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0025','WRO 2022',(SELECT id FROM competitions WHERE competition_code='COMP_001'),'Team Nexus 25','RoboMission – Elementary','Elementary',(SELECT id FROM schools WHERE school_code='SCH_025'),(SELECT id FROM coaches WHERE coach_code='COA_025'),'LEGO Mindstorms NXT','Scratch','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0026','WRO 2023',(SELECT id FROM competitions WHERE competition_code='COMP_002'),'RoboElite 26','RoboMission – Junior','Junior',(SELECT id FROM schools WHERE school_code='SCH_026'),(SELECT id FROM coaches WHERE coach_code='COA_026'),'LEGO Mindstorms EV3','LEGO Mindstorms Software','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0027','WRO 2024',(SELECT id FROM competitions WHERE competition_code='COMP_003'),'TechWizards 27','RoboMission – Senior','Senior',(SELECT id FROM schools WHERE school_code='SCH_027'),(SELECT id FROM coaches WHERE coach_code='COA_027'),'LEGO SPIKE Prime','Python','registered','partial','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0028','WRO 2025',(SELECT id FROM competitions WHERE competition_code='COMP_004'),'BrainBots 28','Future Engineers','Senior',(SELECT id FROM schools WHERE school_code='SCH_028'),(SELECT id FROM coaches WHERE coach_code='COA_028'),'Arduino','Arduino IDE','registered','unpaid','pending','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0029','WRO 2022',(SELECT id FROM competitions WHERE competition_code='COMP_001'),'InnovatorsX 29','Future Innovators','Senior',(SELECT id FROM schools WHERE school_code='SCH_029'),(SELECT id FROM coaches WHERE coach_code='COA_029'),'Raspberry Pi','Python','confirmed','paid','qualified','active';
INSERT INTO teams (team_code, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status)
SELECT 'TEAM_0030','WRO 2023',(SELECT id FROM competitions WHERE competition_code='COMP_002'),'CircuitBreakers 30','RoboSports','Junior',(SELECT id FROM schools WHERE school_code='SCH_030'),(SELECT id FROM coaches WHERE coach_code='COA_030'),'VEX IQ','Blockly','confirmed','paid','qualified','active';

-- ── 8. Team Members (junction) ────────────────────────────────
INSERT INTO team_members (team_id, student_id) VALUES
((SELECT id FROM teams WHERE team_code='TEAM_0001'),(SELECT id FROM students WHERE student_code='STU_0001')),
((SELECT id FROM teams WHERE team_code='TEAM_0001'),(SELECT id FROM students WHERE student_code='STU_0002')),
((SELECT id FROM teams WHERE team_code='TEAM_0002'),(SELECT id FROM students WHERE student_code='STU_0003')),
((SELECT id FROM teams WHERE team_code='TEAM_0002'),(SELECT id FROM students WHERE student_code='STU_0004')),
((SELECT id FROM teams WHERE team_code='TEAM_0003'),(SELECT id FROM students WHERE student_code='STU_0005')),
((SELECT id FROM teams WHERE team_code='TEAM_0003'),(SELECT id FROM students WHERE student_code='STU_0006')),
((SELECT id FROM teams WHERE team_code='TEAM_0004'),(SELECT id FROM students WHERE student_code='STU_0007')),
((SELECT id FROM teams WHERE team_code='TEAM_0004'),(SELECT id FROM students WHERE student_code='STU_0008')),
((SELECT id FROM teams WHERE team_code='TEAM_0005'),(SELECT id FROM students WHERE student_code='STU_0009')),
((SELECT id FROM teams WHERE team_code='TEAM_0005'),(SELECT id FROM students WHERE student_code='STU_0010')),
((SELECT id FROM teams WHERE team_code='TEAM_0006'),(SELECT id FROM students WHERE student_code='STU_0011')),
((SELECT id FROM teams WHERE team_code='TEAM_0006'),(SELECT id FROM students WHERE student_code='STU_0012')),
((SELECT id FROM teams WHERE team_code='TEAM_0007'),(SELECT id FROM students WHERE student_code='STU_0013')),
((SELECT id FROM teams WHERE team_code='TEAM_0007'),(SELECT id FROM students WHERE student_code='STU_0014')),
((SELECT id FROM teams WHERE team_code='TEAM_0008'),(SELECT id FROM students WHERE student_code='STU_0015')),
((SELECT id FROM teams WHERE team_code='TEAM_0008'),(SELECT id FROM students WHERE student_code='STU_0016')),
((SELECT id FROM teams WHERE team_code='TEAM_0009'),(SELECT id FROM students WHERE student_code='STU_0017')),
((SELECT id FROM teams WHERE team_code='TEAM_0009'),(SELECT id FROM students WHERE student_code='STU_0018')),
((SELECT id FROM teams WHERE team_code='TEAM_0010'),(SELECT id FROM students WHERE student_code='STU_0019')),
((SELECT id FROM teams WHERE team_code='TEAM_0010'),(SELECT id FROM students WHERE student_code='STU_0020')),
((SELECT id FROM teams WHERE team_code='TEAM_0011'),(SELECT id FROM students WHERE student_code='STU_0021')),
((SELECT id FROM teams WHERE team_code='TEAM_0011'),(SELECT id FROM students WHERE student_code='STU_0022')),
((SELECT id FROM teams WHERE team_code='TEAM_0012'),(SELECT id FROM students WHERE student_code='STU_0023')),
((SELECT id FROM teams WHERE team_code='TEAM_0012'),(SELECT id FROM students WHERE student_code='STU_0024')),
((SELECT id FROM teams WHERE team_code='TEAM_0013'),(SELECT id FROM students WHERE student_code='STU_0025')),
((SELECT id FROM teams WHERE team_code='TEAM_0013'),(SELECT id FROM students WHERE student_code='STU_0026')),
((SELECT id FROM teams WHERE team_code='TEAM_0014'),(SELECT id FROM students WHERE student_code='STU_0027')),
((SELECT id FROM teams WHERE team_code='TEAM_0014'),(SELECT id FROM students WHERE student_code='STU_0028')),
((SELECT id FROM teams WHERE team_code='TEAM_0015'),(SELECT id FROM students WHERE student_code='STU_0029')),
((SELECT id FROM teams WHERE team_code='TEAM_0015'),(SELECT id FROM students WHERE student_code='STU_0030')),
((SELECT id FROM teams WHERE team_code='TEAM_0016'),(SELECT id FROM students WHERE student_code='STU_0031')),
((SELECT id FROM teams WHERE team_code='TEAM_0016'),(SELECT id FROM students WHERE student_code='STU_0032')),
((SELECT id FROM teams WHERE team_code='TEAM_0017'),(SELECT id FROM students WHERE student_code='STU_0033')),
((SELECT id FROM teams WHERE team_code='TEAM_0017'),(SELECT id FROM students WHERE student_code='STU_0034')),
((SELECT id FROM teams WHERE team_code='TEAM_0018'),(SELECT id FROM students WHERE student_code='STU_0035')),
((SELECT id FROM teams WHERE team_code='TEAM_0018'),(SELECT id FROM students WHERE student_code='STU_0036')),
((SELECT id FROM teams WHERE team_code='TEAM_0019'),(SELECT id FROM students WHERE student_code='STU_0037')),
((SELECT id FROM teams WHERE team_code='TEAM_0019'),(SELECT id FROM students WHERE student_code='STU_0038')),
((SELECT id FROM teams WHERE team_code='TEAM_0020'),(SELECT id FROM students WHERE student_code='STU_0039')),
((SELECT id FROM teams WHERE team_code='TEAM_0020'),(SELECT id FROM students WHERE student_code='STU_0040')),
((SELECT id FROM teams WHERE team_code='TEAM_0021'),(SELECT id FROM students WHERE student_code='STU_0041')),
((SELECT id FROM teams WHERE team_code='TEAM_0021'),(SELECT id FROM students WHERE student_code='STU_0042')),
((SELECT id FROM teams WHERE team_code='TEAM_0022'),(SELECT id FROM students WHERE student_code='STU_0043')),
((SELECT id FROM teams WHERE team_code='TEAM_0022'),(SELECT id FROM students WHERE student_code='STU_0044')),
((SELECT id FROM teams WHERE team_code='TEAM_0023'),(SELECT id FROM students WHERE student_code='STU_0045')),
((SELECT id FROM teams WHERE team_code='TEAM_0023'),(SELECT id FROM students WHERE student_code='STU_0046')),
((SELECT id FROM teams WHERE team_code='TEAM_0024'),(SELECT id FROM students WHERE student_code='STU_0047')),
((SELECT id FROM teams WHERE team_code='TEAM_0024'),(SELECT id FROM students WHERE student_code='STU_0048')),
((SELECT id FROM teams WHERE team_code='TEAM_0025'),(SELECT id FROM students WHERE student_code='STU_0049')),
((SELECT id FROM teams WHERE team_code='TEAM_0025'),(SELECT id FROM students WHERE student_code='STU_0050')),
((SELECT id FROM teams WHERE team_code='TEAM_0026'),(SELECT id FROM students WHERE student_code='STU_0051')),
((SELECT id FROM teams WHERE team_code='TEAM_0026'),(SELECT id FROM students WHERE student_code='STU_0052')),
((SELECT id FROM teams WHERE team_code='TEAM_0027'),(SELECT id FROM students WHERE student_code='STU_0053')),
((SELECT id FROM teams WHERE team_code='TEAM_0027'),(SELECT id FROM students WHERE student_code='STU_0054')),
((SELECT id FROM teams WHERE team_code='TEAM_0028'),(SELECT id FROM students WHERE student_code='STU_0055')),
((SELECT id FROM teams WHERE team_code='TEAM_0028'),(SELECT id FROM students WHERE student_code='STU_0056')),
((SELECT id FROM teams WHERE team_code='TEAM_0029'),(SELECT id FROM students WHERE student_code='STU_0057')),
((SELECT id FROM teams WHERE team_code='TEAM_0029'),(SELECT id FROM students WHERE student_code='STU_0058')),
((SELECT id FROM teams WHERE team_code='TEAM_0030'),(SELECT id FROM students WHERE student_code='STU_0059')),
((SELECT id FROM teams WHERE team_code='TEAM_0030'),(SELECT id FROM students WHERE student_code='STU_0060'));

-- ── 9. Judges (Master Data) ───────────────────────────────────
INSERT INTO judges (judge_code, full_name, contact_number, gender, season, judging_category, status) VALUES
('JDG_0001','Dr. Jose Reyes',      '09171112222','Male',  'WRO 2024','RoboMission – Elementary','active'),
('JDG_0002','Engr. Maria Santos',  '09182223333','Female','WRO 2024','RoboMission – Junior',   'active'),
('JDG_0003','Prof. Carlos Bautista','09193334444','Male',  'WRO 2024','RoboMission – Senior',   'active'),
('JDG_0004','Dr. Ana Cruz',        '09204445555','Female','WRO 2024','Future Innovators',       'active'),
('JDG_0005','Engr. Roberto Torres','09215556666','Male',  'WRO 2024','WeDo',                    'active'),
('JDG_0006','Dr. Miguel Rivera',   '09226667777','Male',  'WRO 2024','RoboSports',              'active'),
('JDG_0007','Engr. Sofia Villanueva','09237778888','Female','WRO 2024','Advanced Robotics',     'active'),
('JDG_0008','Prof. Ricardo Go',    '09248889999','Male',  'WRO 2025','Future Engineers',        'active'),
('JDG_0009','Dr. Leni Ramos',      '09259990000','Female','WRO 2025','RoboMission – Elementary','active'),
('JDG_0010','Engr. Paulo Diaz',    '09260001111','Male',  'WRO 2025','RoboMission – Junior',   'active'),
('JDG_0011','Prof. Elena Marcos',  '09271112222','Female','WRO 2025','RoboMission – Senior',   'active'),
('JDG_0012','Dr. Vic Sotto',       '09282223333','Male',  'WRO 2025','Future Innovators',       'active'),
('JDG_0013','Engr. Pia Alonzo',    '09293334444','Female','WRO 2025','WeDo',                    'active'),
('JDG_0014','Prof. Martin Nievera','09304445555','Male',  'WRO 2025','RoboSports',              'active'),
('JDG_0015','Dr. Lea Salonga',     '09315556666','Female','WRO 2025','Advanced Robotics',       'active');

-- ── 10. Awards ────────────────────────────────────────────────
INSERT INTO awards (award_code, team_id, school_id, coach_id, category, award, year, event, has_trophy, has_medal, has_certificate, status) VALUES
('AWD_0001',(SELECT id FROM teams WHERE team_code='TEAM_0001'),(SELECT id FROM schools WHERE school_code='SCH_001'),(SELECT id FROM coaches WHERE coach_code='COA_001'),'RoboMission – Elementary','Champion',2022,'WRO Philippines 2022 National Finals',1,1,1,'confirmed'),
('AWD_0002',(SELECT id FROM teams WHERE team_code='TEAM_0002'),(SELECT id FROM schools WHERE school_code='SCH_002'),(SELECT id FROM coaches WHERE coach_code='COA_002'),'RoboMission – Junior','1st Runner-up',2023,'WRO Philippines 2023 National Finals',1,1,1,'confirmed'),
('AWD_0003',(SELECT id FROM teams WHERE team_code='TEAM_0003'),(SELECT id FROM schools WHERE school_code='SCH_003'),(SELECT id FROM coaches WHERE coach_code='COA_003'),'RoboMission – Senior','2nd Runner-up',2024,'WRO Philippines 2024 National Finals',0,1,1,'confirmed'),
('AWD_0004',(SELECT id FROM teams WHERE team_code='TEAM_0005'),(SELECT id FROM schools WHERE school_code='SCH_005'),(SELECT id FROM coaches WHERE coach_code='COA_005'),'Future Innovators','Best Robot Design',2022,'WRO Philippines 2022 National Finals',0,1,1,'confirmed'),
('AWD_0005',(SELECT id FROM teams WHERE team_code='TEAM_0007'),(SELECT id FROM schools WHERE school_code='SCH_007'),(SELECT id FROM coaches WHERE coach_code='COA_007'),'WeDo','Best Programming',2024,'WRO Philippines 2024 National Finals',0,1,1,'confirmed'),
('AWD_0006',(SELECT id FROM teams WHERE team_code='TEAM_0009'),(SELECT id FROM schools WHERE school_code='SCH_009'),(SELECT id FROM coaches WHERE coach_code='COA_009'),'RoboMission – Elementary','Best Teamwork',2022,'WRO Philippines 2022 National Finals',0,1,1,'confirmed'),
('AWD_0007',(SELECT id FROM teams WHERE team_code='TEAM_0010'),(SELECT id FROM schools WHERE school_code='SCH_010'),(SELECT id FROM coaches WHERE coach_code='COA_010'),'RoboMission – Junior','Champion',2023,'WRO Philippines 2023 National Finals',1,1,1,'confirmed'),
('AWD_0008',(SELECT id FROM teams WHERE team_code='TEAM_0013'),(SELECT id FROM schools WHERE school_code='SCH_013'),(SELECT id FROM coaches WHERE coach_code='COA_013'),'Future Innovators','Best Presentation',2022,'WRO Philippines 2022 National Finals',0,0,1,'confirmed'),
('AWD_0009',(SELECT id FROM teams WHERE team_code='TEAM_0014'),(SELECT id FROM schools WHERE school_code='SCH_014'),(SELECT id FROM coaches WHERE coach_code='COA_014'),'RoboSports','Most Creative',2023,'WRO Philippines 2023 National Finals',0,0,1,'confirmed'),
('AWD_0010',(SELECT id FROM teams WHERE team_code='TEAM_0015'),(SELECT id FROM schools WHERE school_code='SCH_015'),(SELECT id FROM coaches WHERE coach_code='COA_015'),'WeDo','Best Rookie Team',2024,'WRO Philippines 2024 National Finals',0,0,1,'confirmed'),
('AWD_0011',(SELECT id FROM teams WHERE team_code='TEAM_0017'),(SELECT id FROM schools WHERE school_code='SCH_017'),(SELECT id FROM coaches WHERE coach_code='COA_017'),'RoboMission – Elementary','Special Award',2022,'WRO Philippines 2022 National Finals',0,0,1,'confirmed'),
('AWD_0012',(SELECT id FROM teams WHERE team_code='TEAM_0018'),(SELECT id FROM schools WHERE school_code='SCH_018'),(SELECT id FROM coaches WHERE coach_code='COA_018'),'RoboMission – Junior','Certificate of Participation',2023,'WRO Philippines 2023 National Finals',0,0,1,'confirmed'),
('AWD_0013',(SELECT id FROM teams WHERE team_code='TEAM_0021'),(SELECT id FROM schools WHERE school_code='SCH_021'),(SELECT id FROM coaches WHERE coach_code='COA_021'),'Future Innovators','1st Runner-up',2022,'WRO Philippines 2022 National Finals',1,1,1,'confirmed'),
('AWD_0014',(SELECT id FROM teams WHERE team_code='TEAM_0022'),(SELECT id FROM schools WHERE school_code='SCH_022'),(SELECT id FROM coaches WHERE coach_code='COA_022'),'RoboSports','2nd Runner-up',2023,'WRO Philippines 2023 National Finals',0,1,1,'confirmed'),
('AWD_0015',(SELECT id FROM teams WHERE team_code='TEAM_0025'),(SELECT id FROM schools WHERE school_code='SCH_025'),(SELECT id FROM coaches WHERE coach_code='COA_025'),'RoboMission – Elementary','Best Robot Design',2022,'WRO Philippines 2022 National Finals',0,1,1,'confirmed');

-- ── 11. Payments ──────────────────────────────────────────────
INSERT INTO payments (payment_code, team_id, school_id, registration_fee, amount_paid, balance, payment_date, payment_method, or_number, sponsorship, scholarship, status) VALUES
('PAY_0001',(SELECT id FROM teams WHERE team_code='TEAM_0001'),(SELECT id FROM schools WHERE school_code='SCH_001'),3500.00,3500.00,0.00,'2025-03-15','GCash','OR-45231',0,'None','paid'),
('PAY_0002',(SELECT id FROM teams WHERE team_code='TEAM_0002'),(SELECT id FROM schools WHERE school_code='SCH_002'),4000.00,4000.00,0.00,'2025-04-02','Bank Transfer','OR-67892',1000,'None','paid'),
('PAY_0003',(SELECT id FROM teams WHERE team_code='TEAM_0003'),(SELECT id FROM schools WHERE school_code='SCH_003'),3000.00,1500.00,1500.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0004',(SELECT id FROM teams WHERE team_code='TEAM_0004'),(SELECT id FROM schools WHERE school_code='SCH_004'),5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0005',(SELECT id FROM teams WHERE team_code='TEAM_0005'),(SELECT id FROM schools WHERE school_code='SCH_005'),3500.00,3500.00,0.00,'2025-02-28','Maya','OR-89012',2000,'Full','paid'),
('PAY_0006',(SELECT id FROM teams WHERE team_code='TEAM_0006'),(SELECT id FROM schools WHERE school_code='SCH_006'),4000.00,2000.00,2000.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0007',(SELECT id FROM teams WHERE team_code='TEAM_0007'),(SELECT id FROM schools WHERE school_code='SCH_007'),3000.00,3000.00,0.00,'2025-05-10','Cash','OR-12345',0,'None','paid'),
('PAY_0008',(SELECT id FROM teams WHERE team_code='TEAM_0008'),(SELECT id FROM schools WHERE school_code='SCH_008'),5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0009',(SELECT id FROM teams WHERE team_code='TEAM_0009'),(SELECT id FROM schools WHERE school_code='SCH_009'),3500.00,3500.00,0.00,'2025-01-20','GCash','OR-23456',1000,'None','paid'),
('PAY_0010',(SELECT id FROM teams WHERE team_code='TEAM_0010'),(SELECT id FROM schools WHERE school_code='SCH_010'),4000.00,4000.00,0.00,'2025-03-08','Online Payment','OR-34567',0,'None','paid'),
('PAY_0011',(SELECT id FROM teams WHERE team_code='TEAM_0011'),(SELECT id FROM schools WHERE school_code='SCH_011'),3000.00,1500.00,1500.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0012',(SELECT id FROM teams WHERE team_code='TEAM_0012'),(SELECT id FROM schools WHERE school_code='SCH_012'),5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0013',(SELECT id FROM teams WHERE team_code='TEAM_0013'),(SELECT id FROM schools WHERE school_code='SCH_013'),3500.00,3500.00,0.00,'2025-04-15','Bank Transfer','OR-45678',2000,'Full','paid'),
('PAY_0014',(SELECT id FROM teams WHERE team_code='TEAM_0014'),(SELECT id FROM schools WHERE school_code='SCH_014'),4000.00,4000.00,0.00,'2025-02-14','Check','OR-56789',0,'None','paid'),
('PAY_0015',(SELECT id FROM teams WHERE team_code='TEAM_0015'),(SELECT id FROM schools WHERE school_code='SCH_015'),3000.00,3000.00,0.00,'2025-06-01','GCash','OR-67890',0,'None','paid'),
('PAY_0016',(SELECT id FROM teams WHERE team_code='TEAM_0016'),(SELECT id FROM schools WHERE school_code='SCH_016'),5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0017',(SELECT id FROM teams WHERE team_code='TEAM_0017'),(SELECT id FROM schools WHERE school_code='SCH_017'),3500.00,3500.00,0.00,'2025-03-22','Maya','OR-78901',1000,'None','paid'),
('PAY_0018',(SELECT id FROM teams WHERE team_code='TEAM_0018'),(SELECT id FROM schools WHERE school_code='SCH_018'),4000.00,4000.00,0.00,'2025-05-05','Online Payment','OR-89012',0,'None','paid'),
('PAY_0019',(SELECT id FROM teams WHERE team_code='TEAM_0019'),(SELECT id FROM schools WHERE school_code='SCH_019'),3000.00,1500.00,1500.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0020',(SELECT id FROM teams WHERE team_code='TEAM_0020'),(SELECT id FROM schools WHERE school_code='SCH_020'),5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0021',(SELECT id FROM teams WHERE team_code='TEAM_0021'),(SELECT id FROM schools WHERE school_code='SCH_021'),3500.00,3500.00,0.00,'2025-01-30','Cash','OR-90123',0,'None','paid'),
('PAY_0022',(SELECT id FROM teams WHERE team_code='TEAM_0022'),(SELECT id FROM schools WHERE school_code='SCH_022'),4000.00,4000.00,0.00,'2025-04-18','Bank Transfer','OR-01234',2000,'Full','paid'),
('PAY_0023',(SELECT id FROM teams WHERE team_code='TEAM_0023'),(SELECT id FROM schools WHERE school_code='SCH_023'),3000.00,3000.00,0.00,'2025-06-15','GCash','OR-12345',0,'None','paid'),
('PAY_0024',(SELECT id FROM teams WHERE team_code='TEAM_0024'),(SELECT id FROM schools WHERE school_code='SCH_024'),5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0025',(SELECT id FROM teams WHERE team_code='TEAM_0025'),(SELECT id FROM schools WHERE school_code='SCH_025'),3500.00,3500.00,0.00,'2025-02-10','Maya','OR-23456',1000,'None','paid'),
('PAY_0026',(SELECT id FROM teams WHERE team_code='TEAM_0026'),(SELECT id FROM schools WHERE school_code='SCH_026'),4000.00,4000.00,0.00,'2025-03-28','Online Payment','OR-34567',0,'None','paid'),
('PAY_0027',(SELECT id FROM teams WHERE team_code='TEAM_0027'),(SELECT id FROM schools WHERE school_code='SCH_027'),3000.00,1500.00,1500.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0028',(SELECT id FROM teams WHERE team_code='TEAM_0028'),(SELECT id FROM schools WHERE school_code='SCH_028'),5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0029',(SELECT id FROM teams WHERE team_code='TEAM_0029'),(SELECT id FROM schools WHERE school_code='SCH_029'),3500.00,3500.00,0.00,'2025-05-20','GCash','OR-45678',0,'None','paid'),
('PAY_0030',(SELECT id FROM teams WHERE team_code='TEAM_0030'),(SELECT id FROM schools WHERE school_code='SCH_030'),4000.00,4000.00,0.00,'2025-04-25','Cash','OR-56789',1000,'None','paid');

-- ── 12. Communications ────────────────────────────────────────
INSERT INTO communications (comm_code, team_id, registration_confirmation, payment_confirmation, certificate_sent, email_history, sms_history, announcement_received, feedback_submitted, status) VALUES
('COM_0001',(SELECT id FROM teams WHERE team_code='TEAM_0001'),1,1,1,'[{"date":"2025-07-01","subject":"Registration Confirmed","to":"coa_001@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0002',(SELECT id FROM teams WHERE team_code='TEAM_0002'),1,1,0,'[{"date":"2025-07-02","subject":"Registration Confirmed","to":"coa_002@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0003',(SELECT id FROM teams WHERE team_code='TEAM_0003'),1,0,0,'[{"date":"2025-07-03","subject":"Registration Confirmed","to":"coa_003@school.edu.ph","status":"delivered"}]','[]',1,0,'active'),
('COM_0004',(SELECT id FROM teams WHERE team_code='TEAM_0004'),1,0,0,'[{"date":"2025-07-04","subject":"Registration Confirmed","to":"coa_004@school.edu.ph","status":"delivered"}]','[]',1,0,'active'),
('COM_0005',(SELECT id FROM teams WHERE team_code='TEAM_0005'),1,1,1,'[{"date":"2025-07-05","subject":"Registration Confirmed","to":"coa_005@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0006',(SELECT id FROM teams WHERE team_code='TEAM_0006'),1,0,0,'[{"date":"2025-07-06","subject":"Registration Confirmed","to":"coa_006@school.edu.ph","status":"delivered"}]','[]',1,0,'active'),
('COM_0007',(SELECT id FROM teams WHERE team_code='TEAM_0007'),1,1,0,'[{"date":"2025-07-07","subject":"Registration Confirmed","to":"coa_007@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0008',(SELECT id FROM teams WHERE team_code='TEAM_0008'),1,0,0,'[{"date":"2025-07-08","subject":"Registration Confirmed","to":"coa_008@school.edu.ph","status":"delivered"}]','[]',1,0,'active'),
('COM_0009',(SELECT id FROM teams WHERE team_code='TEAM_0009'),1,1,1,'[{"date":"2025-07-09","subject":"Registration Confirmed","to":"coa_009@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0010',(SELECT id FROM teams WHERE team_code='TEAM_0010'),1,1,0,'[{"date":"2025-07-10","subject":"Registration Confirmed","to":"coa_010@school.edu.ph","status":"delivered"}]','[]',1,1,'active');

-- ── 13. Delegation ────────────────────────────────────────────
INSERT INTO delegation (delegation_code, team_id, destination_country, wro_year, passport_status, passport_expiry, visa_status, parent_consent, flight, hotel, dietary_restrictions, shirt_size, emergency_contact, status) VALUES
('DEL_001',(SELECT id FROM teams WHERE team_code='TEAM_0001'),'Turkey',2024,'approved','2027-12-31','approved',1,'PAL - MNL-IST','Marriott Hotel','None','M','09181234567','confirmed'),
('DEL_002',(SELECT id FROM teams WHERE team_code='TEAM_0002'),'Germany',2024,'processing','2027-12-31','applied',1,'Singapore Airlines - MNL-FRA','Hilton Hotel','None','L','09271234567','confirmed'),
('DEL_003',(SELECT id FROM teams WHERE team_code='TEAM_0005'),'Indonesia',2024,'submitted','2027-12-31','not required',1,'Cebu Pacific - MNL-CGK','Novotel Hotel','Halal','S','09541234567','confirmed'),
('DEL_004',(SELECT id FROM teams WHERE team_code='TEAM_0007'),'Thailand',2024,'approved','2027-12-31','approved',1,'PAL - MNL-IST','Holiday Inn Hotel','None','M','09721234567','confirmed'),
('DEL_005',(SELECT id FROM teams WHERE team_code='TEAM_0009'),'Japan',2025,'approved','2027-12-31','approved',1,'Singapore Airlines - MNL-FRA','Marriott Hotel','None','M','09901234567','confirmed'),
('DEL_006',(SELECT id FROM teams WHERE team_code='TEAM_0010'),'South Korea',2025,'processing','2027-12-31','applied',1,'PAL - MNL-CGK','Hilton Hotel','Vegetarian','S','09121234567','confirmed'),
('DEL_007',(SELECT id FROM teams WHERE team_code='TEAM_0013'),'Brazil',2025,'submitted','2027-12-31','not required',1,'Cebu Pacific - MNL-IST','Novotel Hotel','None','L','09421234567','confirmed'),
('DEL_008',(SELECT id FROM teams WHERE team_code='TEAM_0014'),'USA',2025,'approved','2027-12-31','approved',1,'PAL - MNL-FRA','Holiday Inn Hotel','None','M','09521234567','confirmed');

SET FOREIGN_KEY_CHECKS = 1;

-- Verify seed
SELECT 'Seed complete!' AS status;
SELECT 'Seasons'      AS tbl, COUNT(*) AS cnt FROM seasons
UNION ALL SELECT 'Users',          COUNT(*) FROM users
UNION ALL SELECT 'Schools',        COUNT(*) FROM schools
UNION ALL SELECT 'Coaches',        COUNT(*) FROM coaches
UNION ALL SELECT 'Students',       COUNT(*) FROM students
UNION ALL SELECT 'Competitions',   COUNT(*) FROM competitions
UNION ALL SELECT 'Teams',          COUNT(*) FROM teams
UNION ALL SELECT 'Team Members',   COUNT(*) FROM team_members
UNION ALL SELECT 'Judges',         COUNT(*) FROM judges
UNION ALL SELECT 'Awards',         COUNT(*) FROM awards
UNION ALL SELECT 'Payments',       COUNT(*) FROM payments
UNION ALL SELECT 'Communications', COUNT(*) FROM communications
UNION ALL SELECT 'Delegation',     COUNT(*) FROM delegation;
