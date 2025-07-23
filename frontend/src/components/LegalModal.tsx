import React from 'react';
import Modal from './Modal';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="max-h-[70vh] overflow-y-auto pr-2 w-full">
        <div className="prose prose-sm sm:prose-base max-w-none ">
          {content}
        </div>
      </div>
    </Modal>
  );
};

export default LegalModal; 