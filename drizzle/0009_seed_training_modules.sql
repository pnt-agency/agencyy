-- Seeds the five training modules that used to be a hardcoded array in
-- components/member/training-view.tsx, so the curriculum survives the move to
-- the database without an admin retyping it.
--
-- Modules land unpublished with no video: the /videos/*.mp4 files the old code
-- pointed at never existed, so there is nothing to migrate. An admin uploads a
-- video and publishes each module from /admin/training.
--
-- Idempotent on position, which is unique — re-running changes nothing.

INSERT INTO "training_modules" ("position", "title", "description", "published") VALUES
  (1, 'Integrity at Work', 'Understanding how to do the right thing when no one is watching. Building trust through honesty.', false),
  (2, 'Stewardship and Responsibility', 'Treating your client''s business as if it were your own. Taking ownership of tasks.', false),
  (3, 'Excellence and Timeliness', 'Delivering outstanding results and respecting deadlines. The difference between good and great.', false),
  (4, 'Honest Communication', 'Proactive communication, setting expectations, and how to deliver bad news respectfully.', false),
  (5, 'Client Relationship and Confidentiality', 'Protecting client data, maintaining professional boundaries, and ensuring privacy.', false)
ON CONFLICT ("position") DO NOTHING;
--> statement-breakpoint
INSERT INTO "training_questions" ("module_id", "position", "prompt", "options")
SELECT m."id", 1, q."prompt", q."options"::jsonb
FROM (VALUES
  (1, 'Which of the following best describes integrity at work?', '["Doing the right thing when no one is watching","Working as fast as possible","Never making a mistake"]'),
  (2, 'What is the core principle of stewardship?', '["Taking ownership of your tasks","Passing blame to others","Working only required hours"]'),
  (3, 'How should you handle deadlines?', '["Respect them and communicate delays early","Ignore them","Deliver poor quality work to meet them"]'),
  (4, 'When delivering bad news, you should:', '["Be proactive and respectful","Hide it from the client","Blame your coworkers"]'),
  (5, 'How should you treat client data?', '["With strict confidentiality","Share it with friends","Post it on social media"]')
) AS q("position", "prompt", "options")
JOIN "training_modules" m ON m."position" = q."position"
-- Guard makes the whole migration safe to re-run: without it a second pass
-- would duplicate every question.
WHERE NOT EXISTS (
  SELECT 1 FROM "training_questions" tq WHERE tq."module_id" = m."id"
);
