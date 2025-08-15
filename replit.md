# Replit.md

## Overview

This is a full-stack subscription-based lifestyle protection website built for the South African market. The application offers five subscription plans (OPPORTUNITY, MOMENTUM, PROSPER, PRESTIGE, PINNACLE) ranging from R350-R825 per month, providing services like emergency medical assistance, legal support, funeral cover, and family protection benefits. The system features a modern, clean design inspired by Entrepedia's aesthetic with rounded cards, soft shadows, and generous white space.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite build system and TypeScript
- **Routing**: Wouter for client-side navigation
- **UI Framework**: Tailwind CSS with shadcn/ui component library using Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management
- **Design System**: Custom design tokens with CSS variables, neutral color palette, and consistent typography scale
- **Layout Structure**: Responsive design with mobile-first approach, sticky navigation, and component-based architecture

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with structured route handlers and middleware-based authentication
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: JWT-based authentication with access/refresh token pattern, bcrypt for password hashing
- **Email System**: Nodemailer with MJML templates compiled using Handlebars
- **Development Setup**: Hot module replacement with Vite middleware integration

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless connection pooling
- **Schema Design**: Relational database with users, subscription_plans, subscriptions, and invoices tables
- **Data Validation**: Zod schemas for both client and server-side validation
- **Migration System**: Drizzle Kit for database migrations and schema management

### Authentication and Authorization
- **Authentication Flow**: Email/password with email verification requirement
- **Session Management**: JWT tokens stored in HTTP-only cookies
- **Role-Based Access**: USER and ADMIN roles with protected route middleware
- **Password Security**: Bcrypt hashing with salt rounds, password reset functionality
- **Account Verification**: Email verification tokens with expiration handling

## External Dependencies

### Payment Processing
- **Stripe Integration**: Full subscription lifecycle management with webhooks
- **Currency Support**: South African Rand (ZAR) pricing and billing
- **Subscription Management**: Recurring billing, plan changes, and cancellation handling

### Database Infrastructure
- **PostgreSQL Database**: Standard PostgreSQL with connection pooling via pg driver
- **Migration Status**: Successfully migrated from Neon to Replit PostgreSQL (August 13, 2025)
- **Replit Migration**: Successfully migrated from Replit Agent to Replit environment (August 15, 2025)
- **Environment Setup**: All required API keys configured (Stripe, SMTP) for full functionality
- **Development Mode**: Subscription system fully operational with development price IDs for testing

### Email Services
- **SMTP Configuration**: Nodemailer with Gmail/custom SMTP support
- **Template System**: MJML for responsive email templates with Handlebars data binding
- **Transactional Emails**: Welcome, verification, password reset, and billing notifications

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Development Environment**: Replit integration with runtime error overlay
- **Code Quality**: ESLint configuration and TypeScript strict mode
- **CSS Processing**: PostCSS with Tailwind CSS and Autoprefixer

### UI Component Libraries
- **Component System**: Radix UI primitives for accessibility and behavior
- **Icon Library**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod resolver integration
- **Styling**: Class Variance Authority for component variants