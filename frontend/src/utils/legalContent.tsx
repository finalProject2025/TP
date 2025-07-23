export const getModalContent = (type: 'impressum' | 'datenschutz' | 'nutzungsbedingungen') => {
  switch (type) {
    case 'impressum':
      return (
        <div className="space-y-4 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Impressum</h3>
          <div className="space-y-3 text-gray-700">
            <p><strong>Angaben gemäß § 5 TMG:</strong></p>
            <p>Neighborly - Nachbarschaftshilfe Plattform</p>
            <p>Musterstraße 123<br />
            12345 Musterstadt</p>
            
            <p><strong>Vertreten durch:</strong><br />
            Max Mustermann</p>
            
            <p><strong>Kontakt:</strong><br />
            Telefon: +49 (0) 123 456789<br />
            E-Mail: info@neighborly.de</p>
            
            <p><strong>Registereintrag:</strong><br />
            Eintragung im Handelsregister<br />
            Registergericht: Amtsgericht Musterstadt<br />
            Registernummer: HRB 12345</p>
            
            <p><strong>Umsatzsteuer-ID:</strong><br />
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
            DE123456789</p>
            
            <p><strong>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong><br />
            Max Mustermann<br />
            Musterstraße 123<br />
            12345 Musterstadt</p>
          </div>
        </div>
      );
    
    case 'datenschutz':
      return (
        <div className="space-y-4 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Datenschutzerklärung</h3>
          <div className="space-y-3 text-gray-700">
            <p><strong>1. Datenschutz auf einen Blick</strong></p>
            
            <p><strong>Allgemeine Hinweise</strong><br />
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>
            
            <p><strong>Datenerfassung auf dieser Website</strong><br />
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Die Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.</p>
            
            <p><strong>Wie erfassen wir Ihre Daten?</strong><br />
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p>
            
            <p><strong>Wofür nutzen wir Ihre Daten?</strong><br />
            Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.</p>
            
            <p><strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br />
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.</p>
            
            <p><strong>2. Hosting</strong></p>
            <p>Wir hosten die Inhalte unserer Website bei folgendem Anbieter:</p>
            <p>Vercel Inc.<br />
            340 S Lemon Ave #4133<br />
            Walnut, CA 91789<br />
            USA</p>
            
            <p><strong>3. Allgemeine Hinweise und Pflichtinformationen</strong></p>
            <p><strong>Datenschutz</strong><br />
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
          </div>
        </div>
      );
    
    case 'nutzungsbedingungen':
      return (
        <div className="space-y-4 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Nutzungsbedingungen</h3>
          <div className="space-y-3 text-gray-700">
            <p><strong>§1 Geltungsbereich</strong></p>
            <p>Diese Nutzungsbedingungen gelten für die Nutzung der Nachbarschaftshilfe-Plattform "Neighborly" (nachfolgend "Plattform").</p>
            
            <p><strong>§2 Leistungsbeschreibung</strong></p>
            <p>Die Plattform ermöglicht es Nutzern, Hilfe anzubieten und anzufordern. Sie dient der Vermittlung von Nachbarschaftshilfe und der Stärkung der lokalen Gemeinschaft.</p>
            
            <p><strong>§3 Registrierung und Nutzung</strong></p>
            <p>Die Nutzung der Plattform setzt eine Registrierung voraus. Bei der Registrierung sind wahrheitsgemäße Angaben zu machen. Jeder Nutzer ist für die Vertraulichkeit seiner Zugangsdaten verantwortlich.</p>
            
            <p><strong>§4 Verhaltensregeln</strong></p>
            <p>Nutzer verpflichten sich:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Die Plattform nur für legale Zwecke zu nutzen</li>
              <li>Andere Nutzer respektvoll zu behandeln</li>
              <li>Keine beleidigenden oder diskriminierenden Inhalte zu verbreiten</li>
              <li>Die Privatsphäre anderer Nutzer zu respektieren</li>
            </ul>
            
            <p><strong>§5 Haftung</strong></p>
            <p>Die Plattform übernimmt keine Haftung für die Qualität oder Durchführung der vermittelten Hilfsleistungen. Nutzer handeln auf eigene Verantwortung.</p>
            
            <p><strong>§6 Datenschutz</strong></p>
            <p>Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung.</p>
            
            <p><strong>§7 Änderungen der Nutzungsbedingungen</strong></p>
            <p>Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Nutzer werden über wesentliche Änderungen informiert.</p>
            
            <p><strong>§8 Schlussbestimmungen</strong></p>
            <p>Diese Nutzungsbedingungen unterliegen deutschem Recht. Gerichtsstand ist Musterstadt.</p>
          </div>
        </div>
      );
    
    default:
      return null;
  }
};