ALTER TABLE "Collection"
ADD COLUMN "slug" TEXT;

WITH bases AS (
  SELECT
    id,
    "userId",
    TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')) AS base
  FROM "Collection"
), ranked AS (
  SELECT
    id,
    "userId",
    CASE WHEN base = '' THEN 'collection' ELSE base END AS base,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", CASE WHEN base = '' THEN 'collection' ELSE base END
      ORDER BY id
    ) AS rn
  FROM bases
)
UPDATE "Collection" AS c
SET "slug" = CASE WHEN ranked.rn = 1 THEN ranked.base ELSE ranked.base || '-' || ranked.rn END
FROM ranked
WHERE ranked.id = c.id;

ALTER TABLE "Collection"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Collection_userId_slug_key"
ON "Collection"("userId", "slug");
