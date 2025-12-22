# SpinSync - Student Laundry Management

SpinSync is a modern, efficient laundry management system designed specifically for university students. It streamlines the process of submitting, tracking, and managing laundry orders with a user-friendly interface and real-time status updates through QR code technology.

## Core Features

### For Students
- **Order Placement**: Simple categorization (Men's Wear, Women's Wear, Bedding) and item selection.
- **Subscription Management**: Access to laundry plans with easy payment integration.
- **Order Tracking**: Keep track of current and past orders.
- **QR Confirmation**: Scan laundry bag QR codes to confirm delivery and pickup.
- **Profile Management**: Maintain student ID, contact information, and preferences.

### For Administrators
- **Admin Dashboard**: Comprehensive overview of all orders and users.
- **QR Operations**: Specialized scanners for receiving laundry from students and returning processed items.
- **Price Management**: Control item pricing and categories dynamically.
- **User Verification**: Secure admin login and protected management routes.

## Technical Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Form Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)

## Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or pnpm

### Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## Copyright Notice

© 2025 SpinSync. All Rights Reserved.

This is proprietary and confidential software. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without the express written permission of the copyright holder.
