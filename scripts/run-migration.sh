#!/bin/bash

# Script to run the product quantity migration
# Usage: ./run-migration.sh

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please set it to your PostgreSQL connection string"
  echo "Example: export DATABASE_URL=postgresql://postgres:password@localhost:5432/your_database"
  exit 1
fi

echo "Running product quantity migration..."
psql "$DATABASE_URL" -f scripts/migrate-product-quantity.sql

if [ $? -eq 0 ]; then
  echo "Migration completed successfully!"
else
  echo "Migration failed. Please check the error message above."
  exit 1
fi

echo "Done!" 