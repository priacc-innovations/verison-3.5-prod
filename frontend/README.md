# MAMA - Modern Attendance Management Application

Your Smart HR & Attendance Companion Powered by AI

## Features

### Admin Portal
- Company-wide dashboard with analytics
- View all employees and their details
- Monthly attendance summary
- Performance tracking with trends
- Leave request approval/rejection
- Holiday calendar management
- Create announcements
- HR account management

### HR Portal
- Employee management (view all 10 employees)
- **Add new employees with Employee ID**
- Mark attendance manually
- Performance review system
- Salary management (wallet updates)
- Add performance notes and ratings

### Employee Portal
- Personal dashboard with today's status
- **Clock In / Clock Out functionality**
- Real-time working hours tracker
- Attendance log (day/week/month view)
- Performance dashboard with ratings
- Salary wallet with earnings tracker
- Leave request submission
- Holiday calendar view

### AI Assistant
- Intelligent insights on attendance
- Performance analysis
- Leave suggestions
- Salary tracking information

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State Management**: Zustand
- **Database**: Supabase
- **Icons**: Lucide React

## Login Credentials

### Admin
- Email: admin@mama.com
- Password: Admin@123

### HR
- Email: hr@mama.com
- Password: HR@123

### Employee
- Email: employee@mama.com
- Password: Emp@123

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## System Data

The application comes pre-loaded with:
- **10 Mock Employees** with realistic data across Engineering, Sales, and Marketing departments
- **Attendance Records** for all employees for the current month (automatically generated with 95% attendance rate)
- **Performance Reviews** for each employee with ratings and feedback
- **Leave Requests** from multiple employees
- **Salary Wallets** tracking monthly earnings based on attendance

All employees can log in with their email addresses and password `Emp@123` (except admin and HR accounts).

## Features Highlights

- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on all devices
- **Glassmorphism UI**: Modern, premium design
- **Animated Transitions**: Smooth page and component animations
- **AI-Powered Insights**: Smart assistant for data analysis
- **Role-Based Access**: Separate dashboards for each role
- **Real-time Updates**: Connected to Supabase database

## Project Structure

```
src/
├── components/
│   ├── shared/         # Shared components (Navbar, Sidebar, etc.)
│   └── ui/             # UI components (Button, Card, Input)
├── pages/
│   ├── Auth/           # Login page
│   ├── AdminDashboard/ # Admin portal
│   ├── HRDashboard/    # HR portal
│   └── EmployeeDashboard/ # Employee portal
├── store/              # Zustand state management
├── lib/                # Supabase client
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## Database Schema

- **users**: User accounts with roles
- **attendance**: Daily attendance records
- **performance**: Weekly/monthly performance reviews
- **leave_requests**: Leave applications
- **wallet**: Salary tracking
- **holidays**: Company holidays
- **announcements**: Admin announcements

## Attendance Logic

- Working hours: 9:00 AM - 6:00 PM
- Grace period: 9:00 - 9:05 AM
- Late login: After 9:05 AM
- Early logout: Before 6:00 PM
- Half day: Late login + Early logout
- Auto weekend credit: If Friday & Monday both present

## Wallet System

- Daily salary credited based on attendance
- Half day = 50% credit
- Absent = 0 credit
- Approved leave = full credit
- Monthly summary with progress tracking
