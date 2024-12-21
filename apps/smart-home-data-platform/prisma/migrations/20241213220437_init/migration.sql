-- CreateTable
CREATE TABLE "home_condition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cumulative_electric_energy" DOUBLE PRECISION NOT NULL,
    "measured_instantaneous" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "illuminance" DOUBLE PRECISION NOT NULL,
    "ac_status" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_condition_pkey" PRIMARY KEY ("id")
);
