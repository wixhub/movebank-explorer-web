# 🌐 MoveRDM Dataset Explorer

### Research Data Repository Frontend

A high-performance, fully responsive web application built as a frontend prototype for ecological and behavioral research data repositories within the **MoveRDM** initiative. It integrates with the **[Movebank API](https://www.movebank.org/)** — a global infrastructure coordinated by the [Max Planck Institute of Animal Behavior](https://www.ab.mpg.de/), the [University of Konstanz](https://www.uni-konstanz.de/), and partner institutions.

[![Movebank API](https://img.shields.io/badge/Movebank-API_Live-2ea44f?style=flat&logo=databricks&logoColor=white)](https://www.movebank.org/)
[![Max Planck Institute](https://img.shields.io/badge/MPI_Animal_Behavior-Partner-005691?style=flat)](https://www.ab.mpg.de/)
[![University of Konstanz](https://img.shields.io/badge/Uni_Konstanz-Partner-003366?style=flat)](https://www.uni-konstanz.de/)
[![MoveRDM Dataset Explorer](https://img.shields.io/badge/MoveRDM_Dataset_Explorer-Project-00a8cc?style=flat&logo=databricks&logoColor=white)](https://movebank-explorer.pages.dev)

[![Angular](https://img.shields.io/badge/Angular-22-red?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20to-Cloudflare%20Pages-orange?logo=cloudflare)](https://pages.cloudflare.com/)
[![SCSS](https://img.shields.io/badge/Styles-SCSS-pink?logo=sass)](https://sass-lang.com/)

---

## 🚀 Live Demo

🔗 **[View Live Application on Cloudflare Pages](https://movebank-explorer.pages.dev)**

---

## 📌 About the Project

This project simulates a production-ready interface for browsing, querying, and managing complex scientific datasets and metadata structures, bridging local mock storage with real-time telemetry streams from [Movebank](https://www.movebank.org/)

---

## 📖 Overview

**MoveRDM** is an advanced research data repository prototype built for ecological and behavioral telemetry data, featuring live integration with the **Movebank API**. The application bridges the gap between static local mock data storage and real-time scientific data streaming via a secure cloud proxy architecture.

---

## ✨ Key Features

- **Dual Data Sources:** Seamlessly toggle between local static mock datasets and live real-time telemetry streams.
- **Dynamic Query Builder:** Interact directly with multiple Movebank entities (`study`, `tag_type`, `taxon`, `deployment`) with optional custom `study_id` filters.
- **CORS & Auth Proxy:** Built on top of **Cloudflare Workers** to safely inject API credentials and handle cross-origin restrictions gracefully.
- **Client-Side CSV/TSV Parser:** Efficiently parses raw text/CSV data streams coming from upstream scientific endpoints into reactive Angular models on the fly.
- **Robust Error Handling:** Automatically clears previous results and displays clean notifications if live queries return empty datasets or fail.
- **Modern UI/UX:** Fully responsive card grid layout tailored for researchers, featuring real-time loading states and optimized mobile views.

---

## 🛠️ Technology Stack

- **Frontend:** This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.7 (Standalone Components, Signals, Reactive Forms, HttpClient)
- **Styling:** SCSS (Fully Responsive Flex/Grid Layouts, Custom Color Palettes)
- **Backend / Middleware:** Cloudflare Workers (TypeScript, Fetch API, Basic Auth Injection)
- **Data Format:** JSON (Local Mock) & TSV/CSV (Live Movebank Direct-Read Stream)

---

## 📂 Project Structure

```text
movebank-explorer-web/
├── src/
│   ├── app/
│   │   ├── features/
│   │   │   └── dataset-catalog/         # Main component (TypeScript, HTML, SCSS)
│   │   └── core/
│   │       ├── models/
│   │       │   └── dataset.model.ts     # Data interface definitions
│   │       └── services/
│   │           └── dataset.service.ts   # HTTP requests & CSV/TSV parsing logic
│   └── styles.scss                      # Global application styles
└── public/
    └── data/
        └── datasets.json                # Local fallback data storage
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Angular CLI
- Cloudflare Wrangler CLI (for worker deployment)

### Installation & Run

1. **Clone the repository:**

```bash
git clone [git@github.com:wixhub/movebank-explorer-web.git](git@github.com:wixhub/movebank-explorer-web.git)

cd movebank-explorer-web
```

2. **Install frontend dependencies:**

```bash
npm install
```

3. ** Run local development server:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## ⚙️ Cloudflare Worker Setup

To enable live data fetching without CORS or security issues, deploy the backend proxy worker:

1. Create a `worker.ts` file using the provided proxy implementation.

2. Configure your environment secrets in Cloudflare:

```bash
npx wrangler secret put MOVEBANK_USERNAME
npx wrangler secret put MOVEBANK_PASSWORD
```

3. Deploy the worker to your Cloudflare account:

```bash
npx wrangler deploy
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/wixhub/moverdm-explorer-web/issues).

---

## 📬 Contact & Support

If you have any questions, suggestions, or feedback regarding this project, feel free to reach out:

- **Author:** [@Rublin](https://github.com/wixhub)
- **Telegram:** [@typeweb](https://t.me/typeweb)
- **GitHub Repository:** [moverdm-explorer](https://github.com/wixhub/moverdm-explorer-web)

---

## 📄 License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

This project is open-source and available under the [MIT License](LICENSE).
