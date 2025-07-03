# Collaborative Publishing Platform - Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Models](#data-models)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Design](#api-design)
6. [Database Design](#database-design)
7. [Security Considerations](#security-considerations)
8. [Performance Considerations](#performance-considerations)
9. [Deployment Architecture](#deployment-architecture)
10. [Technical Decisions & Trade-offs](#technical-decisions--trade-offs)

## Overview

The Collaborative Publishing Platform is a multi-tenant SaaS application built with NestJS that enables organizations to create, manage, and publish content collaboratively. The platform features advanced role-based access control (RBAC), cross-organization permissions, and asynchronous processing capabilities.

### Key Features

- **Multi-tenant Architecture**: Isolated workspaces for different organizations
- **Role-Based Access Control**: Fine-grained permissions (OWNER, EDITOR, WRITER)
- **Cross-Organization Collaboration**: Controlled sharing between organizations
- **Advanced Authentication**: JWT-based auth with superadmin capabilities
- **Content Management**: Create, edit, review, and publish posts
- **Asynchronous Processing**: Queue-based notification system
- **Audit Trail**: Comprehensive logging and permission tracking

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Load Balancer │
│   (React/Vue)   │◄──►│   (Optional)    │◄──►│   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Backend Application                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Auth      │ │ Organizations│ │    Posts    │ │   Queues    │ │
│  │   Module    │ │   Module    │ │   Module    │ │   Module    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │    Users    │ │Organizations│ │    Posts    │ │Permissions  │ │
│  │             │ │             │ │             │ │             │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Redis (Queue & Cache)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Notification│ │   Cache     │ │   Sessions  │ │   Rate      │ │
│  │   Queue     │ │             │ │             │ │   Limiting  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Module Architecture

The application follows a modular architecture with clear separation of concerns:

1. **Auth Module**: Handles authentication, authorization, and user management
2. **Organizations Module**: Manages multi-tenant organizations and membership
3. **Posts Module**: Handles content creation, editing, and publishing
4. **Queues Module**: Manages asynchronous processing and notifications
5. **Advanced Auth Module**: Provides advanced authorization features

## Data Models

### Core Entities

#### User Entity
```typescript
interface User {
  id: string;                    // UUID primary key
  email: string;                 // Unique email address
  username: string;              // Unique username
  firstName: string;             // First name
  lastName: string;              // Last name
  password: string;              // Hashed password
  role: UserRole;                // Global role (USER, ADMIN, SUPERADMIN)
  isActive: boolean;             // Account status
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

#### Organization Entity
```typescript
interface Organization {
  id: string;                    // UUID primary key
  name: string;                  // Organization name
  description?: string;          // Optional description
  website?: string;              // Optional website URL
  isActive: boolean;             // Organization status
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

#### Organization Member Entity
```typescript
interface OrganizationMember {
  id: string;                    // UUID primary key
  userId: string;                // Foreign key to User
  organizationId: string;        // Foreign key to Organization
  role: OrganizationRole;        // Role within organization
  isActive: boolean;             // Membership status
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

#### Post Entity
```typescript
interface Post {
  id: string;                    // UUID primary key
  title: string;                 // Post title
  content: string;               // Post content
  status: PostStatus;            // Current status
  organizationId: string;        // Foreign key to Organization
  authorId: string;              // Foreign key to User
  publishedAt?: Date;            // Publication timestamp
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

#### Cross-Organization Permission Entity
```typescript
interface CrossOrganizationPermission {
  id: string;                    // UUID primary key
  sourceOrgId: string;           // Source organization
  targetOrgId: string;           // Target organization
  permissionType: PermissionType; // Type of permission
  grantedBy: string;             // User who granted permission
  grantedToRole: string;         // Role required to use permission
  isActive: boolean;             // Permission status
  expiresAt?: Date;              // Optional expiration
  description?: string;          // Optional description
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### Relationships

```
User (1) ──── (N) OrganizationMember (N) ──── (1) Organization
User (1) ──── (N) Post
Organization (1) ──── (N) Post
Organization (1) ──── (N) CrossOrganizationPermission (N) ──── (1) Organization
```

## Authentication & Authorization

### Authentication Flow

1. **Registration**: Users register with email, username, and password
2. **Login**: Users authenticate with email/password, receive JWT token
3. **Token Validation**: JWT tokens are validated on each request
4. **Token Refresh**: Tokens can be refreshed before expiration

### Authorization Levels

#### Global User Roles
- **USER**: Basic user with limited system-wide permissions
- **ADMIN**: Elevated privileges for user and organization management
- **SUPERADMIN**: Full system access, including cross-organization operations

#### Organization Roles
- **OWNER**: Full control over organization and its resources
- **EDITOR**: Can edit content and manage other members
- **WRITER**: Can create and edit their own content

### Permission System

#### Organization-Level Permissions
- Users must be members of an organization to access its resources
- Role-based permissions within each organization
- Organization owners have full control over membership and content

#### Cross-Organization Permissions
- Explicit permissions required for cross-organization access
- Granular permission types: READ, WRITE, ADMIN
- Time-limited permissions with expiration dates
- Audit trail of permission grants and revocations

### Guards and Decorators

```typescript
// JWT Authentication Guard
@UseGuards(JwtAuthGuard)

// Organization Membership Guard
@UseGuards(OrganizationGuard)

// Role-based Authorization
@RequireRole(OrganizationRole.OWNER)

// Advanced Authorization
@UseGuards(AdvancedAuthGuard)
```

## API Design

### RESTful Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh

#### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List organizations
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

#### Organization Members
- `GET /api/organizations/:id/members` - List members
- `POST /api/organizations/:id/members` - Invite member
- `PUT /api/organizations/:id/members/:memberId/role` - Update member role
- `DELETE /api/organizations/:id/members/:memberId` - Remove member

#### Cross-Organization Permissions
- `POST /api/cross-organization-permissions` - Grant permission
- `GET /api/cross-organization-permissions` - List permissions
- `PUT /api/cross-organization-permissions/:id` - Update permission
- `DELETE /api/cross-organization-permissions/:id` - Revoke permission
- `POST /api/cross-organization-permissions/check` - Check permission

#### Posts
- `POST /api/organizations/:id/posts` - Create post
- `GET /api/organizations/:id/posts` - List posts
- `GET /api/organizations/:id/posts/:postId` - Get post details
- `PUT /api/organizations/:id/posts/:postId` - Update post
- `DELETE /api/organizations/:id/posts/:postId` - Delete post

### API Documentation

The API is documented using Swagger/OpenAPI 3.0 and is available at `/api/docs` when the application is running.

## Database Design

### Schema Overview

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role organization_member_role_enum NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status post_status_enum NOT NULL DEFAULT 'draft',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cross-organization permissions table
CREATE TABLE cross_organization_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  permission_type cross_org_permission_type_enum NOT NULL,
  granted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_to_role VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_posts_organization_id ON posts(organization_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_cross_org_perms_source ON cross_organization_permissions(source_org_id);
CREATE INDEX idx_cross_org_perms_target ON cross_organization_permissions(target_org_id);
CREATE INDEX idx_cross_org_perms_granted_by ON cross_organization_permissions(granted_by);
```

## Security Considerations

### Authentication Security

1. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
2. **JWT Security**: Tokens are signed with a secure secret and have expiration times
3. **Rate Limiting**: API endpoints are protected against brute force attacks
4. **Input Validation**: All inputs are validated using class-validator decorators

### Authorization Security

1. **Role-Based Access Control**: Fine-grained permissions based on user roles
2. **Organization Isolation**: Users can only access resources within their organizations
3. **Cross-Organization Security**: Explicit permissions required for cross-organization access
4. **Audit Trail**: All permission changes are logged for security auditing

### Data Security

1. **SQL Injection Prevention**: Using TypeORM with parameterized queries
2. **XSS Prevention**: Input sanitization and output encoding
3. **CSRF Protection**: JWT tokens provide CSRF protection
4. **Data Encryption**: Sensitive data is encrypted at rest

## Performance Considerations

### Database Optimization

1. **Indexing Strategy**: Strategic indexes on frequently queried columns
2. **Query Optimization**: Efficient queries using TypeORM query builder
3. **Connection Pooling**: Database connection pooling for better performance
4. **Caching**: Redis caching for frequently accessed data

### Application Performance

1. **Async Processing**: Queue-based processing for heavy operations
2. **Pagination**: API endpoints support pagination for large datasets
3. **Lazy Loading**: Entity relationships are loaded on demand
4. **Compression**: Response compression for better network performance

### Scalability

1. **Horizontal Scaling**: Stateless application design allows horizontal scaling
2. **Load Balancing**: Application can be deployed behind load balancers
3. **Database Sharding**: Multi-tenant design supports database sharding
4. **Microservices Ready**: Modular architecture supports microservices migration

## Deployment Architecture

### Development Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   NestJS API    │    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 3001)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Port 6379)   │
                       └─────────────────┘
```

### Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   Load Balancer │    │   API Gateway   │
│   Assets        │    │   (Nginx)       │    │   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Servers                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   NestJS    │ │   NestJS    │ │   NestJS    │ │   NestJS    │ │
│  │   Instance  │ │   Instance  │ │   Instance  │ │   Instance  │ │
│  │     1       │ │     2       │ │     3       │ │     N       │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ PostgreSQL  │ │ PostgreSQL  │ │    Redis    │ │    Redis    │ │
│  │   Primary   │ │   Replica   │ │   Primary   │ │   Replica   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Docker Deployment

The application includes Docker configuration for containerized deployment:

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dbname
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=dbname
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

## Technical Decisions & Trade-offs

### Framework Choice: NestJS

**Decision**: Use NestJS as the backend framework

**Pros**:
- TypeScript-first with excellent type safety
- Modular architecture with dependency injection
- Built-in support for OpenAPI/Swagger documentation
- Excellent integration with TypeORM and other libraries
- Strong community and enterprise adoption

**Cons**:
- Learning curve for developers new to the framework
- Opinionated architecture may not suit all use cases
- Larger bundle size compared to Express.js

**Trade-off**: Chose developer productivity and maintainability over minimal bundle size.

### Database Choice: PostgreSQL

**Decision**: Use PostgreSQL as the primary database

**Pros**:
- ACID compliance and strong data integrity
- Excellent support for JSON data types
- Advanced indexing and query optimization
- Built-in support for UUIDs and enums
- Strong community and enterprise features

**Cons**:
- More complex setup compared to SQLite
- Higher resource requirements
- More complex backup and recovery procedures

**Trade-off**: Chose data integrity and scalability over simplicity.

### Authentication: JWT

**Decision**: Use JWT tokens for authentication

**Pros**:
- Stateless authentication suitable for horizontal scaling
- No server-side session storage required
- Easy to implement and integrate
- Good performance characteristics

**Cons**:
- Tokens cannot be invalidated before expiration
- Larger payload size compared to session IDs
- Security considerations with token storage

**Trade-off**: Chose scalability and simplicity over immediate token revocation capability.

### Multi-tenancy: Database-per-tenant vs Shared Database

**Decision**: Use shared database with organization-based isolation

**Pros**:
- Lower operational complexity
- Easier to implement cross-organization features
- Better resource utilization
- Simpler backup and maintenance

**Cons**:
- Requires careful data isolation implementation
- Potential for data leakage if not properly secured
- Harder to implement tenant-specific customizations

**Trade-off**: Chose operational simplicity and cross-organization features over complete data isolation.

### Queue System: Bull with Redis

**Decision**: Use Bull queue with Redis for asynchronous processing

**Pros**:
- Excellent integration with NestJS
- Built-in retry mechanisms and error handling
- Job scheduling and prioritization
- Real-time job monitoring

**Cons**:
- Additional infrastructure dependency (Redis)
- More complex deployment setup
- Learning curve for queue management

**Trade-off**: Chose reliability and monitoring capabilities over simplicity.

### API Documentation: Swagger/OpenAPI

**Decision**: Use Swagger/OpenAPI for API documentation

**Pros**:
- Interactive documentation with testing capabilities
- Automatic code generation for clients
- Industry standard with wide tool support
- Excellent integration with NestJS

**Cons**:
- Additional development overhead
- Documentation can become outdated
- Larger bundle size for documentation assets

**Trade-off**: Chose developer experience and API discoverability over minimal overhead.

## Future Considerations

### Scalability Improvements

1. **Database Sharding**: Implement database sharding for large-scale deployments
2. **Caching Strategy**: Implement comprehensive caching strategy with Redis
3. **CDN Integration**: Integrate CDN for static asset delivery
4. **Microservices Migration**: Break down into microservices for better scalability

### Feature Enhancements

1. **Real-time Collaboration**: Add WebSocket support for real-time editing
2. **File Management**: Implement file upload and management system
3. **Advanced Analytics**: Add analytics and reporting capabilities
4. **API Rate Limiting**: Implement sophisticated rate limiting strategies

### Security Enhancements

1. **Two-Factor Authentication**: Add 2FA support for enhanced security
2. **Audit Logging**: Implement comprehensive audit logging system
3. **Data Encryption**: Add field-level encryption for sensitive data
4. **Security Headers**: Implement security headers and CSP policies

### Monitoring and Observability

1. **Application Monitoring**: Integrate APM tools for performance monitoring
2. **Log Aggregation**: Implement centralized logging with ELK stack
3. **Health Checks**: Add comprehensive health check endpoints
4. **Metrics Collection**: Implement metrics collection for operational insights

### Development Workflow

- To populate the database with demo/demo data, run:
  ```bash
  npm run seed
  ```
  This will clear and insert demo users, organizations, memberships, and posts for local development. 