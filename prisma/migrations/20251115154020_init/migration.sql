-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'RECRUITER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "headline" TEXT,
    "linkedin_id" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "company_id" TEXT,
    "description" TEXT,
    "requirements" TEXT,
    "city" TEXT,
    "country" TEXT,
    "full_address" TEXT,
    "external_url" TEXT,
    "date_posted" TIMESTAMP(3),
    "date_created" TIMESTAMP(3),
    "category" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_integrated_job" BOOLEAN NOT NULL DEFAULT false,
    "poster_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_import_logs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_job_id" TEXT,
    "external_url" TEXT,
    "raw_payload" JSONB,
    "status" TEXT,
    "message" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE INDEX "jobs_category_idx" ON "jobs"("category");

-- CreateIndex
CREATE INDEX "jobs_city_idx" ON "jobs"("city");

-- CreateIndex
CREATE INDEX "jobs_country_idx" ON "jobs"("country");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_source_sourceId_unique" ON "jobs"("source", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_scores_user_job_unique" ON "match_scores"("user_id", "job_id");

-- CreateIndex
CREATE INDEX "job_import_logs_provider_idx" ON "job_import_logs"("provider", "provider_job_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
