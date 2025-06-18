-- CreateTable
CREATE TABLE "graduation_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "school" TEXT,
    "major" TEXT,
    "year" INTEGER,
    "keywords" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tokenized_words" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "tokenized_words_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "graduation_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "params" JSONB,
    "rating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "markov_chains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currentWord" TEXT NOT NULL,
    "nextWord" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "keyword_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "graduation_topics_title_key" ON "graduation_topics"("title");

-- CreateIndex
CREATE UNIQUE INDEX "markov_chains_currentWord_nextWord_key" ON "markov_chains"("currentWord", "nextWord");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_stats_keyword_key" ON "keyword_stats"("keyword");
