import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SimplePostsPage from './components/SimplePostsPage';
import MessagesPage from './components/MessagesPage';
import ToastProvider from './hooks/ToastProvider';
import TermsPage from './pages/TermsPage';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reset-password" element={<Landing />} />
          <Route path="/posts" element={<SimplePostsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;