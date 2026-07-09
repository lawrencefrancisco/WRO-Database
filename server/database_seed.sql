-- ============================================================
-- WRO Philippines DBMS – Demo Data Seed
-- Mirrors the data from js/core/seed.js
-- Run AFTER database.sql:
--   mysql -u root wro_philippines < server/database_seed.sql
-- ============================================================

USE wro_philippines;

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Default Users ──────────────────────────────────────────
INSERT INTO users (id, username, password_hash, name, role, email, is_active) VALUES
('USER_SUPERADMIN', 'admin',      'admin123',      'Lawrence Francisco', 'SUPER_ADMIN',  'admin@wrophilippines.org',    1),
('USER_EVENTADMIN', 'eventadmin', 'event123',      'Maria Santos',       'EVENT_ADMIN',  'event@wrophilippines.org',    1),
('USER_JUDGE1',     'judge1',     'judge123',      'Dr. Jose Reyes',     'JUDGE',        'judge1@wrophilippines.org',   1),
('USER_COACH1',     'coach1',     'coach123',      'Carlos Mendoza',     'COACH',        'coach1@gmail.com',            1),
('USER_VOLUNTEER1', 'volunteer1', 'volunteer123',  'Ana Garcia',         'VOLUNTEER',    'volunteer1@gmail.com',        1);

-- ── 2. Schools (30 schools across 5 regions) ──────────────────
INSERT INTO schools (id, school_name, school_type, school_level, deped_id, region, province, city, address, contact_number, email, school_head, robotics_coordinator, years_joined, status) VALUES
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

-- ── 3. Coaches ────────────────────────────────────────────────
INSERT INTO coaches (id, full_name, birthday, gender, email, mobile, school_id, position, shirt_size, emergency_contact, certifications, years_coaching, previous_awards, status) VALUES
('COA_001','Maria Santos','1982-03-15','Female','maria.santos@gmail.com','09181234567','SCH_001','Robotics Teacher','M','Jose Santos - 09181234568','WRO Certified Coach',5,'Champion 2023','active'),
('COA_002','Juan Reyes','1979-07-22','Male','juan.reyes@gmail.com','09271234567','SCH_002','ICT Coordinator','L','Maria Reyes - 09271234568','LEGO Education Certified',4,'None','active'),
('COA_003','Jose Cruz','1985-11-08','Male','jose.cruz@gmail.com','09361234567','SCH_003','STEM Coordinator','M','Ana Cruz - 09361234568','Robotics Instructor Level 1',3,'Best Coach 2022','active'),
('COA_004','Ana Bautista','1980-05-30','Female','ana.bautista@gmail.com','09451234567','SCH_004','Science Teacher','S','Carlos Bautista - 09451234568','None',6,'None','active'),
('COA_005','Carlos Garcia','1983-09-14','Male','carlos.garcia@gmail.com','09541234567','SCH_005','Math Teacher','XL','Rosa Garcia - 09541234568','WRO Certified Coach',7,'Best Coach 2024','active'),
('COA_006','Rosa Mendoza','1977-01-25','Female','rosa.mendoza@gmail.com','09631234567','SCH_006','Robotics Teacher','M','Eduardo Mendoza - 09631234568','LEGO Education Certified',8,'Champion 2023','active'),
('COA_007','Eduardo Torres','1986-06-18','Male','eduardo.torres@gmail.com','09721234567','SCH_007','ICT Coordinator','L','Liza Torres - 09721234568','None',2,'None','active'),
('COA_008','Liza Aquino','1981-12-03','Female','liza.aquino@gmail.com','09811234567','SCH_008','STEM Coordinator','S','Roberto Aquino - 09811234568','WRO Certified Coach',4,'None','active'),
('COA_009','Roberto Ramos','1978-04-27','Male','roberto.ramos@gmail.com','09901234567','SCH_009','Science Teacher','XL','Gloria Ramos - 09901234568','Robotics Instructor Level 1',6,'Best Coach 2022','active'),
('COA_010','Gloria Dela Cruz','1984-08-11','Female','gloria.delacruz@gmail.com','09121234567','SCH_010','Robotics Teacher','M','Miguel Dela Cruz - 09121234568','None',3,'None','active'),
('COA_011','Miguel Villanueva','1980-02-19','Male','miguel.villanueva@gmail.com','09221234567','SCH_011','Math Teacher','L','Cynthia Villanueva - 09221234568','LEGO Education Certified',5,'Champion 2023','active'),
('COA_012','Cynthia Fernandez','1987-10-07','Female','cynthia.fernandez@gmail.com','09321234567','SCH_012','ICT Coordinator','S','Ramon Fernandez - 09321234568','None',1,'None','active'),
('COA_013','Ramon Gonzales','1976-06-23','Male','ramon.gonzales@gmail.com','09421234567','SCH_013','STEM Coordinator','XL','Patricia Gonzales - 09421234568','WRO Certified Coach',7,'Best Coach 2024','active'),
('COA_014','Patricia Castro','1983-12-14','Female','patricia.castro@gmail.com','09521234567','SCH_014','Science Teacher','M','Antonio Castro - 09521234568','Robotics Instructor Level 1',4,'None','active'),
('COA_015','Antonio Flores','1979-04-01','Male','antonio.flores@gmail.com','09621234567','SCH_015','Robotics Teacher','L','Marisol Flores - 09621234568','None',6,'Best Coach 2022','active'),
('COA_016','Marisol Diaz','1985-09-28','Female','marisol.diaz@gmail.com','09721234568','SCH_016','Math Teacher','S','Fernando Diaz - 09721234569','LEGO Education Certified',3,'None','active'),
('COA_017','Fernando Morales','1982-01-16','Male','fernando.morales@gmail.com','09821234567','SCH_017','ICT Coordinator','XL','Cristina Morales - 09821234568','None',5,'Champion 2023','active'),
('COA_018','Cristina Aguilar','1977-07-09','Female','cristina.aguilar@gmail.com','09921234567','SCH_018','STEM Coordinator','M','Rodrigo Aguilar - 09921234568','WRO Certified Coach',8,'None','active'),
('COA_019','Rodrigo Pascual','1984-03-25','Male','rodrigo.pascual@gmail.com','09131234567','SCH_019','Science Teacher','L','Rowena Pascual - 09131234568','Robotics Instructor Level 1',2,'Best Coach 2024','active'),
('COA_020','Rowena Santos','1980-11-12','Female','rowena.santos@gmail.com','09231234567','SCH_020','Robotics Teacher','S','Maria Santos - 09231234568','None',4,'None','active'),
('COA_021','Maria Reyes','1986-05-30','Female','maria.reyes@gmail.com','09331234567','SCH_021','Math Teacher','M','Juan Reyes - 09331234568','LEGO Education Certified',6,'None','active'),
('COA_022','Juan Cruz','1978-08-17','Male','juan.cruz@gmail.com','09431234567','SCH_022','ICT Coordinator','XL','Jose Cruz - 09431234568','WRO Certified Coach',7,'Champion 2023','active'),
('COA_023','Jose Bautista','1983-02-04','Male','jose.bautista@gmail.com','09531234567','SCH_023','STEM Coordinator','L','Ana Bautista - 09531234568','None',3,'None','active'),
('COA_024','Ana Garcia','1981-10-21','Female','ana.garcia@gmail.com','09631234568','SCH_024','Science Teacher','S','Carlos Garcia - 09631234569','Robotics Instructor Level 1',5,'Best Coach 2022','active'),
('COA_025','Carlos Mendoza','1979-04-08','Male','carlos.mendoza@gmail.com','09731234567','SCH_025','Robotics Teacher','M','Rosa Mendoza - 09731234568','None',4,'None','active'),
('COA_026','Rosa Torres','1985-12-25','Female','rosa.torres@gmail.com','09831234567','SCH_026','Math Teacher','L','Eduardo Torres - 09831234568','LEGO Education Certified',2,'None','active'),
('COA_027','Eduardo Aquino','1976-06-12','Male','eduardo.aquino@gmail.com','09931234567','SCH_027','ICT Coordinator','XL','Liza Aquino - 09931234568','WRO Certified Coach',8,'Best Coach 2024','active'),
('COA_028','Liza Ramos','1982-02-28','Female','liza.ramos@gmail.com','09141234567','SCH_028','STEM Coordinator','M','Roberto Ramos - 09141234568','None',6,'Champion 2023','active'),
('COA_029','Roberto Dela Cruz','1980-09-15','Male','roberto.delacruz@gmail.com','09241234567','SCH_029','Science Teacher','L','Gloria Dela Cruz - 09241234568','Robotics Instructor Level 1',4,'None','active'),
('COA_030','Gloria Villanueva','1987-03-03','Female','gloria.villanueva@gmail.com','09341234567','SCH_030','Robotics Teacher','S','Miguel Villanueva - 09341234568','None',1,'None','active');

