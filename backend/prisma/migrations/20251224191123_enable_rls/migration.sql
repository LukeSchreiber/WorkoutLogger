-- Enable Row Level Security (RLS) on all tables to silence Supabase warnings
-- and default to "Deny All" for public (PostgREST) access.
-- Backend (Prisma) connects as "postgres" or uses bypass role, so it remains unaffected.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lift" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutExercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutSet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ErrorLog" ENABLE ROW LEVEL SECURITY;