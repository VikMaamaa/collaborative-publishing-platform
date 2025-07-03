# Collaborative Publishing Platform - Backend

This is the backend API for the Collaborative Publishing Platform built with NestJS.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis (for BullMQ queues)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment configuration:**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your database and Redis credentials.

3. **Database setup:**
   - Create a PostgreSQL database named `collaborative_publishing`
   - The application will automatically create tables when you start it (in development mode)

4. **Start the application:**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

## Available Scripts

- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Start in production mode
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage

## API Endpoints

The API will be available at `http://localhost:3001/api` (or the port specified in your `.env` file).

## Architecture

This backend follows a modular architecture with the following modules:
- **AuthModule** - Authentication and authorization
- **UsersModule** - User management
- **OrganizationsModule** - Multi-tenant organization management
- **PostsModule** - Article/posting functionality

Each module contains its own controllers, services, and entities following NestJS best practices.

## Seeding the Database

You can populate the database with demo data for development/testing:

```bash
npm run seed
```

This will:
- Clear all existing users, organizations, memberships, and posts (dev only!)
- Create a superadmin and a regular user
- Create a demo organization
- Add both users as members (owner/writer)
- Add two sample posts

Modify `src/seed.ts` to customize the seed data as needed. 