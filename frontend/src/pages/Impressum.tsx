// src/pages/Impressum.tsx
import { Link } from "react-router-dom";

export default function Impressum() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-10 py-16 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <p className="font-semibold">Neighborly&nbsp;Ltd.</p>
        <p>
          Beispielstraße&nbsp;12<br />
          12345&nbsp;Berlin<br />
          Deutschland
        </p>

        <p className="mt-4">
          Telefon:&nbsp;+49&nbsp;(0)30&nbsp;12345678<br />
          E‑Mail:&nbsp;
          <a
            href="mailto:kontakt@neighborly-app.de"
            className="text-blue-600 underline hover:text-blue-800"
          >
            kontakt@neighborly-app.de
          </a>
          <br />
          Web:&nbsp;
          <span className="italic text-gray-500">
            www.neighborly-app.de&nbsp;(wird noch angepasst)
          </span>
        </p>

        <p className="mt-4">
          Geschäftsführung:&nbsp;Max&nbsp;Mustermann<br />
          Handelsregister:&nbsp;Amtsgericht&nbsp;Berlin,&nbsp;HRB&nbsp;123456<br />
          USt‑ID:&nbsp;DE123456789
        </p>

        <p className="mt-4">
          Verantwortlich für den Inhalt gemäß §&nbsp;18&nbsp;Abs.&nbsp;2 MStV:<br />
          Max&nbsp;Mustermann, Adresse wie oben
        </p>

        <Link
          to="/"
          className="inline-block mt-10 text-blue-600 underline hover:text-blue-800"
        >
          Zurück zur Startseite
        </Link>
      </main>
    </div>
  );
}
