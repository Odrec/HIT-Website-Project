-- Title vocabulary used by the Melder + Dozent title fields.
-- Admin-managed; Melder.title and Lecturer.title stay free-text, this table
-- only drives the suggestion dropdown in the respective forms.

CREATE TABLE "titles" (
    "id"        TEXT NOT NULL,
    "value"     VARCHAR(50) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "titles_value_key" ON "titles" ("value");

-- Seed the common academic / employment titles that recur across HIT
-- submissions. Admins can reorder or extend via /admin/titles.
INSERT INTO "titles" ("id", "value", "sortOrder", "updatedAt") VALUES
    ('title_prof_dr',   'Prof. Dr.',   10, CURRENT_TIMESTAMP),
    ('title_prof',      'Prof.',       20, CURRENT_TIMESTAMP),
    ('title_dr',        'Dr.',         30, CURRENT_TIMESTAMP),
    ('title_dipl_ing',  'Dipl.-Ing.',  40, CURRENT_TIMESTAMP),
    ('title_ma',        'M.A.',        50, CURRENT_TIMESTAMP),
    ('title_msc',       'M.Sc.',       60, CURRENT_TIMESTAMP),
    ('title_ba',        'B.A.',        70, CURRENT_TIMESTAMP),
    ('title_bsc',       'B.Sc.',       80, CURRENT_TIMESTAMP)
ON CONFLICT ("value") DO NOTHING;