-- ── 4. Students (60 students) ─────────────────────────────────
INSERT INTO students (id, full_name, birthday, age, gender, grade_level, school_id, parent_name, parent_contact, parent_email, medical_conditions, allergies, shirt_size, previous_participation, consent_signed, status) VALUES
('STU_0001','Aiden Santos','2010-03-12',15,'Male','Grade 9','SCH_001','Maria Santos','09181234000','parent.santos@gmail.com','None','None','M',2,1,'active'),
('STU_0002','Sofia Reyes','2011-07-25',14,'Female','Grade 8','SCH_001','Juan Reyes','09271234000','parent.reyes@gmail.com','Asthma','None','S',1,1,'active'),
('STU_0003','Liam Cruz','2009-11-08',16,'Male','Grade 10','SCH_002','Jose Cruz','09361234000','parent.cruz@gmail.com','None','Seafood','M',3,1,'active'),
('STU_0004','Emma Bautista','2012-05-30',13,'Female','Grade 7','SCH_002','Ana Bautista','09451234000','parent.bautista@gmail.com','None','None','XS',0,1,'active'),
('STU_0005','Noah Garcia','2010-09-14',15,'Male','Grade 9','SCH_003','Carlos Garcia','09541234000','parent.garcia@gmail.com','None','Peanuts','M',2,1,'active'),
('STU_0006','Olivia Mendoza','2011-01-25',14,'Female','Grade 8','SCH_003','Rosa Mendoza','09631234000','parent.mendoza@gmail.com','Allergic Rhinitis','None','S',1,1,'active'),
('STU_0007','Lucas Torres','2009-06-18',16,'Male','Grade 10','SCH_004','Eduardo Torres','09721234000','parent.torres@gmail.com','None','None','L',4,1,'active'),
('STU_0008','Ava Aquino','2012-12-03',13,'Female','Grade 7','SCH_004','Liza Aquino','09811234000','parent.aquino@gmail.com','None','None','XS',0,1,'active'),
('STU_0009','Ethan Ramos','2010-04-27',15,'Male','Grade 9','SCH_005','Roberto Ramos','09901234000','parent.ramos@gmail.com','Asthma','None','M',2,1,'active'),
('STU_0010','Isabella Dela Cruz','2011-08-11',14,'Female','Grade 8','SCH_005','Gloria Dela Cruz','09121234000','parent.delacruz@gmail.com','None','None','S',1,1,'active'),
('STU_0011','Mason Villanueva','2009-02-19',16,'Male','Grade 10','SCH_006','Miguel Villanueva','09221234000','parent.villanueva@gmail.com','None','Seafood','L',3,1,'active'),
('STU_0012','Mia Fernandez','2012-10-07',13,'Female','Grade 7','SCH_006','Cynthia Fernandez','09321234000','parent.fernandez@gmail.com','None','None','XS',0,1,'active'),
('STU_0013','Logan Gonzales','2010-06-23',15,'Male','Grade 9','SCH_007','Ramon Gonzales','09421234000','parent.gonzales@gmail.com','None','None','M',2,1,'active'),
('STU_0014','Charlotte Castro','2011-12-14',14,'Female','Grade 8','SCH_007','Patricia Castro','09521234000','parent.castro@gmail.com','Allergic Rhinitis','Peanuts','S',1,1,'active'),
('STU_0015','Oliver Flores','2009-04-01',16,'Male','Grade 10','SCH_008','Antonio Flores','09621234000','parent.flores@gmail.com','None','None','M',4,1,'active'),
('STU_0016','Amelia Diaz','2012-09-28',13,'Female','Grade 7','SCH_008','Marisol Diaz','09721234100','parent.diaz@gmail.com','None','None','XS',0,1,'active'),
('STU_0017','Elijah Morales','2010-01-16',15,'Male','Grade 9','SCH_009','Fernando Morales','09821234000','parent.morales@gmail.com','Asthma','None','M',2,1,'active'),
('STU_0018','Harper Aguilar','2011-07-09',14,'Female','Grade 8','SCH_009','Cristina Aguilar','09921234000','parent.aguilar@gmail.com','None','None','S',1,1,'active'),
('STU_0019','James Pascual','2009-03-25',16,'Male','Grade 10','SCH_010','Rodrigo Pascual','09131234000','parent.pascual@gmail.com','None','Seafood','L',3,1,'active'),
('STU_0020','Evelyn Santos','2012-11-12',13,'Female','Grade 7','SCH_010','Rowena Santos','09231234000','parent.santos2@gmail.com','None','None','XS',0,1,'active'),
('STU_0021','Mateo Reyes','2010-05-30',15,'Male','Grade 9','SCH_011','Maria Reyes','09331234000','parent.reyes2@gmail.com','None','None','M',2,1,'active'),
('STU_0022','Aria Cruz','2011-08-17',14,'Female','Grade 8','SCH_011','Juan Cruz','09431234000','parent.cruz2@gmail.com','None','None','S',1,1,'active'),
('STU_0023','Sebastian Bautista','2009-02-04',16,'Male','Grade 10','SCH_012','Jose Bautista','09531234000','parent.bautista2@gmail.com','Allergic Rhinitis','None','M',4,1,'active'),
('STU_0024','Luna Garcia','2012-10-21',13,'Female','Grade 7','SCH_012','Ana Garcia','09631234100','parent.garcia2@gmail.com','None','Peanuts','XS',0,1,'active'),
('STU_0025','Jack Mendoza','2010-04-08',15,'Male','Grade 9','SCH_013','Carlos Mendoza','09731234000','parent.mendoza2@gmail.com','None','None','L',2,1,'active'),
('STU_0026','Chloe Torres','2011-12-25',14,'Female','Grade 8','SCH_013','Rosa Torres','09831234000','parent.torres2@gmail.com','None','None','S',1,1,'active'),
('STU_0027','Aiden Aquino','2009-06-12',16,'Male','Grade 10','SCH_014','Eduardo Aquino','09931234000','parent.aquino2@gmail.com','None','None','M',3,1,'active'),
('STU_0028','Sofia Ramos','2012-02-28',13,'Female','Grade 7','SCH_014','Liza Ramos','09141234000','parent.ramos2@gmail.com','Asthma','None','XS',0,1,'active'),
('STU_0029','Liam Dela Cruz','2010-09-15',15,'Male','Grade 9','SCH_015','Roberto Dela Cruz','09241234000','parent.delacruz2@gmail.com','None','None','M',2,1,'active'),
('STU_0030','Emma Villanueva','2011-03-03',14,'Female','Grade 8','SCH_015','Gloria Villanueva','09341234000','parent.villanueva2@gmail.com','None','Seafood','S',1,1,'active'),
('STU_0031','Noah Fernandez','2009-07-19',16,'Male','Grade 10','SCH_016','Miguel Fernandez','09441234000','parent.fernandez2@gmail.com','None','None','L',4,1,'active'),
('STU_0032','Olivia Gonzales','2012-01-06',13,'Female','Grade 7','SCH_016','Cynthia Gonzales','09541234100','parent.gonzales2@gmail.com','None','None','XS',0,1,'active'),
('STU_0033','Lucas Castro','2010-08-23',15,'Male','Grade 9','SCH_017','Ramon Castro','09641234000','parent.castro2@gmail.com','None','None','M',2,1,'active'),
('STU_0034','Ava Flores','2011-04-10',14,'Female','Grade 8','SCH_017','Patricia Flores','09741234000','parent.flores2@gmail.com','Allergic Rhinitis','Peanuts','S',1,1,'active'),
('STU_0035','Ethan Diaz','2009-12-27',16,'Male','Grade 10','SCH_018','Antonio Diaz','09841234000','parent.diaz2@gmail.com','None','None','M',3,1,'active'),
('STU_0036','Isabella Morales','2012-06-14',13,'Female','Grade 7','SCH_018','Marisol Morales','09941234000','parent.morales2@gmail.com','None','None','XS',0,1,'active'),
('STU_0037','Mason Aguilar','2010-02-01',15,'Male','Grade 9','SCH_019','Fernando Aguilar','09151234000','parent.aguilar2@gmail.com','Asthma','None','M',2,1,'active'),
('STU_0038','Mia Pascual','2011-10-18',14,'Female','Grade 8','SCH_019','Cristina Pascual','09251234000','parent.pascual2@gmail.com','None','None','S',1,1,'active'),
('STU_0039','Logan Santos','2009-05-05',16,'Male','Grade 10','SCH_020','Rodrigo Santos','09351234000','parent.santos3@gmail.com','None','Seafood','L',4,1,'active'),
('STU_0040','Charlotte Reyes','2012-11-22',13,'Female','Grade 7','SCH_020','Rowena Reyes','09451234100','parent.reyes3@gmail.com','None','None','XS',0,1,'active'),
('STU_0041','Oliver Cruz','2010-03-11',15,'Male','Grade 9','SCH_021','Maria Cruz','09551234000','parent.cruz3@gmail.com','None','None','M',2,1,'active'),
('STU_0042','Amelia Bautista','2011-09-28',14,'Female','Grade 8','SCH_021','Juan Bautista','09651234000','parent.bautista3@gmail.com','None','Peanuts','S',1,1,'active'),
('STU_0043','Elijah Garcia','2009-01-15',16,'Male','Grade 10','SCH_022','Jose Garcia','09751234000','parent.garcia3@gmail.com','None','None','M',3,1,'active'),
('STU_0044','Harper Mendoza','2012-07-02',13,'Female','Grade 7','SCH_022','Ana Mendoza','09851234000','parent.mendoza3@gmail.com','Asthma','None','XS',0,1,'active'),
('STU_0045','James Torres','2010-12-19',15,'Male','Grade 9','SCH_023','Carlos Torres','09951234000','parent.torres3@gmail.com','Allergic Rhinitis','None','L',2,1,'active'),
('STU_0046','Evelyn Aquino','2011-06-06',14,'Female','Grade 8','SCH_023','Rosa Aquino','09161234000','parent.aquino3@gmail.com','None','None','S',1,1,'active'),
('STU_0047','Mateo Ramos','2009-10-23',16,'Male','Grade 10','SCH_024','Eduardo Ramos','09261234000','parent.ramos3@gmail.com','None','Seafood','M',4,1,'active'),
('STU_0048','Aria Dela Cruz','2012-04-10',13,'Female','Grade 7','SCH_024','Liza Dela Cruz','09361234100','parent.delacruz3@gmail.com','None','None','XS',0,1,'active'),
('STU_0049','Sebastian Villanueva','2010-08-27',15,'Male','Grade 9','SCH_025','Roberto Villanueva','09461234000','parent.villanueva3@gmail.com','None','None','M',2,1,'active'),
('STU_0050','Luna Fernandez','2011-02-14',14,'Female','Grade 8','SCH_025','Gloria Fernandez','09561234000','parent.fernandez3@gmail.com','None','None','S',1,1,'active'),
('STU_0051','Jack Gonzales','2009-06-01',16,'Male','Grade 10','SCH_026','Miguel Gonzales','09661234000','parent.gonzales3@gmail.com','None','Peanuts','L',3,1,'active'),
('STU_0052','Chloe Castro','2012-12-18',13,'Female','Grade 7','SCH_026','Cynthia Castro','09761234000','parent.castro3@gmail.com','None','None','XS',0,1,'active'),
('STU_0053','Aiden Flores','2010-04-05',15,'Male','Grade 9','SCH_027','Ramon Flores','09861234000','parent.flores3@gmail.com','Asthma','None','M',2,1,'active'),
('STU_0054','Sofia Diaz','2011-10-22',14,'Female','Grade 8','SCH_027','Patricia Diaz','09961234000','parent.diaz3@gmail.com','None','None','S',1,1,'active'),
('STU_0055','Liam Morales','2009-02-09',16,'Male','Grade 10','SCH_028','Antonio Morales','09171234000','parent.morales3@gmail.com','None','None','M',4,1,'active'),
('STU_0056','Emma Aguilar','2012-08-26',13,'Female','Grade 7','SCH_028','Marisol Aguilar','09271234100','parent.aguilar3@gmail.com','Allergic Rhinitis','Peanuts','XS',0,1,'active'),
('STU_0057','Noah Pascual','2010-12-13',15,'Male','Grade 9','SCH_029','Fernando Pascual','09371234000','parent.pascual3@gmail.com','None','None','L',2,1,'active'),
('STU_0058','Olivia Santos','2011-06-30',14,'Female','Grade 8','SCH_029','Cristina Santos','09471234000','parent.santos4@gmail.com','None','Seafood','S',1,1,'active'),
('STU_0059','Lucas Reyes','2009-10-17',16,'Male','Grade 10','SCH_030','Rodrigo Reyes','09571234000','parent.reyes4@gmail.com','None','None','M',3,1,'active'),
('STU_0060','Ava Cruz','2012-04-04',13,'Female','Grade 7','SCH_030','Rowena Cruz','09671234000','parent.cruz4@gmail.com','None','None','XS',0,1,'active');

