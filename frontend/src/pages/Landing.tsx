import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import ProfileModal from "../components/ProfileModal";
import HelpOffersModal from "../components/HelpOffersModal";
import ChatModal from "../components/ChatModal";
import { simpleApi } from "../services/simpleApi";
import ResetPasswordModal from '../components/ResetPasswordModal';
import { useNotifications } from "../hooks/useNotifications";
import type { User } from '../types';

function Landing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHelpOffersModalOpen, setIsHelpOffersModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatModalData, setChatModalData] = useState<{
    otherUserId: string;
    otherUserName: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    checkAuthStatus();
    // Prüfe, ob die URL /reset-password enthält
    console.log('Current pathname:', location.pathname);
    console.log('Current search:', location.search);
    if (location.pathname === '/reset-password') {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const email = params.get('email');
      console.log('Token:', token);
      console.log('Email:', email);
      if (token && email) {
        setResetToken(token);
        setResetEmail(decodeURIComponent(email));
        setShowResetModal(true);
        console.log('Setting modal to true');
      }
    } else {
      setShowResetModal(false);
    }
  }, [location]);

  const checkAuthStatus = () => {
    const authenticated = simpleApi.isAuthenticated();
    const user = simpleApi.getCurrentUser();
    setIsAuthenticated(authenticated);
    setCurrentUser(user);
  };

  const openLoginModal = () => {
    setIsRegisterModalOpen(false);
    setIsProfileModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const openRegisterModal = () => {
    setIsLoginModalOpen(false);
    setIsProfileModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const openProfileModal = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(false);
    setIsProfileModalOpen(true);
  };

  const closeModals = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(false);
    setIsProfileModalOpen(false);
    // Check auth status after modal closes (in case user logged in)
    setTimeout(checkAuthStatus, 100);
  };

  const handleLogout = () => {
    simpleApi.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsMobileMenuOpen(false);
  };

  // const handleOpenHelpOffers = () => {
  //   setIsHelpOffersModalOpen(true);
  // };

  const handleStartChat = (otherUserId: string, otherUserName: string) => {
    setChatModalData({ otherUserId, otherUserName });
    setIsChatModalOpen(true);
    setIsHelpOffersModalOpen(false); // Close help offers modal
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    // Nach Schließen Modal auf Startseite weiterleiten
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 backdrop-blur-sm bg-opacity-95">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Neighborly
              </span>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {isAuthenticated && (
                <div className="relative">
                  <Link
                    to="/messages"
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span className="hidden lg:inline">Nachrichten</span>
                  </Link>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs font-semibold flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              )}
              {isAuthenticated && (
                <Link
                  to="/posts"
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <span className="hidden lg:inline">Hilfe-Anfragen</span>
                </Link>
              )}

              {isAuthenticated ? (
                // Logged in state
                <div className="flex items-center space-x-4">
                  <span className="hidden xl:inline text-gray-700 font-medium">
                    Willkommen, {currentUser?.first_name}!
                  </span>
                  <button
                    onClick={openProfileModal}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="hidden lg:inline">Profil</span>
                  </button>
                </div>
              ) : (
                // Logged out state
                <>
                  <button
                    onClick={openLoginModal}
                    className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  >
                    Anmelden
                  </button>
                  <button
                    onClick={openRegisterModal}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-semibold"
                  >
                    Registrieren
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-4">
              {isAuthenticated ? (
                <>
                  {/* User Welcome */}
                  <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {currentUser?.first_name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {currentUser?.first_name} {currentUser?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <Link
                    to="/messages"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="relative">
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs font-semibold flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">
                      Nachrichten
                    </span>
                  </Link>

                  <Link
                    to="/posts"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">
                      Hilfe-Anfragen
                    </span>
                  </Link>

                  <button
                    onClick={() => {
                      openProfileModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">Profil</span>
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors w-full text-left border-t border-gray-100 mt-4 pt-4"
                  >
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="font-medium text-red-600">Abmelden</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Login/Register for non-authenticated users */}
                  <button
                    onClick={() => {
                      openLoginModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">Anmelden</span>
                  </button>

                  <button
                    onClick={() => {
                      openRegisterModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Registrieren
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative container-custom py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <div className="w-4 h-4 bg-blue-600 rounded-sm mr-2"></div>
                Neu: Jetzt auch in Ihrer Stadt verfügbar!
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Ihre{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Nachbarschaft
                </span>
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>neu entdecken
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                Verbinden Sie sich mit hilfsbereiten Menschen in Ihrer Nähe.
                Teilen, helfen und gemeinsam eine stärkere Gemeinschaft
                aufbauen.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={openRegisterModal}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center text-base sm:text-lg"
                >
                  <span>Kostenlos starten</span>
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
                {isAuthenticated && (
                  <Link
                    to="/posts"
                    className="group bg-white text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center text-base sm:text-lg"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      Hilfe-Anfragen ansehen
                    </span>
                    <span className="sm:hidden">Anfragen ansehen</span>
                  </Link>
                )}
                {!isAuthenticated && (
                  <button
                    onClick={openLoginModal}
                    className="group bg-white text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center text-base sm:text-lg"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Anmelden</span>
                  </button>
                )}
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="ml-3">2.500+ aktive Nachbarn</span>
                </div>
                <div className="flex items-center">
                  <span className="text-yellow-400">★★★★★</span>
                  <span className="ml-1">4.9/5 Bewertung</span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative mt-12 lg:mt-0">
              <div className="relative z-10">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">MK</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">Maria K.</h3>
                      <p className="text-sm text-gray-500">Musterstraße 15</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "Suche jemanden, der mir beim Einkaufen helfen kann. Bin 78
                    Jahre alt und komme nicht mehr so gut raus."
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      Einkaufen
                    </span>
                    <span className="text-sm text-gray-500">vor 2 Stunden</span>
                  </div>
                </div>

                {/* Floating Response Card */}
                <div className="absolute -bottom-4 -right-4 bg-blue-600 text-white rounded-xl p-4 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">TM</span>
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium">Tom M. hilft gerne!</p>
                      <p className="text-xs opacity-90">
                        Kann heute Nachmittag
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Elements */}
              <div className="absolute top-4 right-4 w-20 h-20 bg-yellow-200 rounded-full opacity-60 animate-bounce delay-1000"></div>
              <div className="absolute bottom-8 left-4 w-16 h-16 bg-pink-200 rounded-full opacity-60 animate-bounce delay-2000"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-white to-gray-50 py-20">
        <div className="container-custom">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Wie funktioniert es?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              In nur wenigen Schritten können Sie Teil einer hilfsbereiten
              Nachbarschaftsgemeinschaft werden.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all shadow-md">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Hilfe anbieten
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Teilen Sie Ihre Fähigkeiten mit der Nachbarschaft. Ob
                Gartenarbeit, Einkaufen oder handwerkliche Hilfe – jede
                Unterstützung zählt.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all shadow-md">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Hilfe finden
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Stellen Sie eine Anfrage und finden Sie hilfsbereite Nachbarn in
                Ihrer Nähe. Von kleinen Gefälligkeiten bis zu größeren
                Projekten.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all shadow-md">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Gemeinschaft stärken
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Bauen Sie echte Verbindungen auf und schaffen Sie eine starke,
                unterstützende Nachbarschaftsgemeinschaft.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24"></div>
        </div>
        <div className="container-custom text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Bereit, Ihre Nachbarschaft zu entdecken?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Schließen Sie sich Tausenden von hilfsbereiten Nachbarn an und
            machen Sie den ersten Schritt.
          </p>
          <button
            onClick={openRegisterModal}
            className="bg-white text-blue-600 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-lg text-base sm:text-lg"
          >
            Jetzt kostenlos registrieren →
          </button>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeModals}
        onSwitchToRegister={openRegisterModal}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={closeModals}
        onSwitchToLogin={openLoginModal}
      />
      <ProfileModal isOpen={isProfileModalOpen} onClose={closeModals} />
      <HelpOffersModal
        isOpen={isHelpOffersModalOpen}
        onClose={() => setIsHelpOffersModalOpen(false)}
        onStartChat={handleStartChat}
      />
      {chatModalData && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setChatModalData(null);
          }}
          otherUserId={chatModalData.otherUserId}
          otherUserName={chatModalData.otherUserName}
        />
      )}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={handleCloseResetModal}
        email={resetEmail}
        token={resetToken}
      />
    </div>
  );
}

export default Landing;
