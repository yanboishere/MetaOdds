-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolve_time" DATETIME,
    "close_time" DATETIME,
    "currency" TEXT NOT NULL,
    "volume_24h" REAL,
    "volume_7d" REAL,
    "open_interest" REAL,
    "fee_rate" REAL,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "market_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "last_price" REAL,
    "best_bid" REAL,
    "best_ask" REAL,
    "implied_prob" REAL,
    "open_interest" REAL,
    "fee_rate" REAL,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contract_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "market_id" TEXT NOT NULL,
    "contract_name" TEXT,
    "ts" DATETIME NOT NULL,
    "price" REAL,
    "volume" REAL,
    CONSTRAINT "MarketHistory_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MarketHistory_market_id_ts_idx" ON "MarketHistory"("market_id", "ts");
