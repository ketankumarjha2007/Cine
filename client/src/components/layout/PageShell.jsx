import React from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import BottomNav from './BottomNav.jsx';
import './PageShell.css';

export default function PageShell({ children, showFooter = true }) {
  return (
    <div className="page-shell-layout">
      <Navbar />
      <main className="page-shell-content">
        {children}
      </main>
      {showFooter && <Footer />}
      <BottomNav />
    </div>
  );
}
