# 🧪 Neighborly - Test Suite

## 📋 Übersicht

Diese Test-Suite enthält die **5 wichtigsten Unit Tests** für das Neighborly-Projekt, die die kritischsten Funktionalitäten abdecken:

1. **Backend AuthController Tests** - Authentifizierung & Sicherheit
2. **Backend UsersController Tests** - Benutzer-Management
3. **Frontend API Service Tests** - Frontend-Backend-Kommunikation
4. **Frontend Validation Tests** - Form-Validierung
5. **Backend Encryption Tests** - DSGVO-kritische Verschlüsselung

## 🚀 Installation

### 1. Vitest Installation

```bash
# Backend Tests installieren
cd backend
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 supertest @types/supertest

# Frontend Tests installieren
cd ../frontend
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

### 2. Package.json Scripts hinzufügen

**Backend (`backend/package.json`):**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

**Frontend (`frontend/package.json`):**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## 🧪 Tests ausführen

### Alle Tests ausführen (von diesem Ordner):
```bash
# Backend Tests
cd backend && npm test

# Frontend Tests
cd frontend && npm test

# Oder von hier aus:
npm run test:backend
npm run test:frontend
npm run test:all
```

### Einzelne Tests:
```bash
# Spezifische Test-Datei
npm run test:backend -- authController.test.ts
npm run test:frontend -- simpleApi.test.ts

# Mit UI (interaktiv)
npm run test:ui

# Mit Coverage-Report
npm run test:coverage
```

### Watch-Modus (für Entwicklung):
```bash
npm run test:watch
```

## 📁 Test-Struktur

```
tests/
├── README.md                           # Diese Anleitung
├── backend/
│   ├── controllers/
│   │   ├── authController.test.ts      # Authentifizierung
│   │   └── usersController.test.ts     # Benutzer-Management
│   └── utils/
│       └── encryption.test.ts          # PLZ-Verschlüsselung
├── frontend/
│   ├── services/
│   │   └── simpleApi.test.ts          # API-Kommunikation
│   └── utils/
│       └── validation.test.ts          # Form-Validierung
└── vitest.config.ts                    # Vitest-Konfiguration
```

## 🎯 Test-Kategorien

### 🔐 Sicherheit (3 Tests)
- **AuthController**: Login, JWT, Rate Limiting
- **UsersController**: E-Mail-Verifizierung, Profil-Sicherheit
- **Encryption**: PLZ-Verschlüsselung (DSGVO)

### ⚙️ Funktionalität (2 Tests)
- **simpleApi**: Frontend-Backend-Kommunikation
- **validation**: Datenqualität & Form-Validierung

## 📊 Test-Coverage

### Erwartete Coverage:
- **AuthController**: ~85% (Login, Register, OAuth)
- **UsersController**: ~80% (Profil, E-Mail-Verifizierung)
- **simpleApi**: ~90% (API-Calls, Error Handling)
- **validation**: ~95% (Form-Validierung)
- **encryption**: ~100% (Verschlüsselung/Entschlüsselung)

### Gesamt-Coverage: ~85%

## 🛠️ Konfiguration

### Vitest-Konfiguration (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  }
})
```

## 🔧 Troubleshooting

### Häufige Probleme:

1. **Module nicht gefunden:**
   ```bash
   npm install --save-dev @types/node
   ```

2. **Environment Variables:**
   ```bash
   # .env.test erstellen
   cp .env .env.test
   ```

3. **Database Connection:**
   ```bash
   # Test-Database verwenden
   export DB_NAME=neighborly_test
   ```

4. **Port-Konflikte:**
   ```bash
   # Andere Ports für Tests
   export TEST_PORT=3003
   ```

## 📈 CI/CD Integration

### GitHub Actions (`.github/workflows/test.yml`):
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:all
      - run: npm run test:coverage
```

## 🎯 Best Practices

### ✅ Implementiert:
- **Isolierte Tests**: Keine Abhängigkeiten zwischen Tests
- **Mocking**: Database, External APIs
- **Cleanup**: Nach jedem Test aufräumen
- **Error Testing**: Positive und negative Szenarien
- **Performance**: Tests laufen unter 30 Sekunden

### 📝 Test-Writing Guidelines:
1. **Arrange**: Setup der Test-Daten
2. **Act**: Ausführung der zu testenden Funktion
3. **Assert**: Überprüfung der Ergebnisse
4. **Cleanup**: Aufräumen nach dem Test

## 🚀 Nächste Schritte

Nach der Implementierung dieser 5 Tests können weitere Tests hinzugefügt werden:

1. **Integration Tests**: API-Endpunkte mit Supertest
2. **Component Tests**: React-Komponenten
3. **E2E Tests**: Vollständige User-Journeys
4. **Performance Tests**: Load Testing

---

**Viel Erfolg beim Testen! 🎉** 