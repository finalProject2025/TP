#  Technisches Planungsdokument – Nachbarschaftshilfe

---

## Detaillierte Architektur & Komponenten

### Komponentenübersicht

| Komponente             | Beschreibung                                           |
|------------------------|--------------------------------------------------------|
| **Frontend**           | React Vite App, UI-Logik, Kommunikation mit API        |
| **Backend API**        | Node.js mit Express, enthält Authentifizierung & Routing |
| **PostgreSQL DB**      | Speicherung von Userdaten, Aufgaben etc.               |
| **Nginx**              | Webserver & Reverse Proxy                              |
| **JWT Auth**           | Tokenbasierte Authentifizierung                        |
| **Bcrypt**             | Passwort-Hashing                                       |

### Interaktionen

- **Frontend** ↔ **Backend API** via HTTP (Axios)
- **Backend API** ↔ **PostgreSQL** via Prisma ORM
- **User → Nginx → Frontend + API** über Ingress (K8s)
- **Authentifizierung: JWT im Header** (Bearer Token)

### Architekturwahl: Monolith

- **Grund**: Einfachere Wartung, kleine Teamgröße, schnelle Entwicklung
- Alles in einem Backend-Service statt separater Microservices

---

## Datenbank Schema Design

### Haupttabellen

#### users
- id (UUID, PK)
- name (String)
- email (String, unique)
- password_hash (String)
- created_at (Timestamp)

#### tasks
- id (UUID, PK)
- title (String)
- description (Text)
- user_id (UUID, FK → users.id)
- status (Enum: open/accepted/done)
- created_at (Timestamp)

### Beziehungen

- 1:n – Ein Nutzer kann mehrere Aufgaben erstellen
- FK: `tasks.user_id` → `users.id`

---

## Detaillierter Technologie-Stack

### Frontend
- React
- Vite
- TypeScript
- TailwindCSS

### Backend
- Node.js + Express
- PostgreSQL
- Bcrypt
- JSON Web Tokens (JWT)
- dotenv

### Verbindung & Config
- ENV Variablen via dotenv/K8s Secrets
- pg verbindet sich via localhost
- JWT Secret via ENV (`JWT_SECRET`)
- bcrypt für Hashing (`bcrypt.hash(...)`)

---

## Kubernetes Deployment Design (optinal)

### Workloads

| Komponente  | Typ          | Replikate | Begründung                         |
|-------------|---------------|-----------|------------------------------------|
| Frontend    | Deployment    | 2         | Stateless                          |
| Backend     | Deployment    | 2         | Stateless                          |
| PostgreSQL  | StatefulSet   | 1         | Daten persistent                   |

### Config

- ConfigMaps für: App-Konfiguration, Feature Flags
- Secrets für: `JWT_SECRET`, `DATABASE_URL`
- Übergabe: per ENV-Var in Deployment YAML

### Speicher

| Komponente | PVC Größe | Access Mode | StorageClass |
|------------|-----------|-------------|---------------|
| PostgreSQL | 5Gi       | ReadWriteOnce | standard      |

### Services & Ingress

| Komponente  | Service Typ | Zugriff                   |
|-------------|-------------|---------------------------|
| Frontend    | ClusterIP   | intern über Nginx-Ingress |
| Backend     | ClusterIP   | intern über Nginx-Ingress |
| PostgreSQL  | ClusterIP   | nur für Backend zugänglich|

- Ingress: `/api` → Backend, `/` → Frontend
- Optional: Namespace `nachbarschaftshilfe-dev`

---

## IaC (Terraform) Design (optional)

### Infrastruktur via Terraform

- Kubernetes-Cluster (z. B. via AKS/EKS)
- Kubernetes-Ressourcen (Deployments, Services, Ingress, Secrets)
- Optional: Cloud-Ressourcen

### Struktur

```
terraform/
├── main.tf
├── variables.tf
├── kubernetes.tf
├── secrets.tf
└── modules/
```

### Variablen

| Variable           | Beschreibung                          |
|--------------------|---------------------------------------|
| `region`           | Cloud-Region (z. B. eu-central-1)     |
| `db_password`      | Aus Secretmanager oder .tfvars        |
| `jwt_secret`       | Aus Secretmanager oder .tfvars        |
| `image_tag`        | Git Commit Hash oder manuell          |

---

## CI/CD Pipeline Design (optional)

### Pipeline-Stufen

- `build`: Docker Images für FE/BE/DB
- `test`: Unit & Integrationstests
- `package`: Push Images
- `deploy-dev`: Deployment ins Dev-Cluster
- `deploy-prod`: Manuelles Approval

### Beispiel-Jobs

- Node Setup, `npm ci`, `npm test`
- Docker Build + Push (`docker/build-push-action`)
- `kubectl` oder `helm` für Deployment

