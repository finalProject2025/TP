import React, { useState } from 'react';
import LegalModal from './LegalModal';
import { getModalContent } from '../utils/legalContent';

const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'impressum' | 'datenschutz' | 'nutzungsbedingungen' | null>(null);

  const openModal = (modal: 'impressum' | 'datenschutz' | 'nutzungsbedingungen') => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <footer className="bg-white text-black py-8 shadow-[0_-8px_24px_1px_rgba(0,0,0,0.1)]">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright - Links */}
            <div className="text-sm text-black">
              © {new Date().getFullYear()} Neighborly. Alle Rechte vorbehalten.
            </div>
            
            {/* Links - Rechts */}
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <button
                onClick={() => openModal('impressum')}
                className="text-black hover:text-purple-600 transition-colors"
              >
                Impressum
              </button>
              <button
                onClick={() => openModal('datenschutz')}
                className="text-black hover:text-purple-600 transition-colors"
              >
                Datenschutz
              </button>
              <button
                onClick={() => openModal('nutzungsbedingungen')}
                className="text-black hover:text-purple-600 transition-colors"
              >
                Nutzungsbedingungen
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      {activeModal && (
        <LegalModal
          isOpen={true}
          onClose={closeModal}
          title={
            activeModal === 'impressum' ? 'Impressum' :
            activeModal === 'datenschutz' ? 'Datenschutzerklärung' :
            'Nutzungsbedingungen'
          }
          content={getModalContent(activeModal)}
        />
      )}
    </>
  );
};

export default Footer;