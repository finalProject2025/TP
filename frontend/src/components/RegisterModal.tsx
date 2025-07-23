import React, { useState } from "react";
import Modal from "./Modal";
import LegalModal from "./LegalModal";
import EmailVerificationModal from "./EmailVerificationModal";
import { simpleApi } from "../services/simpleApi";
import { useToast } from "../hooks/useToast";
import { useLoadingState } from "../hooks/useLoadingState";
import { validatePassword } from "../utils/validation";
import { inputStyle } from "../utils/styles";
import { getModalContent } from "../utils/legalContent.tsx";
import { PasswordInput } from "./PasswordInput";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: RegisterModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
    postalCode: "",
  });
  const { isLoading, error, setError, handleAsyncOperation } = useLoadingState();
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [firstNameErrors, setFirstNameErrors] = useState<string[]>([]);
  const [lastNameErrors, setLastNameErrors] = useState<string[]>([]);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);

  const validateName = (name: string): string[] => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Name ist erforderlich');
      return errors;
    }
    
    // Nur Buchstaben, Leerzeichen, Bindestriche und Umlaute erlauben
    if (!/^[a-zA-ZäöüßÄÖÜ\s-]+$/.test(name.trim())) {
      errors.push('Nur Buchstaben, Leerzeichen und Bindestriche erlaubt');
    }
    
    if (name.trim().length < 2) {
      errors.push('Name muss mindestens 2 Zeichen lang sein');
    }
    
    if (name.trim().length > 50) {
      errors.push('Name darf maximal 50 Zeichen lang sein');
    }
    
    return errors;
  };

  const validateEmail = (email: string): string[] => {
    const errors: string[] = [];
    
    if (!email.trim()) {
      errors.push('E-Mail-Adresse ist erforderlich');
      return errors;
    }
    
    // Basis-E-Mail-Format-Prüfung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Bitte geben Sie eine gültige E-Mail-Adresse ein');
    }
    
    // Längenprüfung
    if (email.trim().length > 254) {
      errors.push('E-Mail-Adresse ist zu lang');
    }
    
    // Lokaler Teil (vor @) Prüfung
    const localPart = email.split('@')[0];
    if (localPart && localPart.length > 64) {
      errors.push('Lokaler Teil der E-Mail-Adresse ist zu lang');
    }
    
    return errors;
  };
  const { showSuccess } = useToast();
  const [activeModal, setActiveModal] = useState<
    "impressum" | "datenschutz" | "nutzungsbedingungen" | null
  >(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Namens-Validierung
    if (name === "firstName") {
      setFirstNameErrors(validateName(value));
    }

    if (name === "lastName") {
      setLastNameErrors(validateName(value));
    }

    // E-Mail-Validierung
    if (name === "email") {
      setEmailErrors(validateEmail(value));
    }

    // Passwort-Validierung
    if (name === "password") {
      setPasswordErrors(validatePassword(value));
      setPasswordMatch(
        value === formData.confirmPassword || formData.confirmPassword === ""
      );
    }

    // Passwort-Bestätigung prüfen
    if (name === "confirmPassword") {
      setPasswordMatch(value === formData.password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validierung vor Submit
    const currentPasswordErrors = validatePassword(formData.password);
    const currentPasswordMatch = formData.password === formData.confirmPassword;
    const currentFirstNameErrors = validateName(formData.firstName);
    const currentLastNameErrors = validateName(formData.lastName);
    const currentEmailErrors = validateEmail(formData.email);

    setPasswordErrors(currentPasswordErrors);
    setPasswordMatch(currentPasswordMatch);
    setFirstNameErrors(currentFirstNameErrors);
    setLastNameErrors(currentLastNameErrors);
    setEmailErrors(currentEmailErrors);

    // Name validation
    if (currentFirstNameErrors.length > 0 || currentLastNameErrors.length > 0) {
      setError("Bitte korrigieren Sie die Namensfehler");
      return;
    }

    // E-Mail validation
    if (currentEmailErrors.length > 0) {
      setError("Bitte korrigieren Sie die E-Mail-Adresse");
      return;
    }

    if (currentPasswordErrors.length > 0 || !currentPasswordMatch) {
      return;
    }

    try {
      const response = await handleAsyncOperation(
        () => simpleApi.register({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          postal_code: formData.postalCode,
        }),
        "Fehler bei der Registrierung"
      );

      // Prüfen ob E-Mail-Validierung erforderlich ist
      if (response.requiresEmailVerification) {
        setRegisteredEmail(formData.email);
        setShowEmailVerification(true);
        showSuccess("Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails.");
        
        // Form zurücksetzen aber Modal nicht schließen
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          address: "",
          postalCode: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        // Show success message
        showSuccess(
          `Willkommen, ${response.user.first_name}! Registrierung erfolgreich.`
        );

        // Close modal and reset form
        onClose();
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          address: "",
          postalCode: "",
          password: "",
          confirmPassword: "",
        });

        // Optionally redirect or update app state
        window.location.reload(); // Simple reload for demo
      }
    } catch {
      // Error is already handled by handleAsyncOperation
    }
  };

  const openModal = (
    modal: "impressum" | "datenschutz" | "nutzungsbedingungen"
  ) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Konto erstellen">
        <div className="px-2 sm:px-4 md:px-6 lg:px-8">
          <p className="text-gray-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">
            Werden Sie Teil der Nachbarschaftsgemeinschaft
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Vorname *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Max"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                  aria-describedby="firstName-error"
                />
                {firstNameErrors.length > 0 && (
                  <div className="text-red-500 text-xs mt-1">
                    {firstNameErrors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nachname *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Mustermann"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                  aria-describedby="lastName-error"
                />
                {lastNameErrors.length > 0 && (
                  <div className="text-red-500 text-xs mt-1">
                    {lastNameErrors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                E-Mail-Adresse *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="max.mustermann@beispiel.de"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                aria-describedby="email-error"
              />
              {emailErrors.length > 0 && (
                <div className="text-red-500 text-xs mt-1">
                  {emailErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="Musterstraße 123, 12345 Stadt"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Passwort *
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                aria-describedby="password-error"
              />
              {passwordErrors.length > 0 && (
                <div className="text-red-500 text-xs mt-1">
                  {passwordErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Passwort bestätigen *
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                aria-describedby="confirm-password-error"
              />
              {!passwordMatch && formData.confirmPassword && (
                <div className="text-red-500 text-xs mt-1">
                  Passwörter stimmen nicht überein
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="postalCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Postleitzahl *
              </label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                required
                value={formData.postalCode}
                onChange={(e) => {
                  const value = e.target.value;
                  // Nur Ziffern erlauben und maximal 5 Zeichen
                  if (/^\d{0,5}$/.test(value)) {
                    handleChange(e);
                  }
                }}
                placeholder="12345"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                aria-describedby="postal-code-error"
              />

              <p className="text-xs text-gray-500 mt-1">
                Bitte geben Sie eine gültige 5-stellige deutsche Postleitzahl ein
              </p>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 mr-2"
                aria-describedby="terms-error"
              />
              <label className="text-xs sm:text-sm text-gray-600">
                Ich stimme den{" "}
                <button
                  type="button"
                  onClick={() => openModal("nutzungsbedingungen")}
                  className="!min-h-[15px] text-blue-600 hover:text-blue-500"
                  aria-label="Nutzungsbedingungen öffnen"
                >
                  Nutzungsbedingungen
                </button>{" "}
                und der{" "}
                <button
                  type="button"
                  onClick={() => openModal("datenschutz")}
                  className="!min-h-[15px] text-blue-600 hover:text-blue-500"
                  aria-label="Datenschutzerklärung öffnen"
                >
                  Datenschutzerklärung
                </button>{" "}
                zu.
              </label>
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                passwordErrors.length > 0 ||
                !passwordMatch ||
                !formData.password ||
                !formData.confirmPassword
              }
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isLoading ? "Konto wird erstellt..." : "Konto erstellen"}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Konto wird erstellt...
                </div>
              ) : (
                "Konto erstellen"
              )}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Bereits ein Konto?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Jetzt anmelden
              </button>
            </p>
          </div>
        </div>
      </Modal>

      {/* Legal Modals */}
      {activeModal && (
        <LegalModal
          isOpen={true}
          onClose={closeModal}
          title={
            activeModal === "impressum"
              ? "Impressum"
              : activeModal === "datenschutz"
                ? "Datenschutzerklärung"
                : "Nutzungsbedingungen"
          }
          content={getModalContent(activeModal)}
        />
      )}

      {/* E-Mail-Verifizierung Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => {
          setShowEmailVerification(false);
          onClose();
        }}
        email={registeredEmail}
      />
    </>
  );
}

export default RegisterModal;
