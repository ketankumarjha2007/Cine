import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext.jsx';
import { LocationProvider } from './context/LocationContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';

// Customer Pages
import Home from './pages/Home.jsx';
import MovieDetails from './pages/MovieDetails.jsx';
import ShowSelection from './pages/ShowSelection.jsx';
import SeatSelection from './pages/SeatSelection.jsx';
import Checkout from './pages/Checkout.jsx';
import BookingConfirmation from './pages/BookingConfirmation.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Profile from './pages/Profile.jsx';

// Auth Pages
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import NotFound from './pages/NotFound.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminMovies from './pages/admin/Movies.jsx';
import AdminTheatres from './pages/admin/Theatres.jsx';
import AdminScreens from './pages/admin/Screens.jsx';
import AdminShows from './pages/admin/Shows.jsx';
import AdminBanners from './pages/admin/Banners.jsx';
import AdminBookings from './pages/admin/Bookings.jsx';
import AdminReports from './pages/admin/Reports.jsx';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BookingProvider>
          <Routes>
            {/* Public Discovery Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/theatres" element={<ShowSelection />} />
            <Route
              path="/seats/:showId"
              element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              }
            />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Authenticated Customer Routes */}
            <Route
              path="/checkout/:bookingId"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/confirmation/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Console Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/movies"
              element={
                <AdminRoute>
                  <AdminMovies />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/theatres"
              element={
                <AdminRoute>
                  <AdminTheatres />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/screens"
              element={
                <AdminRoute>
                  <AdminScreens />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/shows"
              element={
                <AdminRoute>
                  <AdminShows />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/banners"
              element={
                <AdminRoute>
                  <AdminBanners />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <AdminRoute>
                  <AdminBookings />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <AdminRoute>
                  <AdminReports />
                </AdminRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BookingProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
