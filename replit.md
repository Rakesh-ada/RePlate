# Overview

RePlate Campus is a comprehensive web application designed to reduce food waste on university campuses by connecting students with discounted surplus food items from campus canteens. The platform features a dual-user system where staff can list available food items with discounted pricing and students can browse, claim, and pick up meals using claim codes for verification.

The application implements a modern full-stack architecture with real-time food listings, secure authentication, a comprehensive claim code system, and a food donation management system for NGO partnerships that ensures expired food items are redirected to help those in need.

## Recent Changes

**August 19, 2025 - Food Donation System Implementation:**
- Added complete donation management system for expired food items
- Created food donations database schema with NGO tracking
- Implemented staff dashboard donation tab with transfer and management capabilities
- Added backend APIs for donation operations (transfer, reserve, collect)
- Integrated automated expired food item transfer to donation pool
- Built NGO reservation system with contact information management
- Updated currency display to Indian Rupees (₹) throughout application

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side application is built using React 18 with TypeScript and follows modern React patterns:

- **Component Architecture**: Utilizes shadcn/ui components built on Radix UI primitives for consistent, accessible UI elements
- **Styling System**: Implements Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: Uses React Query (@tanstack/react-query) for server state management and React hooks for local state
- **Routing**: Implements wouter for lightweight client-side routing with role-based access control
- **Form Handling**: Integrates react-hook-form with Zod validation for type-safe form management

## Backend Architecture

The server follows an Express.js-based REST API pattern with TypeScript:

- **API Layer**: RESTful endpoints organized in routes with middleware for authentication and error handling
- **Database Layer**: Uses Drizzle ORM with PostgreSQL for type-safe database operations and schema management
- **Storage Pattern**: Implements a storage interface pattern for data access, providing abstraction over database operations
- **Authentication System**: Integrates Replit's OpenID Connect authentication with session management

## Data Storage Solutions

- **Primary Database**: PostgreSQL with Neon serverless hosting for scalable data storage
- **ORM**: Drizzle ORM providing type-safe database queries and automatic TypeScript inference
- **Session Storage**: PostgreSQL-backed session storage using connect-pg-simple for persistent user sessions
- **Schema Management**: Centralized schema definitions in TypeScript with automatic validation using drizzle-zod

## Authentication and Authorization

- **Authentication Provider**: Replit Auth using OpenID Connect for secure user authentication
- **Session Management**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Role-Based Access**: Dual user roles (student/staff) with different dashboard access and permissions
- **Middleware Protection**: Route-level authentication middleware protecting API endpoints

## Claim Code System

- **Generation**: Custom claim code generation for meal claims with unique identifiers
- **Verification**: Server-side claim code validation for meal pickup confirmation
- **Status Tracking**: Comprehensive claim status management (reserved, claimed, expired, cancelled)

## Key Data Models

- **Users**: Profile management with role differentiation and contact information
- **Food Items**: Complete meal metadata including pricing, availability, and canteen details
- **Food Claims**: Relationship tracking between users and claimed meals with claim codes
- **Sessions**: Secure session storage for authentication persistence

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management toolkit

## Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware with OpenID Connect strategy

## Frontend Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **React Query**: Server state management and caching
- **React Hook Form**: Form state management with validation

## Development Tools
- **Vite**: Frontend build tool with development server
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast JavaScript bundler for production builds

## Utility Libraries
- **Zod**: Runtime type validation and schema definition
- **Date-fns**: Date manipulation and formatting utilities
- **Nanoid**: Unique identifier generation for various entities