-- ── 5. Competitions ───────────────────────────────────────────
INSERT INTO competitions (id, name, season, theme, date, venue, organizer, registration_deadline, categories, number_of_teams, number_of_schools, number_of_coaches, number_of_students, status) VALUES
('COMP_001','WRO Philippines 2022 National Finals','WRO 2022','Smart Cities','2022-09-17','SMX Convention Center, Manila','WRO Philippines National Office','2022-09-01','["RoboMission – Elementary","RoboMission – Junior","RoboMission – Senior","Future Engineers","Future Innovators","RoboSports","WeDo","Advanced Robotics"]',120,55,70,280,'completed'),
('COMP_002','WRO Philippines 2023 National Finals','WRO 2023','Connecting the World','2023-09-16','World Trade Center, Pasay','WRO Philippines National Office','2023-09-01','["RoboMission – Elementary","RoboMission – Junior","RoboMission – Senior","Future Engineers","Future Innovators","RoboSports","WeDo","Advanced Robotics"]',135,62,80,310,'completed'),
('COMP_003','WRO Philippines 2024 National Finals','WRO 2024','Earth Allies','2024-09-14','Marriott Grand Ballroom, Pasay','WRO Philippines National Office','2024-09-01','["RoboMission – Elementary","RoboMission – Junior","RoboMission – Senior","Future Engineers","Future Innovators","RoboSports","WeDo","Advanced Robotics"]',148,75,92,350,'completed'),
('COMP_004','WRO Philippines 2025 National Finals','WRO 2025','Future Innovators','2025-09-20','University of Santo Tomas, Manila','WRO Philippines National Office','2025-09-01','["RoboMission – Elementary","RoboMission – Junior","RoboMission – Senior","Future Engineers","Future Innovators","RoboSports","WeDo","Advanced Robotics"]',100,50,65,220,'upcoming');

