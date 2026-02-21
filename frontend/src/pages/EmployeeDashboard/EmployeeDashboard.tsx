import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/shared/Navbar';
import Sidebar from '../../components/shared/Sidebar';
import AIAssistant from '../../components/shared/AIAssistant';
import DashboardOverview from './tabs/DashboardOverview';
import ClockInOut from './tabs/ClockInOut';
import MyAttendance from './tabs/MyAttendance';
import MyPerformance from './tabs/MyPerformance';
import MyWallet from './tabs/MyWallet';
import MyPayslips from './tabs/MyPayslips';
import LeaveRequest from './tabs/LeaveRequest';
import Holidays from './tabs/Holidays';
import AttendanceHistory from './tabs/AttendanceHistory';

export const employeeRenderContent = (activeTab: string, setActiveTab?: (tab: string) => void) => {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardOverview />;
    case 'clock':
      return <ClockInOut />;
    case 'attendance':
      return <MyAttendance />;
    case 'attendancehistory':
      return <AttendanceHistory />;
    case 'performance':
      return <MyPerformance />;
    case 'wallet':
      return <MyWallet />;
    case 'payslips':
      return <MyPayslips />;
    case 'leave-request':
      return <LeaveRequest />;
    case 'holidays':
      return <Holidays />;
    default:
      return <DashboardOverview />;
  }
};

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <div className="flex">
        <Sidebar role="employee" activeTab={activeTab} onTabChange={setActiveTab} />
        <motion.main
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-6 overflow-y-auto"
        >
          {employeeRenderContent(activeTab, setActiveTab)}
        </motion.main>
      </div>
      <AIAssistant userRole="employee" />
    </div>
  );
}