# Local PostgreSQL Database Setup

This guide walks through setting up a local PostgreSQL database for FFP development.

## Prerequisites

- macOS (using Homebrew)
- Node.js >= 20.0.0
- pnpm >= 9.0.0

## Installation

### 1. Install PostgreSQL

Using Homebrew (recommended for macOS):

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Verify installation
psql --version
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser (use your macOS username)
psql postgres

# In the PostgreSQL prompt, run the following commands:
CREATE USER root_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE ffp_dev OWNER root_user;

# Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO root_user;

# Connect to the database
\c ffp_dev

# Grant schema privileges (required for tables and RLS)
GRANT ALL ON SCHEMA public TO root_user;

# Exit PostgreSQL
\q
```

**Alternative: Grant CREATE permission (required for migrations)**

If you encounter permission errors when running migrations, grant CREATE permission on the database:

```bash
# Replace 'your_username' with your macOS username
psql -h localhost -U your_username -d ffp_dev -c "GRANT CREATE ON DATABASE ffp_dev TO root_user;"
```

This allows `root_user` to create the `drizzle` schema that Drizzle ORM uses for tracking migrations.

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your database credentials:

```bash
# Database Configuration (Local PostgreSQL for development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ffp_dev
DB_USER=root_user
DB_PASSWORD=your_secure_password_here
```

**⚠️ Important:** Never commit your `.env` file to Git. It's already in `.gitignore`.

### 4. Test Database Connection

Run the connection test script:

```bash
pnpm db:test
```

You should see:

```
🔍 Testing database connection...

Configuration:
  Host: localhost
  Port: 5432
  Database: ffp_dev
  User: root_user

✅ Successfully connected to PostgreSQL database!

PostgreSQL Version:
  PostgreSQL 16.x.x ...

✅ Database exists

✅ Connection test completed successfully!

```

### Setup GUI - Jetbrains DataGrip PostgreSQL Connection Example

**General Tab:**

- Host: localhost
- Port: 5432
- Authentication: User & Password
- User: root_user (or whatever you set in your .env)
- Password: [your password from .env]
- Database: ffp_dev

**Advanced Tab (if needed):**

- SSL: Disabled (for local development)

**Important:** Leave the URL field empty - DataGrip will auto-generate it as:

- jdbc:postgresql://localhost:5432/ffp_dev

_If you don't see the tenants and users tables:_

1. Test the connection first (click "Test Connection" button)
2. Make sure you're viewing the correct schema:
   - In the Database Explorer, expand: ffp_dev → schemas → public → tables

3. Refresh the database view (right-click database → Refresh)
4. Check you're connected to the right database - should be ffp_dev not postgres

## Troubleshooting

### PostgreSQL Not Running

If you see `ECONNREFUSED` error:

```bash
# Check if PostgreSQL is running
brew services list

# Start PostgreSQL if it's not running
brew services start postgresql@16
```

### Authentication Failed

If you see `password authentication failed` error:

1. Verify your `.env` file has the correct credentials
2. Reset the password if needed:

```bash
psql postgres
ALTER USER root_user WITH PASSWORD 'new_password';
\q
```

### Database Does Not Exist

If the database doesn't exist:

```bash
psql postgres
CREATE DATABASE ffp_dev OWNER root_user;
GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO root_user;
\q
```

### Permission Issues

**Schema Permission Denied:**

If you see `permission denied for schema public`:

```bash
# Replace 'your_username' with your macOS username
psql -h localhost -U your_username -d ffp_dev -c "GRANT ALL ON SCHEMA public TO root_user;"
```

**Database Permission Denied (Migrations):**

If you see `permission denied for database ffp_dev` when running `pnpm db:migrate`:

```bash
# Replace 'your_username' with your macOS username
psql -h localhost -U your_username -d ffp_dev -c "GRANT CREATE ON DATABASE ffp_dev TO root_user;"
```

This error occurs because Drizzle needs to create a `drizzle` schema to track migrations. The CREATE permission allows this.

**Why Two Permission Levels?**

- `GRANT ALL ON SCHEMA public` - Allows creating/modifying tables within the public schema
- `GRANT CREATE ON DATABASE` - Allows creating new schemas (needed for `drizzle` schema)

## Next Steps

Once your database connection is working:

1. **Create schema definitions** in `packages/database/src/schema/` directory
2. **Generate migrations** with `pnpm db:generate`
3. **Run migrations** with `pnpm db:migrate`
4. **View database** with `pnpm db:studio` (Drizzle Studio **OR** Setup GUI like DataGrip... notes above)

## Database Scripts Reference

```bash
# Generate SQL migrations from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema changes directly (development only)
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Check migration status
pnpm db:check

# Drop database (⚠️ destructive)
pnpm db:drop

# Test database connection
pnpm db:test
```

## Development Workflow

1. Define/update schema in `packages/database/src/schema/*.ts`
2. Generate migration: `pnpm db:generate`
3. Review generated SQL in `packages/database/migrations/`
4. Apply migration: `pnpm db:migrate`
5. Test changes: `pnpm db:test`

## Security Notes

- ✅ Use strong passwords for database users
- ✅ Keep `.env` file private (never commit to Git)
- ✅ Use different credentials for dev/staging/production
- ✅ Regularly update PostgreSQL to latest patch version

## Production Database

**Note:** This local setup is for development only. Production will use AWS RDS PostgreSQL (deployed in FFP-102).

### Migration User vs Application User

In production (and recommended for local dev), use separate database users:

**Migration User** (elevated permissions):
- **Local**: Database owner or user with CREATE permissions
- **RDS**: RDS master user (e.g., `ffp_admin`)
- **Purpose**: Running migrations, creating schemas, applying RLS policies
- **Used by**: CI/CD pipelines, `pnpm db:migrate`

**Application User** (restricted permissions):
- **Local/RDS**: `app_user` with SELECT, INSERT, UPDATE, DELETE only
- **Purpose**: Lambda functions, API queries, day-to-day operations
- **Used by**: Application code at runtime

Migration from local to RDS is straightforward:

1. Update `.env` with RDS master user credentials (for migrations)
2. Run `pnpm db:migrate` against RDS
3. Migrations automatically create `app_user` with restricted permissions
4. Configure Lambda to use `app_user` credentials from Secrets Manager
5. All data schemas and RLS policies transfer seamlessly

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
