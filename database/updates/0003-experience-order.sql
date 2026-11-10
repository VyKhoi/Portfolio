-- Newest first by end date: ChickenNote (2026 - now) right after the current job.
UPDATE "Experiences" SET "Order" = 2 WHERE "ProjectName" = 'ChickenNote';
UPDATE "Experiences" SET "Order" = 3 WHERE "ProjectName" LIKE 'CRM/POS%';
UPDATE "Experiences" SET "Order" = 4 WHERE "Company" LIKE 'AEGONA%';