-- ── 6. Teams (30 teams) ───────────────────────────────────────
INSERT INTO teams (id, season, competition_id, team_name, category, age_group, school_id, coach_id, robot_platform, programming_language, registration_status, payment_status, qualification_status, status) VALUES
('TEAM_0001','WRO 2022','COMP_001','Team Alpha 1','RoboMission – Elementary','Elementary','SCH_001','COA_001','LEGO Mindstorms EV3','LEGO Mindstorms Software','confirmed','paid','qualified','active'),
('TEAM_0002','WRO 2023','COMP_002','Team Omega 2','RoboMission – Junior','Junior','SCH_002','COA_002','LEGO SPIKE Prime','SPIKE App','confirmed','paid','qualified','active'),
('TEAM_0003','WRO 2024','COMP_003','Team Phoenix 3','RoboMission – Senior','Senior','SCH_003','COA_003','Arduino','Python','registered','partial','pending','active'),
('TEAM_0004','WRO 2025','COMP_004','Team Vanguard 4','Future Engineers','Senior','SCH_004','COA_004','Raspberry Pi','Python','registered','unpaid','pending','active'),
('TEAM_0005','WRO 2022','COMP_001','Team Nexus 5','Future Innovators','Senior','SCH_005','COA_005','LEGO Mindstorms EV3','EV3 Classroom','confirmed','paid','qualified','active'),
('TEAM_0006','WRO 2023','COMP_002','RoboElite 6','RoboSports','Junior','SCH_006','COA_006','LEGO SPIKE Prime','Blockly','waitlisted','partial','pending','active'),
('TEAM_0007','WRO 2024','COMP_003','TechWizards 7','WeDo','Elementary','SCH_007','COA_007','LEGO SPIKE Essential','SPIKE App','confirmed','paid','qualified','active'),
('TEAM_0008','WRO 2025','COMP_004','BrainBots 8','Advanced Robotics','Senior','SCH_008','COA_008','Custom Build','C++','registered','unpaid','pending','active'),
('TEAM_0009','WRO 2022','COMP_001','InnovatorsX 9','RoboMission – Elementary','Elementary','SCH_009','COA_009','LEGO Mindstorms NXT','Scratch','confirmed','paid','qualified','active'),
('TEAM_0010','WRO 2023','COMP_002','CircuitBreakers 10','RoboMission – Junior','Junior','SCH_010','COA_010','VEX IQ','Blockly','confirmed','paid','qualified','active'),
('TEAM_0011','WRO 2024','COMP_003','ByteForce 11','RoboMission – Senior','Senior','SCH_011','COA_011','LEGO Mindstorms EV3','Python','registered','partial','pending','active'),
('TEAM_0012','WRO 2025','COMP_004','QuantumLeap 12','Future Engineers','Senior','SCH_012','COA_012','Arduino','Arduino IDE','registered','unpaid','pending','active'),
('TEAM_0013','WRO 2022','COMP_001','NanoMinds 13','Future Innovators','Senior','SCH_013','COA_013','LEGO SPIKE Prime','SPIKE App','confirmed','paid','qualified','active'),
('TEAM_0014','WRO 2023','COMP_002','TechnoKids 14','RoboSports','Junior','SCH_014','COA_014','LEGO Mindstorms EV3','EV3 Classroom','confirmed','paid','qualified','active'),
('TEAM_0015','WRO 2024','COMP_003','RoboStars 15','WeDo','Elementary','SCH_015','COA_015','LEGO SPIKE Essential','Blockly','confirmed','paid','qualified','active'),
('TEAM_0016','WRO 2025','COMP_004','FutureBots 16','Advanced Robotics','Senior','SCH_016','COA_016','Custom Build','C++','waitlisted','unpaid','pending','active'),
('TEAM_0017','WRO 2022','COMP_001','MindBenders 17','RoboMission – Elementary','Elementary','SCH_017','COA_017','LEGO Mindstorms EV3','LEGO Mindstorms Software','confirmed','paid','qualified','active'),
('TEAM_0018','WRO 2023','COMP_002','CodeCrushers 18','RoboMission – Junior','Junior','SCH_018','COA_018','VEX IQ','Python','confirmed','paid','qualified','active'),
('TEAM_0019','WRO 2024','COMP_003','RoboSapiens 19','RoboMission – Senior','Senior','SCH_019','COA_019','Arduino','C++','registered','partial','pending','active'),
('TEAM_0020','WRO 2025','COMP_004','Techsmiths 20','Future Engineers','Senior','SCH_020','COA_020','Raspberry Pi','Python','registered','unpaid','pending','active'),
('TEAM_0021','WRO 2022','COMP_001','Team Alpha 21','Future Innovators','Senior','SCH_021','COA_021','LEGO Mindstorms EV3','EV3 Classroom','confirmed','paid','qualified','active'),
('TEAM_0022','WRO 2023','COMP_002','Team Omega 22','RoboSports','Junior','SCH_022','COA_022','LEGO SPIKE Prime','Blockly','confirmed','paid','qualified','active'),
('TEAM_0023','WRO 2024','COMP_003','Team Phoenix 23','WeDo','Elementary','SCH_023','COA_023','LEGO SPIKE Essential','SPIKE App','confirmed','paid','qualified','active'),
('TEAM_0024','WRO 2025','COMP_004','Team Vanguard 24','Advanced Robotics','Senior','SCH_024','COA_024','Custom Build','C++','registered','unpaid','pending','active'),
('TEAM_0025','WRO 2022','COMP_001','Team Nexus 25','RoboMission – Elementary','Elementary','SCH_025','COA_025','LEGO Mindstorms NXT','Scratch','confirmed','paid','qualified','active'),
('TEAM_0026','WRO 2023','COMP_002','RoboElite 26','RoboMission – Junior','Junior','SCH_026','COA_026','LEGO Mindstorms EV3','LEGO Mindstorms Software','confirmed','paid','qualified','active'),
('TEAM_0027','WRO 2024','COMP_003','TechWizards 27','RoboMission – Senior','Senior','SCH_027','COA_027','LEGO SPIKE Prime','Python','registered','partial','pending','active'),
('TEAM_0028','WRO 2025','COMP_004','BrainBots 28','Future Engineers','Senior','SCH_028','COA_028','Arduino','Arduino IDE','registered','unpaid','pending','active'),
('TEAM_0029','WRO 2022','COMP_001','InnovatorsX 29','Future Innovators','Senior','SCH_029','COA_029','Raspberry Pi','Python','confirmed','paid','qualified','active'),
('TEAM_0030','WRO 2023','COMP_002','CircuitBreakers 30','RoboSports','Junior','SCH_030','COA_030','VEX IQ','Blockly','confirmed','paid','qualified','active');

