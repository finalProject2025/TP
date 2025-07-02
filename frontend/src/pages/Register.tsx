import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    postal_code: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      return false;
    }
    if (!formData.postal_code.match(/^\d{5}$/)) {
      setError("Bitte gib eine gültige 5-stellige Postleitzahl ein");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate("/posts");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Konto erstellen
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Bereits ein Konto?{" "}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Hier anmelden
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Vorname
                </label>
                <div className="mt-1">
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nachname
                </label>
                <div className="mt-1">
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Mustermann"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="max@beispiel.de"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="postal_code"
                className="block text-sm font-medium text-gray-700"
              >
                Postleitzahl
              </label>
              <div className="mt-1">
                <input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  pattern="[0-9]{5}"
                  required
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="12345"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Passwort
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Passwort bestätigen
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Passwort wiederholen"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-900"
              >
                Ich stimme den{" "}
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-500"
                >
                  Nutzungsbedingungen
                </Link>{" "}
                und der{" "}
                <Link
                  to="/privacy"
                  className="text-primary-600 hover:text-primary-500"
                >
                  {t("privacyPolicy", "Datenschutzerklärung")}
                </Link>{" "}
                zu
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner
                      size="sm"
                      showText={false}
                      className="mr-2"
                    />
                    Konto wird erstellt...
                  </>
                ) : (
                  "Konto erstellen"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Probleme bei der Registrierung?{" "}
              <Link
                to="/contact"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Support kontaktieren
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
