import Modal from './Modal';

interface ImpressumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImprintModal = ({ isOpen, onClose }: ImpressumModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Impressum">
      <div className="space-y-4 text-sm text-gray-700 max-h-[70vh] overflow-y-auto px-1">
        <p><strong>Neighborly Ltd.</strong><br />
        Beispielstraße 12<br />
        12345 Berlin<br />
        Deutschland</p>

        <p>Telefon: +49 (0)30 12345678<br />
        E-Mail: kontakt@neighborly-app.de<br />
        Web: <a href="https://www.neighborly-app.de" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">www.neighborly-app.de</a></p>

        <p>Geschäftsführung: Max Mustermann<br />
        Handelsregister: Amtsgericht Berlin, HRB 123456<br />
        USt-ID: DE123456789</p>

        <p>Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV:<br />
        Max Mustermann, Adresse wie oben</p>
      </div>
    </Modal>
  );
};

export default ImprintModal;