-- ── Team Members ──────────────────────────────────────────────
INSERT INTO team_members (team_id, student_id) VALUES
('TEAM_0001','STU_0001'),('TEAM_0001','STU_0002'),
('TEAM_0002','STU_0003'),('TEAM_0002','STU_0004'),
('TEAM_0003','STU_0005'),('TEAM_0003','STU_0006'),
('TEAM_0004','STU_0007'),('TEAM_0004','STU_0008'),
('TEAM_0005','STU_0009'),('TEAM_0005','STU_0010'),
('TEAM_0006','STU_0011'),('TEAM_0006','STU_0012'),
('TEAM_0007','STU_0013'),('TEAM_0007','STU_0014'),
('TEAM_0008','STU_0015'),('TEAM_0008','STU_0016'),
('TEAM_0009','STU_0017'),('TEAM_0009','STU_0018'),
('TEAM_0010','STU_0019'),('TEAM_0010','STU_0020'),
('TEAM_0011','STU_0021'),('TEAM_0011','STU_0022'),
('TEAM_0012','STU_0023'),('TEAM_0012','STU_0024'),
('TEAM_0013','STU_0025'),('TEAM_0013','STU_0026'),
('TEAM_0014','STU_0027'),('TEAM_0014','STU_0028'),
('TEAM_0015','STU_0029'),('TEAM_0015','STU_0030'),
('TEAM_0016','STU_0031'),('TEAM_0016','STU_0032'),
('TEAM_0017','STU_0033'),('TEAM_0017','STU_0034'),
('TEAM_0018','STU_0035'),('TEAM_0018','STU_0036'),
('TEAM_0019','STU_0037'),('TEAM_0019','STU_0038'),
('TEAM_0020','STU_0039'),('TEAM_0020','STU_0040'),
('TEAM_0021','STU_0041'),('TEAM_0021','STU_0042'),
('TEAM_0022','STU_0043'),('TEAM_0022','STU_0044'),
('TEAM_0023','STU_0045'),('TEAM_0023','STU_0046'),
('TEAM_0024','STU_0047'),('TEAM_0024','STU_0048'),
('TEAM_0025','STU_0049'),('TEAM_0025','STU_0050'),
('TEAM_0026','STU_0051'),('TEAM_0026','STU_0052'),
('TEAM_0027','STU_0053'),('TEAM_0027','STU_0054'),
('TEAM_0028','STU_0055'),('TEAM_0028','STU_0056'),
('TEAM_0029','STU_0057'),('TEAM_0029','STU_0058'),
('TEAM_0030','STU_0059'),('TEAM_0030','STU_0060');

