import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import SimplePostsPage from './components/SimplePostsPage';
import MessagesPage from './components/MessagesPage';
import AppLayout from './components/AppLayout';
import ToastProvider from './hooks/ToastProvider';
import { simpleApi } from './services/simpleApi';
import CookieBanner from './components/CookieBanner';
import EmailVerificationModal from './components/EmailVerificationModal';

// URL-Parameter-Handler Komponente
function EmailVerificationHandler() {
  const [searchParams] = useSearchParams();
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (token && email) {
      setVerificationToken(token);
      setVerificationEmail(decodeURIComponent(email));
      setShowEmailVerification(true);
    }
  }, [searchParams]);

  return (
    <EmailVerificationModal
      isOpen={showEmailVerification}
      onClose={() => setShowEmailVerification(false)}
      email={verificationEmail}
      token={verificationToken}
    />
  );
}

function App() {
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoogleClientId = async () => {
      try {
        const clientId = await simpleApi.getGoogleClientId();
        setGoogleClientId(clientId);
      } catch (error) {
        console.error('Error loading Google Client ID:', error);    
      } finally {
        setLoading(false);
      }
    };

    void loadGoogleClientId();
  }, []);

  // Cookie-Handler Funktionen
  const handleCookieAccept = () => {
    // Analytics aktivieren (falls vorhanden)
    console.log('Cookies akzeptiert');
  };

  const handleCookieDecline = () => {
    // Analytics deaktivieren
    console.log('Cookies abgelehnt');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Lade...</span>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ToastProvider>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/reset-password" element={<Landing />} />
              <Route path="/verify-email" element={<Landing />} />
              <Route path="/posts" element={<SimplePostsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
            </Routes>
          </AppLayout>
          <EmailVerificationHandler />
          <CookieBanner 
            onAccept={handleCookieAccept}
            onDecline={handleCookieDecline}
          />
        </Router>
      </ToastProvider>
    </GoogleOAuthProvider>
  );
}

export default App;