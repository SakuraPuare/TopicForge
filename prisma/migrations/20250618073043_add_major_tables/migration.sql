-- CreateTable
CREATE TABLE "majors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "category" TEXT,
    "description" TEXT,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "hasModel" BOOLEAN NOT NULL DEFAULT false,
    "lastTrainingAt" DATETIME,
    "qualityStats" JSONB,
    "keywords" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "major_markov_chains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "major" TEXT NOT NULL,
    "currentWord" TEXT NOT NULL,
    "nextWord" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE UNIQUE INDEX "majors_name_key" ON "majors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "major_markov_chains_major_currentWord_nextWord_key" ON "major_markov_chains"("major", "currentWord", "nextWord");
