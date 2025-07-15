import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="w-full py-4 text-center text-gray-500 text-sm bg-gray-50 border-t">
    <Link to="/impressum" className="underline hover:text-blue-600">
      Impressum
    </Link>
  </footer>
);

export default Footer;