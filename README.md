# MoveRDM Dataset Explorer | Research Data Repository Frontend

A modern, high-performance, and fully responsive web application built as a frontend prototype for research data repositories (aligned with the **MoveRDM / Movebank Data Repository** project at the University of Konstanz / Max Planck Institute).

[![Angular Version](https://img.shields.io/badge/Angular-Latest-red?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20to-Cloudflare%20Pages-orange?logo=cloudflare)](https://pages.cloudflare.com/)
[![SCSS](https://img.shields.io/badge/Styles-SCSS%20BEM-pink?logo=sass)](https://sass-lang.com/)

---

## 🚀 Live Demo

🔗 **[View Live Application on Cloudflare Pages](https://movebank-explorer.pages.dev)**

---

## 📌 About the Project

This project simulates a production-ready interface for browsing, filtering, and managing complex scientific datasets and metadata structures.

### Key Highlights:

- **Modern Angular Architecture:** Built entirely with **Standalone Components**, utilizing **Signals** for reactive state management and lazy-loaded routes.
- **Advanced Responsive Design (SCSS):** Developed using a _Mobile-First_ approach with custom SCSS mixins and CSS Grid/Flexbox, ensuring pixel-perfect scaling across all devices (smartphones, tablets, desktop workstations).
- **Academic Metadata Handling:** Clean component structure designed to map institutional metadata schemas (similar to DSpace or custom institutional repositories).
- **Performance & Deployment:** Zero-config automated CI/CD deployment pipeline hosted on **Cloudflare Pages** with global CDN caching and SPA routing support.

---

## 🛠️ Tech Stack

- **Framework:** Angular (Standalone Architecture, Signals, RxJS)
- **Language:** TypeScript
- **Styling:** SCSS (Modular architecture, variables, responsive breakpoints)
- **Build Tool:** Angular CLI / Vite-powered tooling
- **Hosting & CI/CD:** Cloudflare Pages

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── core/           # Core interceptors, layout services, guards
│   ├── shared/         # Reusable UI components (buttons, cards, badges)
│   ├── features/
│   │   ├── catalog/    # Main dataset search and grid view
│   │   └── detail/     # Detailed dataset metadata view
│   ├── models/         # TypeScript interfaces for datasets & metadata
│   └── app.component.ts
├── assets/             # Static mock data and icons
└── styles/             # Global SCSS variables, mixins, and resets
```

---

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.7.

## Development server

To start a local development server, run:

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
