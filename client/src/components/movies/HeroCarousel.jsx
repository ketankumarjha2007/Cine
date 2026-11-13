import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Ticket, Film } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../common/Button.jsx';
import EmptyState from '../common/EmptyState.jsx';
import './HeroCarousel.css';

export default function HeroCarousel({ banners = [], fallbackMovies = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBookClick = (e, linkUrl) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', {
        state: { from: { pathname: linkUrl } }
      });
      return;
    }
    navigate(linkUrl);
  };

  // Determine slides: priority banners, fallback movie backdrops
  const slides = banners.length > 0
    ? banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        image_url: b.image_url,
        link_url: b.link_url || '/'
      }))
    : fallbackMovies.filter((m) => m.backdrop_url).map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: `${m.language} • ${m.genres?.slice(0, 3).join(', ')}`,
        image_url: m.backdrop_url,
        link_url: `/movie/${m.id}`
      }));

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="hero-carousel-empty">
        <EmptyState
          title="Welcome to CineTicket"
          description="Explore scheduled movies, book theatre seats, and enjoy cinematic entertainment."
          icon={Film}
        />
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="hero-carousel-root" role="region" aria-label="Featured Carousel">
      <div className="hero-carousel-slide">
        <img
          src={currentSlide.image_url}
          alt={currentSlide.title}
          className="hero-carousel-backdrop"
          loading="eager"
        />
        <div className="hero-carousel-gradient-overlay" />

        <div className="container hero-carousel-content">
          <div className="hero-slide-info">
            <h1 className="hero-slide-title">{currentSlide.title}</h1>
            {currentSlide.subtitle && (
              <p className="hero-slide-subtitle">{currentSlide.subtitle}</p>
            )}
            <div className="hero-slide-actions">
              <Button
                variant="primary"
                size="lg"
                icon={Ticket}
                onClick={(e) => handleBookClick(e, currentSlide.link_url)}
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-control-btn btn-prev"
            onClick={handlePrev}
            aria-label="Previous featured banner"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="carousel-control-btn btn-next"
            onClick={handleNext}
            aria-label="Next featured banner"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="carousel-dots-container">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
