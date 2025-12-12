# Vallaroo Business Web

Web portal for Vallaroo shop owners to manage their business, inventory, and orders. Built with Next.js (App Router) and Supabase.

## Overview
Vallaroo Business Web allows merchants to control their online presence effectively. From this dashboard, business owners can manage their product catalog, view incoming orders, and update their shop profile details.

## Features
- 🔐 **Authentication**: Secure Google OAuth & Email login/signup via Supabase.
- 📊 **Dashboard**: Real-time overview of shop performance and metrics.
- 📦 **Inventory Management**: Create, update, and delete products easily.
- 📝 **Order Management**: View and process customer orders.
- ⚙️ **Settings**: Configure shop details, business hours, and contact info.
- 📱 **Responsive Design**: Optimized for both desktop and mobile management.

## Tech Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase project set up

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vallaroo-org/vallaroo_business_web.git
   cd vallaroo_business_web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment
This project is optimized for deployment on [Vercel](https://vercel.com/).
Ensure environment variables are correctly set in the Vercel project settings.

## Contributing
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