-- ── 7. Judges (Master Data) ───────────────────────────────────
INSERT INTO judges (id, full_name, contact_number, gender, season, judging_category, status) VALUES
('JDG_0001', 'Dr. Jose Reyes', '09171112222', 'Male', 'WRO 2024', 'RoboMission – Elementary', 'active'),
('JDG_0002', 'Engr. Maria Santos', '09182223333', 'Female', 'WRO 2024', 'RoboMission – Junior', 'active'),
('JDG_0003', 'Prof. Carlos Bautista', '09193334444', 'Male', 'WRO 2024', 'RoboMission – Senior', 'active'),
('JDG_0004', 'Dr. Ana Cruz', '09204445555', 'Female', 'WRO 2024', 'Future Innovators', 'active'),
('JDG_0005', 'Engr. Roberto Torres', '09215556666', 'Male', 'WRO 2024', 'WeDo', 'active'),
('JDG_0006', 'Dr. Miguel Rivera', '09226667777', 'Male', 'WRO 2024', 'RoboSports', 'active'),
('JDG_0007', 'Engr. Sofia Villanueva', '09237778888', 'Female', 'WRO 2024', 'Advanced Robotics', 'active'),
('JDG_0008', 'Prof. Ricardo Go', '09248889999', 'Male', 'WRO 2025', 'Future Engineers', 'active'),
('JDG_0009', 'Dr. Leni Ramos', '09259990000', 'Female', 'WRO 2025', 'RoboMission – Elementary', 'active'),
('JDG_0010', 'Engr. Paulo Diaz', '09260001111', 'Male', 'WRO 2025', 'RoboMission – Junior', 'active'),
('JDG_0011', 'Prof. Elena Marcos', '09271112222', 'Female', 'WRO 2025', 'RoboMission – Senior', 'active'),
('JDG_0012', 'Dr. Vic Sotto', '09282223333', 'Male', 'WRO 2025', 'Future Innovators', 'active'),
('JDG_0013', 'Engr. Pia Alonzo', '09293334444', 'Female', 'WRO 2025', 'WeDo', 'active'),
('JDG_0014', 'Prof. Martin Nievera', '09304445555', 'Male', 'WRO 2025', 'RoboSports', 'active'),
('JDG_0015', 'Dr. Lea Salonga', '09315556666', 'Female', 'WRO 2025', 'Advanced Robotics', 'active');

