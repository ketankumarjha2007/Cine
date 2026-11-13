import React from 'react';
import { NavLink } from 'react-router-dom';
import { Film, Clapperboard, Ticket, User } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  return (
    <nav className="bottom-nav mobile-only" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
        end
      >
        <Film size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/theatres"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
      >
        <Clapperboard size={20} />
        <span>Theatres</span>
      </NavLink>

      <NavLink
        to="/my-bookings"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
      >
        <Ticket size={20} />
        <span>Bookings</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
