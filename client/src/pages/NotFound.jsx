import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import './NotFound.css';

export default function NotFound() {
  return (
    <PageShell>
      <div className="not-found-container">
        <Film size={64} className="not-found-icon" />
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-desc">
          The cinema reel you are looking for does not exist or has been moved to another screen.
        </p>
        <Link to="/" className="not-found-cta">
          <Button variant="primary" icon={Home} size="md">
            Return to Home
          </Button>
        </Link>
      </div>
    </PageShell>
  );
}
