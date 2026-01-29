-- This is an empty migration.
ALTER TABLE "Bookings" ADD CONSTRAINT "check_dates_for_gte" CHECK ("check_out_date" >= "check_in_date");
