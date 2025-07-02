# Collaborative Publishing Platform - Frontend

A modern, responsive frontend for the Collaborative Publishing Platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Stack**: Next.js 15 with App Router, TypeScript, and Tailwind CSS
- **Design System**: Comprehensive component library with consistent styling
- **Multi-tenant**: Organization-based workspace management
- **Responsive**: Mobile-first design with adaptive layouts
- **Type Safe**: Full TypeScript support with strict type checking
- **Developer Experience**: ESLint, Prettier, and comprehensive tooling

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── layout/            # Layout components (Header, Sidebar, Footer)
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configurations
├── types/                 # TypeScript type definitions
└── styles/                # Global styles and Tailwind config
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your backend API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run check` - Run all checks (types, lint, format)

## 🎨 Design System

The project uses a comprehensive design system with:

- **Color Palette**: Primary, secondary, success, warning, error, and neutral colors
- **Typography**: Inter font family with consistent sizing and weights
- **Spacing**: 8px grid system for consistent spacing
- **Components**: Reusable UI components with variants and sizes

### Core Components

- `Button` - Multiple variants (primary, secondary, outline, ghost, danger)
- `Input` - Form inputs with validation states and icons
- `Card` - Content containers with header, body, and footer
- `Badge` - Status indicators and labels

## 🔧 Configuration Files

- `.prettierrc` - Prettier formatting rules
- `.prettierignore` - Files to exclude from formatting
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `eslint.config.mjs` - ESLint rules

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `http://localhost:3001/api` |

## 📱 Responsive Design

The application is built with a mobile-first approach:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 🔐 Authentication

The frontend integrates with the NestJS backend authentication system:

- JWT token-based authentication
- Organization-based access control
- Role-based permissions
- Automatic token refresh

## 🏗️ Architecture

- **App Router**: Next.js 15 App Router for file-based routing
- **Server Components**: Default server-side rendering for better performance
- **Client Components**: Interactive components with 'use client' directive
- **API Integration**: Centralized API client with error handling
- **State Management**: React hooks for local state management

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker Deployment

```bash
docker build -t collaborative-publishing-frontend .
docker run -p 3000:3000 collaborative-publishing-frontend
```

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write TypeScript for all new code
3. Add proper type definitions
4. Test your changes thoroughly
5. Update documentation as needed

## 📄 License

This project is part of the Collaborative Publishing Platform.
