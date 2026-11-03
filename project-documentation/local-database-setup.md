# Local PostgreSQL Database Setup

This guide walks through setting up a local PostgreSQL database for FFP development.

## Prerequisites

- macOS (using Homebrew)
- Node.js >= 24.0.0 (`nvm use` reads `.nvmrc`)
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

### 2. Create Database and Users

FFP uses two database users for security:

| User        | Purpose                    | BYPASSRLS   | Used By                     |
| ----------- | -------------------------- | ----------- | --------------------------- |
| `root_user` | Migrations, schema changes | Yes (owner) | `pnpm db:migrate`, DataGrip |
| `app_user`  | Application queries        | **No**      | Lambda, `pnpm sst dev`      |

**Why two users?** Row-Level Security (RLS) is bypassed by table owners and users with `BYPASSRLS` privilege. Using `app_user` (without bypass) ensures RLS policies are enforced during development, catching tenant isolation bugs early.

```bash
# Connect to PostgreSQL as superuser (use your macOS username)
psql postgres

# ============================================================================
# 1. Create root_user (for migrations)
# ============================================================================
CREATE USER root_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE ffp_dev OWNER root_user;
GRANT ALL PRIVILEGES ON DATABASE ffp_dev TO root_user;

# Connect to the database
\c ffp_dev

# Grant schema privileges (required for tables and RLS)
GRANT ALL ON SCHEMA public TO root_user;

# ============================================================================
# 2. Create app_user (for application - RLS enforced)
# ============================================================================
CREATE USER app_user WITH PASSWORD 'your_app_password_here';

# Grant connection and usage. Table and sequence grants (SELECT, INSERT, UPDATE, DELETE;
# no TRUNCATE, no DDL) come from `pnpm db:migrate`, which also sets them as root_user's
# default privileges for future tables.
GRANT CONNECT ON DATABASE ffp_dev TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

# Exit PostgreSQL
\q
```

**Verify app_user cannot bypass RLS:**

```bash
psql -h localhost -U your_username -d ffp_dev -c "SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname IN ('root_user', 'app_user');"
```

Expected output:

```
  rolname  | rolbypassrls
-----------+--------------
 root_user | t
 app_user  | f
```

**Alternative: Grant CREATE permission to root_user (required for migrations)**

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
# Use app_user for development to ensure RLS is enforced
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ffp_dev
DB_USER=app_user
DB_PASSWORD=your_app_password_here

# Migrations connect as the schema owner, with its own password (never DB_PASSWORD)
DB_MIGRATE_USER=root_user
DB_MIGRATE_PASSWORD=your_secure_password_here
```

The test database (`ffp_test`) is migrated the same way, plus `DB_TEST_USER=test_user` so the role the vitest suites connect as receives the same grants. Run it from the package so the variables reach the script:

```bash
cd packages/database
pnpm db:migrate                                         # ffp_dev
DB_NAME=ffp_test DB_TEST_USER=test_user pnpm db:migrate # ffp_test
```

**⚠️ Important:**

- Never commit your `.env` file to Git (already in `.gitignore`)
- Use `app_user` for development to catch RLS issues early
- Only use `root_user` for running migrations (`pnpm db:migrate`)

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

[✓] Successfully connected to PostgreSQL database!

PostgreSQL Version:
  PostgreSQL 16.x.x ...

[✓] Database exists

[✓] Connection test completed successfully!

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

- [✓] Use strong passwords for database users
- [✓] Keep `.env` file private (never commit to Git)
- [✓] Use different credentials for dev/staging/production
- [✓] Regularly update PostgreSQL to latest patch version

## Production Database

Deployed environments run on AWS RDS PostgreSQL. Their roles are not created by hand: `packages/database/scripts/create-roles.ts` (`pnpm --filter @ffp/database db:roles`) is the definition. Run it once per environment as the RDS master user, before the first migration:

- **Migrator** (`DB_MIGRATE_USER` / `DB_MIGRATE_PASSWORD`): owns the schema objects and runs `pnpm db:migrate`. Not a superuser, no BYPASSRLS.
- **Runtime** (`DB_USER` / `DB_PASSWORD`): what the functions connect as. CONNECT and schema USAGE only; its row access comes from the migration's grants.

It connects as `DB_MASTER_USER` / `DB_MASTER_PASSWORD` over verified TLS, sends passwords as SCRAM verifiers rather than plain text, is safe to re-run (re-running rotates both passwords), and fails if either role turns out to be a superuser or to hold BYPASSRLS, CREATEDB or CREATEROLE. It never creates `test_user`, and the migration refuses `DB_TEST_USER` on a deployed environment.

On a deployed profile (`ENVIRONMENT` of `production` or `production-like`) the migration leaves RLS enabled but not forced, so the owning migrator is exempt and the runtime role, which never owns a table, is bound by every policy. Elsewhere RLS is forced, so the owner is bound too, unless it holds BYPASSRLS (as the local `root_user` does; CI's migrator does not).

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
