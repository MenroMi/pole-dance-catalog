/*
  Warnings:

  - You are about to drop the column `coachNote` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `entry` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `gripType` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `stepsData` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Move` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Tag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name_pl]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name_en]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title_en` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title_pl` to the `Move` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_en` to the `Tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_pl` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Tag_name_key";

-- AlterTable
ALTER TABLE "Move" DROP COLUMN "coachNote",
DROP COLUMN "description",
DROP COLUMN "entry",
DROP COLUMN "gripType",
DROP COLUMN "stepsData",
DROP COLUMN "title",
ADD COLUMN     "coachNote_en" TEXT,
ADD COLUMN     "coachNote_pl" TEXT,
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "description_pl" TEXT,
ADD COLUMN     "entry_en" TEXT,
ADD COLUMN     "entry_pl" TEXT,
ADD COLUMN     "gripType_en" TEXT,
ADD COLUMN     "gripType_pl" TEXT,
ADD COLUMN     "stepsData_en" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "stepsData_pl" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "title_en" TEXT NOT NULL,
ADD COLUMN     "title_pl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'pl';

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "name",
ADD COLUMN     "name_en" TEXT NOT NULL,
ADD COLUMN     "name_pl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'pl';

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_pl_key" ON "Tag"("name_pl");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_en_key" ON "Tag"("name_en");
