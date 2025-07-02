# Collaborative Publishing Platform

A modern, full-stack platform for collaborative content creation and publishing built with Next.js, NestJS, and TypeScript.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Organization Management** - Multi-tenant organizations with member roles
- **Content Management** - Create, edit, and publish posts with rich text editing
- **Real-time Collaboration** - Server-Sent Events for live updates and notifications
- **Advanced Search** - Full-text search across posts, users, and organizations
- **Export/Import** - Support for JSON, CSV, and Markdown formats

### Advanced Features
- **Performance Optimized** - Code splitting, lazy loading, image optimization
- **SEO Optimized** - Dynamic meta tags, Open Graph, structured data
- **Real-time Monitoring** - Core Web Vitals tracking and performance analytics
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Type Safety** - Full TypeScript coverage across frontend and backend

## 🏗️ Architecture

```
tat2/
├── frontend/                 # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Utilities and hooks
│   │   └── types/           # TypeScript type definitions
│   └── public/              # Static assets
├── backend/                  # NestJS backend API
│   ├── src/
│   │   ├── auth/            # Authentication & authorization
│   │   ├── organizations/   # Organization management
│   │   ├── posts/           # Content management
│   │   ├── users/           # User management
│   │   ├── search/          # Search functionality
│   │   ├── realtime/        # Real-time features
│   │   └── queues/          # Background job processing
│   └── test/                # E2E and unit tests
└── docker-compose.yml       # Development environment
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling and validation

### Backend
- **NestJS** - Node.js framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **JWT** - Authentication
- **Bull** - Job queue processing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 6+

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tat2
```

### 2. Environment Setup
```bash
# Copy environment files
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit environment variables
nano backend/.env
nano frontend/.env.local
```

### 3. Start Development Environment
```bash
# Start all services
./start-all.sh

# Or start individually
./start-backend.sh
./start-frontend.sh
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm run start:dev
```

### Database Migrations
```bash
cd backend
npm run migration:run
npm run migration:generate -- src/migrations/NewMigration
```

### Running Tests
```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
npm run test:e2e
```

## 📚 Component Library

### UI Components
- **Button** - Primary, secondary, outline variants
- **Input** - Form inputs with validation
- **Card** - Content containers with header/body/footer
- **Modal** - Dialog components with confirm/alert variants
- **Badge** - Status indicators
- **Pagination** - Page navigation
- **FilterSort** - Data filtering and sorting
- **ExportImport** - Data import/export functionality
- **OptimizedImage** - Image optimization with lazy loading

### Layout Components
- **DashboardLayout** - Main application layout
- **Header** - Navigation header
- **Sidebar** - Navigation sidebar
- **Footer** - Application footer

### Feature Components
- **SearchBar** - Advanced search with suggestions
- **UserInvitations** - Organization invitation management
- **OrganizationMembers** - Member management
- **PostEditor** - Rich text content editor

## 🔐 Authentication & Authorization

### User Roles
- **Owner** - Full organization control
- **Editor** - Can edit and publish content
- **Writer** - Can create and edit drafts
- **Viewer** - Read-only access

### Protected Routes
```tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### Role-based Access
```tsx
import { RoleGuard } from '@/components/auth/RoleGuard';

<RoleGuard allowedRoles={['owner', 'editor']}>
  <AdminPanel />
</RoleGuard>
```

## 🔄 Real-time Features

### Server-Sent Events
The platform uses SSE for real-time updates:

```tsx
import { useRealtime } from '@/lib/realtime';

const { events, isConnected } = useRealtime();
```

### Event Types
- `post.created` - New post created
- `post.updated` - Post updated
- `post.deleted` - Post deleted
- `invitation.sent` - New invitation
- `invitation.accepted` - Invitation accepted
- `member.joined` - New member joined

## 🔍 Search Functionality

### Search API
```typescript
// Search across all content types
const { searchResults, searchAll } = useSearch();
await searchAll('search term');

// Search specific types
const { searchPosts, searchUsers, searchOrganizations } = useSearch();
```

### Search Features
- Full-text search across posts, users, organizations
- Filtering by content type and status
- Sorting by relevance, date, title
- Pagination support
- Export search results

## 📊 Performance Monitoring

### Core Web Vitals
The platform tracks:
- **FCP** - First Contentful Paint
- **LCP** - Largest Contentful Paint
- **FID** - First Input Delay
- **CLS** - Cumulative Layout Shift

### Custom Metrics
```tsx
import { usePerformanceMonitor } from '@/lib/performance';

const { trackComponentRender, trackApiCall } = usePerformanceMonitor();

// Track component performance
trackComponentRender('ComponentName', renderTime);

// Track API performance
trackApiCall('/api/posts', duration, status);
```

## 🚀 Deployment

### Production Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

#### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

### Docker Deployment
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# Or build individually
docker build -t frontend ./frontend
docker build -t backend ./backend
```

### Manual Deployment
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

## 🧪 Testing

### Frontend Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Backend Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📖 API Documentation

### Authentication Endpoints
```
POST /auth/login          # User login
POST /auth/register       # User registration
POST /auth/refresh        # Refresh JWT token
GET  /auth/profile        # Get user profile
PUT  /auth/profile        # Update user profile
```

### Organization Endpoints
```
GET    /organizations           # List organizations
POST   /organizations           # Create organization
GET    /organizations/:id       # Get organization
PUT    /organizations/:id       # Update organization
DELETE /organizations/:id       # Delete organization
POST   /organizations/:id/invite    # Invite member
POST   /organizations/invitations/:id/accept  # Accept invitation
```

### Post Endpoints
```
GET    /posts              # List posts
POST   /posts              # Create post
GET    /posts/:id          # Get post
PUT    /posts/:id          # Update post
DELETE /posts/:id          # Delete post
```

### Search Endpoints
```
GET /search?q=term         # Search all content
GET /search/posts?q=term   # Search posts
GET /search/users?q=term   # Search users
GET /search/organizations?q=term  # Search organizations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Email**: support@yourdomain.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- NestJS team for the robust backend framework
- Tailwind CSS for the utility-first CSS framework
- All contributors and community members

---

**Built with ❤️ by [Your Team/Organization]** 