# Replit.md

## Overview

This is a full-stack subscription-based Opian Lifestyle protection website built for the South African market. The application offers five subscription plans (OPPORTUNITY, MOMENTUM, PROSPER, PRESTIGE, PINNACLE) ranging from R350-R825 per month, providing services like emergency medical assistance, legal support, funeral cover, and family protection benefits. The system features a modern, clean design inspired by Entrepedia's aesthetic with rounded cards, soft shadows, and generous white space.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preferences: Light stained glass effect with vibrant, prominent colors applied across all dashboard sections and pages. Each section features unique color themes with multiple gradient layers, glassmorphism effects, and enhanced visual hierarchy.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite build system and TypeScript
- **Routing**: Wouter for client-side navigation with dedicated /pricing route alias
- **UI Framework**: Tailwind CSS with shadcn/ui component library using Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management
- **Design System**: Custom stained glass design with vibrant color themes per section, glassmorphism effects, and consistent typography scale
- **Layout Structure**: Responsive design with mobile-first approach, sticky navigation, themed welcome banners, and component-based architecture

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with structured route handlers and middleware-based authentication
- **Database ORM**: Drizzle ORM with MySQL dialect for Xneelo MySQL
- **Authentication**: JWT-based authentication with access/refresh token pattern, bcrypt for password hashing
- **Email System**: Nodemailer with MJML templates compiled using Handlebars
- **Development Setup**: Hot module replacement with Vite middleware integration

### Data Storage Solutions
- **Primary Database**: Xneelo MySQL with SSL connection pooling and automatic table creation
- **Schema Design**: Relational database with users, subscription_plans, subscriptions, and invoices tables
- **Data Validation**: Zod schemas for both client and server-side validation
- **Migration System**: Automated table creation on application startup with proper MySQL syntax

### Authentication and Authorization
- **Authentication Flow**: Email/password with email verification requirement
- **Session Management**: JWT tokens stored in HTTP-only cookies
- **Role-Based Access**: USER and ADMIN roles with protected route middleware
- **Password Security**: Bcrypt hashing with salt rounds, password reset functionality
- **Account Verification**: Email verification tokens with expiration handling

## External Dependencies

### Payment Processing
- **Adumo Online Integration**: South African payment gateway with secure redirects
- **Currency Support**: South African Rand (ZAR) pricing and billing
- **Subscription Management**: Plan selection, payment processing, and subscription lifecycle management

### Database Infrastructure
- **Xneelo MySQL Database**: External MySQL hosting with SSL security and connection pooling
- **Backend Migration**: Successfully migrated from PostgreSQL to Xneelo MySQL (September 10, 2025)
- **Payment Migration**: Successfully migrated from Stripe to Adumo Online payment gateway (September 10, 2025)
- **Replit Migration**: Successfully migrated from Replit Agent to Replit environment (August 21, 2025)
- **Environment Setup**: All required API keys configured (Stripe, SMTP) for full functionality
- **Database Setup**: PostgreSQL database configured and schema migrated successfully
- **Development Mode**: Subscription system fully operational with development price IDs for testing
- **Subscription Fix**: Fixed dashboard logic to properly handle both subscription creation and updates (August 21, 2025)
- **UI Enhancement**: Comprehensive stained glass styling applied to all dashboard sections (August 18, 2025)
  - Overview: Blue/purple/pink gradient themes with enhanced vibrancy
  - Subscription: Emerald/green color palette with glassmorphism effects
  - Invoices: Purple/indigo themed welcome banners and cards
  - Settings: Amber/orange warm color schemes with multi-layered gradients
  - Pricing: Cyan/blue/indigo blend with enhanced visual hierarchy
- **Landing Page Redesign**: Complete redesign to match opianrewards.com style (August 18, 2025)
  - Hero section with dark gradient background and Protection Card visual
  - Multi-section layout with value propositions, step-by-step process, and benefits
  - Opian-style messaging focused on "making money go further" and comprehensive protection
  - Professional card-based design with clean typography and strong call-to-actions
  - Integrated pricing section with "Unlock More, Earn More, Be More" theme
- **Landing Page Optimization**: Enhanced user experience and responsiveness (September 11, 2025)
  - Made fully responsive across all device sizes with proper mobile layouts
  - Slowed down pulse animation on interactive service headings for better UX
  - Removed redundant sections: "Get Protected Effortlessly", stats sections, and call-to-action sections
  - Streamlined content for cleaner, more focused user journey
  - Improved button layouts and text sizing for mobile compatibility
- **Logo Integration**: Official Opian Rewards logo implemented in navbar (August 21, 2025)
  - Replaced generic text logo with authentic Opian Lifestyle branding
  - Logo displays prominently in navigation across all pages
- **Adumo Payment Integration Update**: Enhanced Virtual Form Post implementation (December 3, 2025)
  - Updated JWT token claims to match Adumo's expected format (iss='Dev Center', mref claim for merchant reference)
  - Improved phone number formatting with proper E.164 validation for SA numbers (+27XXXXXXXXX)
  - Enhanced date handling for subscription start/end dates aligned with collection day
  - Added complete Adumo form fields: frequency, collectionDay, accountNumber, startDate, endDate, collectionValue
  - Included shipping/billing address fields and customer contact details
  - Set proper frequency options: MONTHLY, WEEKLY, EVERY, BIANNUALLY, ANNUALLY, QUARTERLY

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