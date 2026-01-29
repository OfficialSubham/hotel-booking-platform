-- AlterTable
ALTER TABLE "Hotels" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reviews" ALTER COLUMN "comment" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;
