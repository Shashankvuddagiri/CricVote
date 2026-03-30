/* 2024-11-06 23:40:44 [3 ms] */ 
SELECT * FROM users_customuser LIMIT 100;
/* 2024-11-07 00:07:12 [3 ms] */ 
SELECT * FROM teams_team LIMIT 100;
/* 2024-11-07 00:07:18 [23 ms] */ 
DELETE FROM "teams_team" WHERE "id"=3;
/* 2024-11-07 00:07:42 [4 ms] */ 
DELETE FROM "teams_membership" WHERE "id"=2;
/* 2024-11-07 00:07:49 [8 ms] */ 
DELETE FROM "teams_team" WHERE "id"=3;
/* 2024-11-07 00:08:05 [4 ms] */ 
SELECT * FROM teams_team LIMIT 100;
/* 2024-11-07 00:08:46 [8 ms] */ 
DELETE FROM "teams_team" WHERE "id"=1;
/* 2024-11-07 00:08:53 [6 ms] */ 
DELETE FROM "teams_membership" WHERE "id"=1;
/* 2024-11-07 00:09:02 [9 ms] */ 
DELETE FROM "teams_team" WHERE "id"=1;
/* 2024-11-07 00:09:04 [4 ms] */ 
SELECT * FROM teams_team LIMIT 100;
/* 2024-11-07 12:20:36 [22 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-07 16:41:16 [5 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id"=2;
/* 2024-11-07 16:41:17 [5 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-07 20:44:16 [7 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id" IN (14,13,12,11,10,9,8,7,6,5,4);
/* 2024-11-07 20:44:18 [4 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-07 20:51:31 [6 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id" IN (16,15,3,1);
/* 2024-11-07 20:51:31 [4 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-07 23:59:51 [4 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-08 17:33:03 [3 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-08 17:33:21 [7 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id" IN (25,21,22,23,20,19);
/* 2024-11-08 17:33:21 [4 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-08 17:33:29 [3 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id"=24;
/* 2024-11-08 17:33:29 [3 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-08 18:34:51 [5 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id" IN (27,26);
/* 2024-11-08 18:34:52 [6 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-08 18:51:05 [7 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id"=28;
/* 2024-11-08 18:52:20 [4 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-08 20:17:01 [6 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id"=30;
/* 2024-11-08 20:17:03 [4 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-08 20:18:03 [4 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id"=29;
/* 2024-11-08 20:18:03 [5 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-08 20:32:29 [4 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id" IN (31,18,17);
/* 2024-11-08 20:32:31 [5 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-11 21:17:22 [5 ms] */ 
DELETE FROM "policies_and_procedures_policyandprocedure" WHERE "id" IN (38,null,32,33,34,35,36,37);
/* 2024-11-11 21:17:24 [3 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-12 13:07:45 [5 ms] */ 
SELECT * FROM axes_accessattempt LIMIT 100;
/* 2024-11-12 13:07:48 [4 ms] */ 
SELECT * FROM axes_accessfailurelog LIMIT 100;
/* 2024-11-12 14:43:33 [5 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:27:30 [3 ms] */ 
UPDATE "regulatory_compliance_complianceitem" SET "name"='Core Federal and State Law Policies and Procedures',"description"='Are all required federal and state policies up to date?' WHERE "id" is NULL;
/* 2024-11-12 17:27:59 [2 ms] */ 
UPDATE "regulatory_compliance_complianceitem" SET "id"=1,"description"='Are all required federal and state policies up to date?',"name"='Core Federal and State Law Policies and Procedures' WHERE "id" is NULL;
/* 2024-11-12 17:28:07 [2 ms] */ 
UPDATE "regulatory_compliance_complianceitem" SET "id"=1,"description"='Are all required federal and state policies up to date?',"name"='Core Federal and State Law Policies and Procedures',"created_at"='2024-11-12 00:00:00' WHERE "id" is NULL;
/* 2024-11-12 17:28:44 [2 ms] */ 
UPDATE "regulatory_compliance_complianceitem" SET "id"=1,"description"='Are all required federal and state policies up to date?',"name"='Core Federal and State Law Policies and Procedures',"created_at"='2024-11-12 17:28:00' WHERE "id" is NULL;
/* 2024-11-12 17:28:54 [6 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:29:38 [2 ms] */ 
UPDATE "regulatory_compliance_complianceitem" SET "id"=1,"description"='Are all required federal and state policies up to date?',"name"='Core Federal and State Law Policies and Procedures',"created_at"='2024-11-12 17:29:00' WHERE "id" is NULL;
/* 2024-11-12 17:29:47 [7 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:33:31 [6 ms] */ 
INSERT INTO "regulatory_compliance_complianceitem"("id","name","description","created_at") VALUES(1,'Core Federal and State Law Policies and Procedures','Are all required federal and state policies up to date?','2024-11-12 17:33:03');
/* 2024-11-12 17:33:31 [5 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:34:01 [5 ms] */ 
INSERT INTO "regulatory_compliance_complianceitem"("id","name","description","created_at") VALUES(2,'Marketing Protocols','Are all marketing efforts compliant with regulations?','2024-11-12 17:33:56');
/* 2024-11-12 17:34:01 [3 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:34:23 [5 ms] */ 
INSERT INTO "regulatory_compliance_complianceitem"("id","name","description","created_at") VALUES(3,'Training','Is there regular compliance training for staff?','2024-11-12 17:34:21');
/* 2024-11-12 17:34:23 [4 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:34:56 [6 ms] */ 
INSERT INTO "regulatory_compliance_complianceitem"("id","description","name","created_at") VALUES(4,'Is senior management actively involved in compliance?','Senior Management Awareness','2024-11-12 17:34:54');
/* 2024-11-12 17:34:56 [5 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:35:22 [5 ms] */ 
INSERT INTO "regulatory_compliance_complianceitem"("id","description","name","created_at") VALUES(5,'Are user agreements and consents well-documented?','Agreements and Consents','2024-11-12 17:35:20');
/* 2024-11-12 17:35:22 [4 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:35:38 [5 ms] */ 
INSERT INTO "regulatory_compliance_complianceitem"("id","name","description","created_at") VALUES(6,'Complaint Management','Are complaints tracked and resolved promptly?','2024-11-12 17:35:37');
/* 2024-11-12 17:35:38 [4 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 17:35:57 [3 ms] */ 
INSERT INTO "regulatory_compliance_complianceitem"("id","name","description","created_at") VALUES(7,'Licensing Assessment','Are all licenses up-to-date across regions?','2024-11-12 17:35:56');
/* 2024-11-12 17:35:57 [5 ms] */ 
SELECT * FROM regulatory_compliance_complianceitem LIMIT 100;
/* 2024-11-12 23:59:02 [3 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-13 16:19:16 [7 ms] */ 
DELETE FROM "regulatory_compliance_compliancescore" WHERE "id" IN (null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64);
/* 2024-11-13 16:19:17 [5 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-13 16:39:00 [2 ms] */ 
DELETE FROM "regulatory_compliance_compliancescore" WHERE "id" is NULL;
/* 2024-11-13 16:39:08 [7 ms] */ 
DELETE FROM "regulatory_compliance_compliancescore" WHERE "id" IN (null,66,67,68,69,70,71,72,73,74,75,76,65);
/* 2024-11-13 16:39:08 [3 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-13 17:16:48 [10 ms] */ 
DELETE FROM "regulatory_compliance_compliancescore" WHERE "id" IN (null,77,78,79,80,81,82);
/* 2024-11-13 17:16:50 [12 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-13 17:24:34 [6 ms] */ 
DELETE FROM "regulatory_compliance_compliancescore" WHERE "id"=83;
/* 2024-11-13 17:26:28 [3 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-13 17:47:43 [8 ms] */ 
DELETE FROM "regulatory_compliance_compliancescore" WHERE "id" IN (99,98,97,null,84,85,86,87,88,89,90,91,92,93,94,95,96);
/* 2024-11-13 17:47:43 [4 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-14 23:17:33 [4 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-15 00:31:37 [5 ms] */ 
DELETE FROM "regulatory_compliance_compliancescore" WHERE "id" IN (null,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,173,174,175,176,177,178,179,180,181,182);
/* 2024-11-15 00:31:37 [3 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-15 01:09:08 [8 ms] */ 
DELETE FROM "regulatory_compliance_compliancescore" WHERE "id" IN (null,183,184,185,186,187,188,189);
/* 2024-11-15 01:09:08 [4 ms] */ 
SELECT * FROM regulatory_compliance_compliancescore LIMIT 100;
/* 2024-11-15 17:50:45 [25 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
/* 2024-11-15 18:06:36 [5 ms] */ 
SELECT * FROM teams_team LIMIT 100;
/* 2024-11-15 18:06:50 [13 ms] */ 
INSERT INTO "teams_team"("billing_details_last_changed","created_at","updated_at","name","slug","s3_bucket_name") VALUES('2024-11-07 06:33:11.810211+00','2024-11-07 06:33:11.812381+00','2024-11-07 06:33:13.112606+00','Cross River Bank','cross-river-bank','complisun-dev-cross-river-bank-5f326a');
/* 2024-11-15 18:06:57 [7 ms] */ 
SELECT * FROM teams_team LIMIT 100;
/* 2024-11-15 18:07:11 [12 ms] */ 
UPDATE "teams_team" SET "s3_bucket_name"='complisun-dev-cross-river-bank-5f326a' WHERE "id"=4;
/* 2024-11-15 18:07:11 [3 ms] */ 
SELECT * FROM teams_team LIMIT 100;
/* 2024-11-15 20:31:20 [28 ms] */ 
SELECT * FROM policies_and_procedures_policyandprocedure LIMIT 100;
