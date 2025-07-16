// src/components/CodeOfConductModal.tsx
import React from 'react';
import Modal from './Modal';
import CodeOfConduct from './CodeOfConduct';

interface CodeOfConductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CodeOfConductModal: React.FC<CodeOfConductModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verhaltenskodex">
      <CodeOfConduct />
    </Modal>
  );
};

export default CodeOfConductModal;
