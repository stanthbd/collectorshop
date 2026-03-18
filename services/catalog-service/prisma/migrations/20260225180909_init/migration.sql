-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('EN_ATTENTE_MODERATION', 'REJETE_AUTO', 'EN_ATTENTE_ADMIN', 'REFUSE', 'PUBLIE');

-- CreateEnum
CREATE TYPE "ContentCheckStatus" AS ENUM ('OK', 'KO');

-- CreateEnum
CREATE TYPE "ModerationDecision" AS ENUM ('APPROVE', 'REFUSE');

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'EN_ATTENTE_MODERATION',
    "contentCheckStatus" "ContentCheckStatus",
    "contentCheckReasons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_moderations" (
    "id" UUID NOT NULL,
    "articleId" UUID NOT NULL,
    "adminId" UUID NOT NULL,
    "decision" "ModerationDecision" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_moderations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "article_moderations" ADD CONSTRAINT "article_moderations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