-- ── 8. Awards (15 awards) ─────────────────────────────────────
INSERT INTO awards (id, team_id, school_id, coach_id, category, award, year, event, has_trophy, has_medal, has_certificate, status) VALUES
('AWD_0001','TEAM_0001','SCH_001','COA_001','RoboMission – Elementary','Champion',2022,'WRO Philippines 2022 National Finals',1,1,1,'confirmed'),
('AWD_0002','TEAM_0002','SCH_002','COA_002','RoboMission – Junior','1st Runner-up',2023,'WRO Philippines 2023 National Finals',1,1,1,'confirmed'),
('AWD_0003','TEAM_0003','SCH_003','COA_003','RoboMission – Senior','2nd Runner-up',2024,'WRO Philippines 2024 National Finals',0,1,1,'confirmed'),
('AWD_0004','TEAM_0005','SCH_005','COA_005','Future Innovators','Best Robot Design',2022,'WRO Philippines 2022 National Finals',0,1,1,'confirmed'),
('AWD_0005','TEAM_0007','SCH_007','COA_007','WeDo','Best Programming',2024,'WRO Philippines 2024 National Finals',0,1,1,'confirmed'),
('AWD_0006','TEAM_0009','SCH_009','COA_009','RoboMission – Elementary','Best Teamwork',2022,'WRO Philippines 2022 National Finals',0,1,1,'confirmed'),
('AWD_0007','TEAM_0010','SCH_010','COA_010','RoboMission – Junior','Champion',2023,'WRO Philippines 2023 National Finals',1,1,1,'confirmed'),
('AWD_0008','TEAM_0013','SCH_013','COA_013','Future Innovators','Best Presentation',2022,'WRO Philippines 2022 National Finals',0,0,1,'confirmed'),
('AWD_0009','TEAM_0014','SCH_014','COA_014','RoboSports','Most Creative',2023,'WRO Philippines 2023 National Finals',0,0,1,'confirmed'),
('AWD_0010','TEAM_0015','SCH_015','COA_015','WeDo','Best Rookie Team',2024,'WRO Philippines 2024 National Finals',0,0,1,'confirmed'),
('AWD_0011','TEAM_0017','SCH_017','COA_017','RoboMission – Elementary','Special Award',2022,'WRO Philippines 2022 National Finals',0,0,1,'confirmed'),
('AWD_0012','TEAM_0018','SCH_018','COA_018','RoboMission – Junior','Certificate of Participation',2023,'WRO Philippines 2023 National Finals',0,0,1,'confirmed'),
('AWD_0013','TEAM_0021','SCH_021','COA_021','Future Innovators','1st Runner-up',2022,'WRO Philippines 2022 National Finals',1,1,1,'confirmed'),
('AWD_0014','TEAM_0022','SCH_022','COA_022','RoboSports','2nd Runner-up',2023,'WRO Philippines 2023 National Finals',0,1,1,'confirmed'),
('AWD_0015','TEAM_0025','SCH_025','COA_025','RoboMission – Elementary','Best Robot Design',2022,'WRO Philippines 2022 National Finals',0,1,1,'confirmed');

