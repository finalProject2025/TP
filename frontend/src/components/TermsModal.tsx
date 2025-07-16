import Modal from './Modal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal = ({ isOpen, onClose }: TermsModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nutzungsbedingungen">
      <div className="space-y-4 text-sm text-gray-700 max-h-[70vh] overflow-y-auto px-1">
        <p><strong>Stand:</strong> 14. Juli 2025<br />
        <strong>Gültigkeit:</strong> Mit der Registrierung erkennen Sie diese Bedingungen und Hinweise an.<br />
        Die jeweils aktuelle Fassung finden Sie in der App unter „Rechtliches“.</p>

        <h3 className="font-semibold mt-4">1. Geltungsbereich</h3>
        <p>
          Diese Nutzungsbedingungen gelten für die Nutzung der Nachbarschaftshilfe-App <strong>Neighborly</strong>.
          Mit der Registrierung und Nutzung der App erkennen Sie diese Bedingungen an.
        </p>

        <h3 className="font-semibold mt-4">2. Leistungen der App</h3>
        <p>
          Die App dient der Vermittlung von Hilfeleistungen unter Nachbar:innen
          (z. B. Einkaufen, Gassi gehen, handwerkliche Hilfe).
        </p>

        <h3 className="font-semibold mt-4">3. Registrierung & Benutzerkonto</h3>
        <p>
          Zur Nutzung ist eine Registrierung notwendig. Nutzer:innen müssen mindestens 16 Jahre alt sein
          und korrekte Angaben machen.
        </p>

        <h3 className="font-semibold mt-4">4. Verantwortung der Nutzer:innen</h3>
        <ul className="list-disc list-inside">
          <li>Selbstverantwortung bei Absprachen, Terminen und Durchführung.</li>
          <li>Keine illegalen, diskriminierenden oder werbenden Inhalte.</li>
          <li>Kein Missbrauch der App.</li>
        </ul>

        <h3 className="font-semibold mt-4">5. Haftungsausschluss</h3>
        <p>
          Die App übernimmt keine Haftung für Schäden, die aus Vereinbarungen zwischen Nutzer:innen entstehen.
        </p>

        <h3 className="font-semibold mt-4">6. Kündigung und Sperrung</h3>
        <p>
          Bei Verstößen kann das Nutzerkonto gesperrt oder gelöscht werden.
        </p>

        <h3 className="font-semibold mt-4">7. Änderungen</h3>
        <p>
          Änderungen der Bedingungen werden per App-Mitteilung kommuniziert. Die aktuelle Version ist
          unter „Rechtliches“ einsehbar.
        </p>
      </div>
    </Modal>
  );
};

export default TermsModal;
