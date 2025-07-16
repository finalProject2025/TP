import React from 'react';
import Modal from './Modal';

interface DatenschutzModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function DatenschutzModal({ isOpen, onClose }: DatenschutzModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Datenschutzerklärung">
      <div className="space-y-4 text-sm text-gray-700 max-h-[60vh] overflow-y-auto pr-2">
        <p><strong>1. Verantwortliche Stelle</strong><br />
        Neighborly Ltd., Beispielstraße 12, 12345 Berlin<br />
        E-Mail: kontakt@neighborly-app.de</p>

        <p><strong>2. Erhobene Daten</strong><br />
        Name, E-Mail, Adresse; freiwillige Standortfreigabe; Nutzungsaktivitäten</p>

        <p><strong>3. Zweck der Verarbeitung</strong><br />
        Vermittlung von Hilfe, Kommunikation, Verbesserung der App</p>

        <p><strong>3a. Rechtsgrundlagen</strong><br />
        DSGVO Art. 6 Abs. 1 lit. a, b, f</p>

        <p><strong>4. Weitergabe von Daten</strong><br />
        Keine Weitergabe ohne Einwilligung – außer gesetzlich erforderlich</p>

        <p><strong>5. Speicherdauer</strong><br />
        Bis zur Löschung des Nutzerkontos</p>

        <p><strong>6. Rechte der Betroffenen</strong><br />
        Auskunft, Berichtigung, Löschung, Widerspruch, etc.</p>

        <p><strong>7. Sicherheit</strong><br />
        Daten werden verschlüsselt übertragen und gespeichert</p>
      </div>
    </Modal>
  );
}

export default DatenschutzModal;
