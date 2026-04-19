#!/bin/bash

# ==============================================================================
# Supabase Database Migration Script
# ==============================================================================
# This script uses standard PostgreSQL tools (pg_dump and psql) to securely 
# transfer your database from one Supabase project to another.
#
# PREREQUISITES:
# You must have 'postgresql-client' installed on the machine running this.
# (e.g. `sudo apt-get install postgresql-client` or `brew install postgresql`)
# ==============================================================================

# 1. Configuration - Replace these with your actual Supabase DB connection strings
# You can find these in Project Settings -> Database -> Connection string (URI)
# Note: Use the exact URI (make sure it ends with /postgres and has the password)

OLD_DB_URL="postgresql://postgres.[OLD_PROJECT_REF]:[OLD_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
NEW_DB_URL="postgresql://postgres.[NEW_PROJECT_REF]:[NEW_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

echo "Step 1: Exporting Schema (Roles & DB structure)..."
# Dump only the schema
pg_dump --clean --if-exists --quote-all-identifiers \
  --schema-only \
  --no-owner --no-privileges \
  --dbname="$OLD_DB_URL" \
  --file=old_schema.sql

echo "Step 2: Exporting Data..."
# Dump only the data
pg_dump --data-only --quote-all-identifiers \
  --no-owner --no-privileges \
  --dbname="$OLD_DB_URL" \
  --file=old_data.sql

echo "Step 3: Importing Schema to New Supabase Project..."
psql --dbname="$NEW_DB_URL" \
  --file=old_schema.sql

echo "Step 4: Importing Data to New Supabase Project..."
# Disable triggers to prevent foreign key errors during bulk insert, then import
psql --dbname="$NEW_DB_URL" <<EOF
SET session_replication_role = replica;
\i old_data.sql
SET session_replication_role = DEFAULT;
EOF

echo "Migration Complete!"
echo "Note: If you have Supabase Storage buckets, those need to be transferred separately via the Supabase CLI or Dashboard."