-- ── 9. Payments ───────────────────────────────────────────────
INSERT INTO payments (id, team_id, school_id, registration_fee, amount_paid, balance, payment_date, payment_method, or_number, sponsorship, scholarship, status) VALUES
('PAY_0001','TEAM_0001','SCH_001',3500.00,3500.00,0.00,'2025-03-15','GCash','OR-45231',0,'None','paid'),
('PAY_0002','TEAM_0002','SCH_002',4000.00,4000.00,0.00,'2025-04-02','Bank Transfer','OR-67892',1000,'None','paid'),
('PAY_0003','TEAM_0003','SCH_003',3000.00,1500.00,1500.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0004','TEAM_0004','SCH_004',5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0005','TEAM_0005','SCH_005',3500.00,3500.00,0.00,'2025-02-28','Maya','OR-89012',2000,'Full','paid'),
('PAY_0006','TEAM_0006','SCH_006',4000.00,2000.00,2000.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0007','TEAM_0007','SCH_007',3000.00,3000.00,0.00,'2025-05-10','Cash','OR-12345',0,'None','paid'),
('PAY_0008','TEAM_0008','SCH_008',5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0009','TEAM_0009','SCH_009',3500.00,3500.00,0.00,'2025-01-20','GCash','OR-23456',1000,'None','paid'),
('PAY_0010','TEAM_0010','SCH_010',4000.00,4000.00,0.00,'2025-03-08','Online Payment','OR-34567',0,'None','paid'),
('PAY_0011','TEAM_0011','SCH_011',3000.00,1500.00,1500.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0012','TEAM_0012','SCH_012',5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0013','TEAM_0013','SCH_013',3500.00,3500.00,0.00,'2025-04-15','Bank Transfer','OR-45678',2000,'Full','paid'),
('PAY_0014','TEAM_0014','SCH_014',4000.00,4000.00,0.00,'2025-02-14','Check','OR-56789',0,'None','paid'),
('PAY_0015','TEAM_0015','SCH_015',3000.00,3000.00,0.00,'2025-06-01','GCash','OR-67890',0,'None','paid'),
('PAY_0016','TEAM_0016','SCH_016',5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0017','TEAM_0017','SCH_017',3500.00,3500.00,0.00,'2025-03-22','Maya','OR-78901',1000,'None','paid'),
('PAY_0018','TEAM_0018','SCH_018',4000.00,4000.00,0.00,'2025-05-05','Online Payment','OR-89012',0,'None','paid'),
('PAY_0019','TEAM_0019','SCH_019',3000.00,1500.00,1500.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0020','TEAM_0020','SCH_020',5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0021','TEAM_0021','SCH_021',3500.00,3500.00,0.00,'2025-01-30','Cash','OR-90123',0,'None','paid'),
('PAY_0022','TEAM_0022','SCH_022',4000.00,4000.00,0.00,'2025-04-18','Bank Transfer','OR-01234',2000,'Full','paid'),
('PAY_0023','TEAM_0023','SCH_023',3000.00,3000.00,0.00,'2025-06-15','GCash','OR-12345',0,'None','paid'),
('PAY_0024','TEAM_0024','SCH_024',5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0025','TEAM_0025','SCH_025',3500.00,3500.00,0.00,'2025-02-10','Maya','OR-23456',1000,'None','paid'),
('PAY_0026','TEAM_0026','SCH_026',4000.00,4000.00,0.00,'2025-03-28','Online Payment','OR-34567',0,'None','paid'),
('PAY_0027','TEAM_0027','SCH_027',3000.00,1500.00,1500.00,NULL,NULL,NULL,0,'None','partial'),
('PAY_0028','TEAM_0028','SCH_028',5000.00,0.00,5000.00,NULL,NULL,NULL,0,'None','unpaid'),
('PAY_0029','TEAM_0029','SCH_029',3500.00,3500.00,0.00,'2025-05-20','GCash','OR-45678',0,'None','paid'),
('PAY_0030','TEAM_0030','SCH_030',4000.00,4000.00,0.00,'2025-04-25','Cash','OR-56789',1000,'None','paid');

-- ── 10. Communications ────────────────────────────────────────
INSERT INTO communications (id, team_id, registration_confirmation, payment_confirmation, certificate_sent, email_history, sms_history, announcement_received, feedback_submitted, status) VALUES
('COM_0001','TEAM_0001',1,1,1,'[{"date":"2025-07-01","subject":"Registration Confirmed","to":"coa_001@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0002','TEAM_0002',1,1,0,'[{"date":"2025-07-02","subject":"Registration Confirmed","to":"coa_002@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0003','TEAM_0003',1,0,0,'[{"date":"2025-07-03","subject":"Registration Confirmed","to":"coa_003@school.edu.ph","status":"delivered"}]','[]',1,0,'active'),
('COM_0004','TEAM_0004',1,0,0,'[{"date":"2025-07-04","subject":"Registration Confirmed","to":"coa_004@school.edu.ph","status":"delivered"}]','[]',1,0,'active'),
('COM_0005','TEAM_0005',1,1,1,'[{"date":"2025-07-05","subject":"Registration Confirmed","to":"coa_005@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0006','TEAM_0006',1,0,0,'[{"date":"2025-07-06","subject":"Registration Confirmed","to":"coa_006@school.edu.ph","status":"delivered"}]','[]',1,0,'active'),
('COM_0007','TEAM_0007',1,1,0,'[{"date":"2025-07-07","subject":"Registration Confirmed","to":"coa_007@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0008','TEAM_0008',1,0,0,'[{"date":"2025-07-08","subject":"Registration Confirmed","to":"coa_008@school.edu.ph","status":"delivered"}]','[]',1,0,'active'),
('COM_0009','TEAM_0009',1,1,1,'[{"date":"2025-07-09","subject":"Registration Confirmed","to":"coa_009@school.edu.ph","status":"delivered"}]','[]',1,1,'active'),
('COM_0010','TEAM_0010',1,1,0,'[{"date":"2025-07-10","subject":"Registration Confirmed","to":"coa_010@school.edu.ph","status":"delivered"}]','[]',1,1,'active');

-- ── 11. Delegation ────────────────────────────────────────────
INSERT INTO delegation (id, team_id, destination_country, wro_year, passport_status, passport_expiry, visa_status, parent_consent, flight, hotel, dietary_restrictions, shirt_size, emergency_contact, status) VALUES
('DEL_001','TEAM_0001','Turkey',2024,'approved','2027-12-31','approved',1,'PAL - MNL-IST','Marriott Hotel','None','M','09181234567','confirmed'),
('DEL_002','TEAM_0002','Germany',2024,'processing','2027-12-31','applied',1,'Singapore Airlines - MNL-FRA','Hilton Hotel','None','L','09271234567','confirmed'),
('DEL_003','TEAM_0005','Indonesia',2024,'submitted','2027-12-31','not required',1,'Cebu Pacific - MNL-CGK','Novotel Hotel','Halal','S','09541234567','confirmed'),
('DEL_004','TEAM_0007','Thailand',2024,'approved','2027-12-31','approved',1,'PAL - MNL-IST','Holiday Inn Hotel','None','M','09721234567','confirmed'),
('DEL_005','TEAM_0009','Japan',2025,'approved','2027-12-31','approved',1,'Singapore Airlines - MNL-FRA','Marriott Hotel','None','M','09901234567','confirmed'),
('DEL_006','TEAM_0010','South Korea',2025,'processing','2027-12-31','applied',1,'PAL - MNL-CGK','Hilton Hotel','Vegetarian','S','09121234567','confirmed'),
('DEL_007','TEAM_0013','Brazil',2025,'submitted','2027-12-31','not required',1,'Cebu Pacific - MNL-IST','Novotel Hotel','None','L','09421234567','confirmed'),
('DEL_008','TEAM_0014','USA',2025,'approved','2027-12-31','approved',1,'PAL - MNL-FRA','Holiday Inn Hotel','None','M','09521234567','confirmed');

SET FOREIGN_KEY_CHECKS = 1;

-- Verify seed
SELECT 'Seed complete!' AS status;
SELECT 'Users' AS tbl, COUNT(*) AS cnt FROM users
UNION ALL SELECT 'Schools', COUNT(*) FROM schools
UNION ALL SELECT 'Coaches', COUNT(*) FROM coaches
UNION ALL SELECT 'Students', COUNT(*) FROM students
UNION ALL SELECT 'Competitions', COUNT(*) FROM competitions
UNION ALL SELECT 'Teams', COUNT(*) FROM teams
UNION ALL SELECT 'Team Members', COUNT(*) FROM team_members
UNION ALL SELECT 'Judges', COUNT(*) FROM judges
UNION ALL SELECT 'Awards', COUNT(*) FROM awards
UNION ALL SELECT 'Payments', COUNT(*) FROM payments
UNION ALL SELECT 'Communications', COUNT(*) FROM communications
UNION ALL SELECT 'Delegation', COUNT(*) FROM delegation;