### Secrets

- `JWT_SECRET`, `DB_PASSWORD`, `REGISTRY_TOKEN`, `KUBE_CONFIG`
- Nutzung über ENV + GitHub Secrets

### Strategien

- Rolling Updates Standard

---

## Detaillierter Testing Plan

| Teststufe    | Tools              | Was wird getestet                         |
|--------------|--------------------|-------------------------------------------|
| Unit         | Jest, Vitest       | Einzelne Funktionen, Komponenten          |
| Integration  | Postman            | API-Endpoints + DB-Anbindung              |
| E2E          | Playwright/Cypress | Benutzerflow: Login, Aufgaben erstellen   |

### Orte

- Lokal, CI, optional auf Staging-Umgebung

---

## Detaillierte Security Planung

- Bcrypt für Passwort-Hashing
- JWT für Auth (Bearer Token)
- Input-Validierung (express-validator)
- Secrets via Kubernetes Secrets
- PostgreSQL & API nicht öffentlich erreichbar
- HTTPS empfohlen (per Cert-Manager)

---

## Monitoring & Logging Planung (optional)

| Tool        | Zweck                          |
|-------------|--------------------------------|
| Prometheus  | Metriken (CPU, Requests etc.)  |
| Grafana     | Dashboards                     |
| Loki        | Logging                        |
| Alertmanager| Benachrichtigung               |

- Alerts: Fehler-Rate, CPU-Last, Festplattenfüllstand

---

## Detaillierter Umsetzungszeitplan

### Sprintplanung (Beispiel 4 Wochen)

| Woche  | Phase               | Aufgaben                                      |
|--------|---------------------|-----------------------------------------------|
| 1      | Planung & Setup     | Repo, CI/CD Setup, DB Schema                  |
| 2      | Kernfeatures        | Auth, Aufgabenverwaltung, API-Tests           |
| 3      | K8s & Sicherheit    | Deployments, Ingress, Secrets, Monitoring     |
| 4      | Finalisierung       | E2E-Tests, UI-Finish, Präsentation            |

### Aufgabenverteilung

- Frontend: Komponenten, UI, E2E
- Backend: API, Auth, DB
- DevOps: CI/CD, K8s, Monitoring 

<br><br>

# Reflexion

### ● Welche technischen Aspekte waren am schwierigsten detailliert zu planen? Warum?

Für uns war es am schwierigsten, die CI/CD-Pipeline und die genaue Struktur der Kubernetes-Objekte detailliert zu planen. Wir haben zwar ein Grundverständnis davon, wie die einzelnen Komponenten funktionieren, aber viele Abläufe und Konfigurationsdetails sind uns noch nicht ganz klar. Besonders die Verknüpfung dieser Technologien im Gesamtprozess war herausfordernd, weil uns praktische Erfahrung fehlt.

### ● Wo seht ihr die größten technischen Risiken während der Umsetzung? Wie plant ihr, diese zu minimieren?

Die größten Risiken sehen wir beim Zusammenspiel von Docker, Kubernetes und Infrastructure-as-Code. Da wir alle Bausteine bisher nur einzeln und theoretisch kennengelernt haben, besteht die Gefahr von Fehlkonfigurationen oder Missverständnissen in der Umsetzung. Um diese Risiken zu minimieren, planen wir, uns eng an offiziellen Dokumentationen, Tutorials und Beispielprojekten zu orientieren und möglichst Schritt für Schritt vorzugehen.

### ● Welche Entscheidungen im Plan erfordern voraussichtlich die meiste Recherche/das meiste Experimentieren während der Umsetzung?

Wir gehen davon aus, dass das Thema Monitoring sowie die Nutzung von Helm-Charts die meiste Recherche und das meiste Ausprobieren erfordern wird. Wir wissen zwar, welche Tools es gibt (z. B. Prometheus, Grafana), aber wie man diese konkret einsetzt und integriert, ist uns noch unklar. Hier wollen wir uns Schritt für Schritt anhand von Beispielen herantasten.

### ● Wie stellt euer Plan sicher, dass alle gelernten Bausteine (Docker, K8s Objekte, IaC, CI/CD, Monitoring etc.) integriert und korrekt angewendet werden?

Unser Plan sieht vor, dass jeder Baustein zumindest in einer grundlegenden Form eingesetzt wird. So verwenden wir Docker für die Containerisierung, eventuell Kubernetes zur Orchestrierung, eventuell ein IaC-Tool wie Terraform für die Infrastruktur, und wir binden CI/CD sowie Monitoring teilweise mit ein. Da wir in allen Bereichen noch Lernbedarf haben, nutzen wir den Plan eher als Leitfaden, um während der Umsetzung gezielt dazuzulernen und die Technologien möglichst sinnvoll zu integrieren.

