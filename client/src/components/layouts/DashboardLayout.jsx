import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Building2, Users, Stethoscope, FlaskConical, DollarSign,
  CalendarDays, FileText, UserPlus, ClipboardList, LogOut, Menu, X, Moon, Sun,
  ChevronDown, Activity
} from 'lucide-react';

const roleNavItems = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Hospitals', icon: Building2, path: '/admin/hospitals' },
    { label: 'Doctors', icon: Stethoscope, path: '/admin/doctors' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Revenue', icon: DollarSign, path: '/admin/revenue' },
  ],
  hospital_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/hospital' },
    { label: 'Doctors', icon: Stethoscope, path: '/hospital/doctors' },
    { label: 'Staff', icon: Users, path: '/hospital/staff' },
    { label: 'Medical Tests', icon: FlaskConical, path: '/hospital/tests' },
    { label: 'Appointments', icon: CalendarDays, path: '/hospital/appointments' },
    { label: 'Reports', icon: FileText, path: '/hospital/reports' },
    { label: 'Profit', icon: DollarSign, path: '/hospital/profit' },
  ],
  receptionist: [
    { label: 'Schedules', icon: CalendarDays, path: '/receptionist' },
    { label: 'Book Appointment', icon: UserPlus, path: '/receptionist/book' },
  ],
  lab_staff: [
    { label: 'Patients', icon: ClipboardList, path: '/lab' },
    { label: 'Upload Report', icon: FileText, path: '/lab/upload' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.profile?.role || 'admin';
  const navItems = roleNavItems[role] || [];

  const roleTitles = {
    admin: 'VoxMed Admin',
    hospital_admin: 'Hospital Admin',
    receptionist: 'Receptionist',
    lab_staff: 'Lab Staff',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Activity className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            VoxMed
          </span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3">
          <span className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {roleTitles[role]}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== `/${role === 'admin' ? 'admin' : role === 'hospital_admin' ? 'hospital' : role}` && location.pathname.startsWith(item.path));

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t p-3 space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
