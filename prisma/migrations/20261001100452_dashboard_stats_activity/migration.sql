-- CreateTable
CREATE TABLE "dashboard_stats" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "deltaPercent" INTEGER,
    "order" INTEGER NOT NULL,

    CONSTRAINT "dashboard_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_activity" (
    "id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "visitors" INTEGER NOT NULL,

    CONSTRAINT "monthly_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_activity_month_key" ON "monthly_activity"("month");
