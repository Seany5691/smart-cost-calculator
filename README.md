# Smart Cost Calculator

A modern, professional deal cost calculator application built with React, Next.js, and TypeScript.

## Features

- **User Management**: Role-based access control (Admin, Manager, User)
- **Deal Calculator**: Multi-tabbed interface for comprehensive cost calculations
- **Admin Panel**: Configuration management for hardware, licensing, connectivity, factors, and scales
- **PDF Generation**: Professional deal breakdown reports
- **Data Persistence**: JSON-based storage for all configurations and deal data
- **Modern UI**: Beautiful, responsive design with gradients and modern styling

## Tech Stack

- **Frontend**: React 18, Next.js 15, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **PDF Generation**: jsPDF, jsPDF-AutoTable
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Admin User

- **Username**: Camryn
- **Password**: Elliot6242!

## Deployment

This application is configured for deployment on Vercel with the following features:

- **API Routes**: Serverless functions for data management
- **Static Generation**: Optimized for performance
- **Environment Variables**: Secure configuration management

### Vercel Deployment Steps

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── calculator/        # Calculator pages
│   └── deals/             # Deal management
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── auth/             # Authentication
│   ├── calculator/       # Calculator components
│   ├── layout/           # Layout components
│   └── pdf/              # PDF generation
├── lib/                  # Utilities and types
├── store/                # Zustand stores
└── public/config/        # JSON configuration files
```

## Configuration Files

The application uses JSON files for configuration:

- `hardware.json` - Hardware items and pricing
- `licensing.json` - Licensing costs
- `connectivity.json` - Connectivity options
- `factors.json` - Financing factors
- `scales.json` - Installation and distance scales
- `deals.json` - Saved deal calculations

## License

This project is proprietary software.
