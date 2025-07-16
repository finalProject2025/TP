import { useNavigate } from "react-router-dom";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col justify-between">
      <main className="py-16 px-4 flex-grow">
        <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-md">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
            Nutzungsbedingungen
          </h1>

          <section className="space-y-6 text-sm sm:text-base leading-relaxed text-gray-800">
            <div>
              <h2 className="font-semibold text-blue-700">1. Geltungsbereich</h2>
              <p>
                Diese Nutzungsbedingungen gelten für die Nutzung der Nachbarschaftshilfe-App <strong>Neighborly</strong>.
                Mit der Registrierung und Nutzung der App erkennen Sie diese Bedingungen an.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-blue-700">2. Leistungen der App</h2>
              <p>
                Die App dient der Vermittlung von Hilfeleistungen unter Nachbar:innen
                (z. B. Einkaufen, Gassi gehen, handwerkliche Hilfe).
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-blue-700">3. Registrierung & Benutzerkonto</h2>
              <p>
                Zur Nutzung ist eine Registrierung notwendig. Nutzer:innen müssen mindestens 16 Jahre alt sein und korrekte Angaben machen.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-blue-700">4. Verantwortung der Nutzer:innen</h2>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Selbstverantwortung bei Absprachen und Durchführung von Hilfeleistungen.</li>
                <li>Keine illegalen, diskriminierenden oder kommerziellen Inhalte.</li>
                <li>Keine missbräuchliche Nutzung der App.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-blue-700">5. Haftungsausschluss</h2>
              <p>
                Die App übernimmt keine Haftung für Schäden, die aus Vereinbarungen zwischen Nutzer:innen entstehen.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-blue-700">6. Kündigung und Sperrung</h2>
              <p>
                Bei Verstößen gegen diese Bedingungen kann das Nutzerkonto gesperrt oder gelöscht werden.
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-blue-700">7. Änderungen</h2>
              <p>
                Wir behalten uns das Recht vor, diese Bedingungen zu ändern.
                Änderungen werden per App-Mitteilung kommuniziert.
              </p>
            </div>
          </section>

          {/* Zurück zur Startseite */}
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:shadow-md transition-transform hover:-translate-y-0.5"
            >
              Zurück zur Startseite
            </button>
          </div>
        </div>
      </main>

      {/* Optionaler Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} Neighborly – Gemeinsam helfen.
      </footer>
    </div>
  );
};

export default TermsPage;
