import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SimplePostsPage from './components/SimplePostsPage';
import MessagesPage from './components/MessagesPage';
import ToastProvider from './hooks/ToastProvider';
import Impressum from './pages/Impressum';

function App() {
  return (
    <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reset-password" element={<Landing />} />
          <Route path="/posts" element={<SimplePostsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/impressum" element={<Impressum />} />
        </Routes>
    </ToastProvider>
  );
}

export default App;