# Database Setup on Production Server

## Problem
When you deploy to a new server or the database location changes, you'll see this error:
```
SqliteError: no such table: users
```

## Solution

Run the database initialization script:

```bash
npm run init-db
```

This will:
1. Create the `/home/downloader-data/` directory
2. Create the database file at `/home/downloader-data/downloader.db`
3. Run all migrations to create the tables (users, sessions, downloads, settings, etc.)

## After Initialization

Once the database is initialized, you can:

```bash
# Add your first user
npm run add-user

# List all users
npm run list-users

# Start the application
npm start
```

## Important Notes

1. **Run init-db only once** - You only need to run this when setting up a new server or if the database gets deleted

2. **Database location** - The database is stored at `/home/downloader-data/downloader.db` (one level up from your project directory)

3. **Backup** - Make sure to backup this directory regularly as it contains all your users, downloads, and settings

4. **Permissions** - Ensure the application has read/write permissions to `/home/downloader-data/`

## Troubleshooting

If you get permission errors:
```bash
sudo chown -R $USER:$USER /home/downloader-data
chmod 755 /home/downloader-data
```

If the database exists but tables are missing:
```bash
# Delete the old database and reinitialize
rm /home/downloader-data/downloader.db
npm run init-db
```
