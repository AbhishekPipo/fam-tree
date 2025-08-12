# Database Setup Guide

This project now uses proper Sequelize migrations and seeders for database management.

## Quick Start

### 1. Fresh Database Setup
```bash
# Run migrations to create tables
npm run db:migrate

# Run seeders to populate with sample data
npm run db:seed
```

### 2. Reset Database (Development)
```bash
# Reset everything and start fresh
npm run db:reset
```

## Available Scripts

### Migration Scripts
- `npm run db:migrate` - Run all pending migrations
- `npm run db:migrate:undo` - Undo the last migration
- `npm run db:migrate:undo:all` - Undo all migrations

### Seeder Scripts
- `npm run db:seed` - Run all seeders
- `npm run db:seed:undo` - Undo all seeders

### Combined Scripts
- `npm run db:reset` - Undo all migrations, run migrations, then run seeders

## Database Structure

### Tables Created by Migrations:
1. **users** - Family members with personal information
2. **direct_relationships** - Spouse/partner relationships
3. **indirect_relationships** - All other family relationships (parent, child, sibling, etc.)

### Sample Data from Seeders:
- 9 family members (Patel family)
- 4 direct relationships (2 married couples)
- 68 indirect relationships (all family connections)

## Sample Login Credentials
All users have the password: `FamilyTree123!`

- ramesh@family.com (Grandfather)
- mallika@family.com (Grandmother)  
- prashanth@family.com (Father)
- anjali@family.com (Mother)
- simran@family.com (Daughter)
- arjun@family.com (Son)
- elina@family.com (Granddaughter)
- rohan@family.com (Grandson)
- suresh@family.com (Uncle)

## Family Tree Structure
```
Ramesh (grandfather) ↔ Mallika (grandmother)    Suresh (brother)
       ↓
Prashanth (father) ↔ Anjali (mother)
       ↓                    ↓
   Simran (daughter)    Arjun (son)
       ↓                    ↓
   Elina (granddaughter) Rohan (grandson)
```

## Migration Files Location
- `/src/migrations/` - Contains all migration files
- `/src/seeders/` - Contains all seeder files

## Notes
- The old `setupDatabase.js` file now only creates empty tables
- All data creation has been moved to proper seeders
- Use migrations for schema changes
- Use seeders for sample/initial data