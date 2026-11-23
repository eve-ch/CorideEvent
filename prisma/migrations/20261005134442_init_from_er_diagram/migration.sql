-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event_location" TEXT NOT NULL,
    "starts_at" DATETIME NOT NULL,
    "application_deadline" DATETIME NOT NULL,
    "share_token" TEXT NOT NULL,
    "matching_status" TEXT NOT NULL,
    CONSTRAINT "Event_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "Organizer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TravelOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "place_name" TEXT NOT NULL,
    "departure_time" DATETIME NOT NULL,
    "direction" TEXT NOT NULL,
    CONSTRAINT "TravelOption_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PersonalAccessLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    CONSTRAINT "PersonalAccessLink_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PersonalAccessLink_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RideRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "travel_option_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "offered_seats" INTEGER,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "RideRegistration_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RideRegistration_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RideRegistration_travel_option_id_fkey" FOREIGN KEY ("travel_option_id") REFERENCES "TravelOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Carpool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driver_registration_id" TEXT NOT NULL,
    CONSTRAINT "Carpool_driver_registration_id_fkey" FOREIGN KEY ("driver_registration_id") REFERENCES "RideRegistration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarpoolPassenger" (
    "carpool_id" TEXT NOT NULL,
    "passenger_registration_id" TEXT NOT NULL,

    PRIMARY KEY ("carpool_id", "passenger_registration_id"),
    CONSTRAINT "CarpoolPassenger_carpool_id_fkey" FOREIGN KEY ("carpool_id") REFERENCES "Carpool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CarpoolPassenger_passenger_registration_id_fkey" FOREIGN KEY ("passenger_registration_id") REFERENCES "RideRegistration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_email_key" ON "Organizer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Event_share_token_key" ON "Event"("share_token");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAccessLink_token_hash_key" ON "PersonalAccessLink"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Carpool_driver_registration_id_key" ON "Carpool"("driver_registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "CarpoolPassenger_passenger_registration_id_key" ON "CarpoolPassenger"("passenger_registration_id");
