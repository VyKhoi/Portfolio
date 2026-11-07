-- Clearer labels: the model skipped "Lives in" and missed the years of experience in "Summary".
UPDATE "AssistantFacts" SET
  "Label" = 'Career',
  "ValueVi" = 'Software Engineer, 3 năm kinh nghiệm, chủ yếu .NET',
  "ValueEn" = 'Software Engineer, 3 years of experience, mostly .NET'
WHERE "Key" = 'summary';

UPDATE "AssistantFacts" SET
  "Label" = 'Current location',
  "ValueEn" = 'Gò Vấp, TP.HCM (Go Vap, Ho Chi Minh City)'
WHERE "Key" = 'location';
