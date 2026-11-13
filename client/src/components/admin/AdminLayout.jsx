import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Building,
  Monitor,
  Calendar,
  Image,
  Ticket,
  BarChart3
} from 'lucide-react';
import PageShell from '../layout/PageShell.jsx';
import './AdminLayout.css';

export default function AdminLayout({ children, title, subtitle, actions = null }) {
  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/movies', label: 'Movies', icon: Film },
    { to: '/admin/theatres', label: 'Theatres', icon: Building },
    { to: '/admin/screens', label: 'Screens & Seats', icon: Monitor },
    { to: '/admin/shows', label: 'Shows', icon: Calendar },
    { to: '/admin/banners', label: 'Banners', icon: Image },
    { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <PageShell>
      <div className="container admin-container">
        {/* Admin Navigation Pills / Bar */}
        <aside className="admin-sidebar">
          <div className="admin-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </aside>

        {/* Admin Page Content */}
        <main className="admin-main">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">{title}</h1>
              {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="admin-header-actions">{actions}</div>}
          </div>
          <div className="admin-body">
            {children}
          </div>
        </main>
      </div>
    </PageShell>
  );
}
