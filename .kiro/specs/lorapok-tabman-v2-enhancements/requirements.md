# Requirements Document

## Introduction

This document defines the requirements for **Lorapok TabMan v2 Enhancements** — a comprehensive set of improvements to the Lorapok TabMan Firefox extension and its React dashboard. The enhancements span UI polish, a new Tab Snooze system, CI/CD automation for Mozilla Add-ons (AMO) publishing, Firebase security hardening, secrets management, and documentation updates. The goal is to bring the project to a production-ready, deployable state with a clean security posture and a richer user experience.

**Current implementation status:** Requirements 1, 2, 9, and 10 have been fully implemented. Additionally, two items not in the original requirements have been completed: the heavy footer has been removed from both LandingPage and Dashboard and replaced with a slim social bar (Requirement 11), and a pre-existing `react-is` missing peer dependency has been resolved so that `npm run build` completes successfully (Requirement 12). Requirements 3 through 8 remain pending implementation.

---

## Glossary

- **Dashboard**: The React 19 + Vite web application at `src/pages/Dashboard.tsx` that serves as the primary management interface for tab groups.
- **Extension**: The Firefox Manifest V3 browser extension located in `public/extension/`, consisting of `manifest.json` and `background.js`.
- **Background_Script**: The `public/extension/background.js` file that runs persistently in the browser and handles tab capture.
- **LandingPage**: The React component at `src/pages/LandingPage.tsx` that serves as the public-facing marketing page.
- **Firebase**: The Google Firebase platform providing Firestore (database) and Authentication services for the project.
- **Firestore**: The Firebase NoSQL cloud database used for authenticated user data sync.
- **AMO**: Mozilla Add-ons (addons.mozilla.org) — the official Firefox extension marketplace.
- **CI_CD_Pipeline**: The GitHub Actions workflow that automates building, signing, and publishing the Extension to AMO.
- **web-ext**: Mozilla's official CLI tool used to sign and submit Firefox extensions to AMO.
- **AMO_API_Key**: The Mozilla AMO JWT issuer key, stored as a GitHub Actions repository secret (`AMO_API_KEY`).
- **AMO_API_Secret**: The Mozilla AMO JWT secret, stored as a GitHub Actions repository secret (`AMO_API_SECRET`).
- **Snooze_System**: The browser extension feature that monitors open browser tabs for inactivity and automatically discards (unloads from memory) tabs that have not been actively used for a user-configured time period.
- **Snoozed_Tab**: A browser tab whose page has been discarded from memory by the Snooze_System due to inactivity. The tab entry remains visible in the browser tab bar but its content is unloaded until the user clicks it.
- **Snooze_Timer**: The user-configured inactivity duration (minimum 1 minute, maximum 7 days) after which an inactive tab is snoozed by the Snooze_System.
- **Inactivity_Period**: The elapsed time since a user last actively interacted with a browser tab. The Snooze_Timer resets on each active interaction.
- **Settings_Panel**: The settings view within the Dashboard, accessible via the Settings navigation item.
- **Contact_Support_Button**: The "Contact Support" button visible in the Help section of the Dashboard.
- **Meet_Developer_Card**: The card component in the Dashboard's Help view that displays developer information.
- **Security_Audit**: The process of identifying and removing hardcoded secrets and API keys from tracked source files.
- **Environment_Variable**: A runtime configuration value injected via `.env` files (local) or GitHub Actions secrets (CI/CD), never hardcoded in source.
- **TabGroup**: The core data structure defined in `src/types.ts` representing a named collection of saved tabs.
- **Tab**: An individual saved browser tab within a `TabGroup`, as defined in `src/types.ts`.
- **Brand_Name**: The product name "TabMan" (capital M) as part of "Lorapok TabMan". All rendered text across the application must use this exact capitalisation.
- **Dashboard_CTA_Button**: The primary call-to-action button on the LandingPage (labelled "Launch Dashboard" or "Go to Dashboard") that navigates the user to the Dashboard. This button must meet the Brutalist-Modern design standard and WCAG 2.1 AA accessibility requirements.
- **Social_Footer_Bar**: The slim footer bar at the bottom of both LandingPage and Dashboard, containing the Lorapok Labs branding, social media icon links, and copyright notice. Replaces the previous heavy text footer.
- **Add_to_Firefox_Button**: The "Add to Firefox" button in the Navbar that triggers a download of the extension ZIP file.

---

## Requirements

### Requirement 1: Contact Support Button Email Link [COMPLETED]

**User Story:** As a user seeking help, I want the "Contact Support" button to open a pre-addressed email to the developer, so that I can reach support without having to manually look up the contact address.

#### Acceptance Criteria

1. WHEN a user clicks the "Contact Support" button in the Help section of the Dashboard, THE Dashboard SHALL open the user's default email client with the recipient address pre-filled as `lorapokdev@gmail.com`.
2. THE Contact_Support_Button SHALL use an `<a href="mailto:lorapokdev@gmail.com">` anchor element so that the email client is invoked via the standard browser protocol handler.
3. WHEN the Contact_Support_Button is rendered, THE Dashboard SHALL display the button with the label "Contact Support" and visually distinguish it as an interactive link element.
4. IF the user's environment does not support the `mailto:` protocol, THEN THE Dashboard SHALL still render the button without throwing a JavaScript error.

---

### Requirement 2: Meet Developer Card Color Update [COMPLETED]

**User Story:** As a user browsing the Help section, I want the "Meet Developer" card to visually match the project's Brutalist-Modern design system, so that the UI feels cohesive and intentional rather than inconsistent.

#### Acceptance Criteria

1. THE Meet_Developer_Card SHALL use a background color of `#0a0f1a` with a border of `rgba(255,255,255,0.1)` (`border border-white/10`), consistent with the dark card style of the design system, rather than the sky-blue `#38bdf8` accent color.
2. WHEN the Meet_Developer_Card is rendered, THE Dashboard SHALL apply the same card surface treatment used by other informational cards in the Help and Settings views (dark navy surface, subtle white border).
3. THE Meet_Developer_Card SHALL retain all existing content (developer name, links, description) after the color change.
4. WHEN the active theme is changed by the user in Settings, THE Meet_Developer_Card SHALL respect the CSS custom property `--background-card` so that it adapts to the selected theme.

---

### Requirement 3: CI/CD Pipeline for Firefox Add-on Publishing

**User Story:** As a developer, I want a GitHub Actions workflow that automatically builds, signs, and submits the Firefox extension to AMO on every push to `main`, so that releases are consistent, auditable, and require no manual intervention.

#### Acceptance Criteria

1. WHEN a commit is pushed to the `main` branch that modifies files under `public/extension/`, THE CI_CD_Pipeline SHALL trigger automatically.
2. THE CI_CD_Pipeline SHALL support manual triggering via `workflow_dispatch` so that a release can be initiated on demand without a code change.
3. WHEN the CI_CD_Pipeline runs, THE CI_CD_Pipeline SHALL read the current version from `public/extension/manifest.json`, increment the patch version number, and write the updated version back to `manifest.json`.
4. WHEN the CI_CD_Pipeline runs, THE CI_CD_Pipeline SHALL package the Extension source directory into a ZIP archive named `lorapok-tabman-{VERSION}.zip`.
5. WHEN the CI_CD_Pipeline packages the Extension, THE CI_CD_Pipeline SHALL include `manifest.json`, `background.js`, and the `icons/` directory in the ZIP archive.
6. WHEN the CI_CD_Pipeline signs the Extension, THE CI_CD_Pipeline SHALL invoke `web-ext sign` using the `AMO_API_Key` and `AMO_API_Secret` values sourced exclusively from GitHub Actions repository secrets (`${{ secrets.AMO_API_KEY }}` and `${{ secrets.AMO_API_SECRET }}`).
7. THE CI_CD_Pipeline SHALL NOT contain any hardcoded API keys, secrets, or credentials in the workflow YAML file.
8. WHEN the signing step completes, THE CI_CD_Pipeline SHALL upload the signed ZIP as a GitHub Actions artifact so that it is downloadable from the Actions run summary.
9. WHEN the version bump and ZIP are produced, THE CI_CD_Pipeline SHALL commit the updated `manifest.json` back to the `main` branch using the `github-actions[bot]` identity.
10. IF the `web-ext sign` step fails due to an AMO API error, THEN THE CI_CD_Pipeline SHALL continue to the artifact upload step so that the unsigned ZIP is still preserved.
11. THE CI_CD_Pipeline SHALL use Node.js 24 and `actions/checkout@v4` to ensure a consistent, modern build environment.

---

### Requirement 4: Tab Snooze System

**User Story:** As a power user with many open browser tabs, I want inactive tabs to be automatically unloaded from memory after a configurable period of inactivity, so that my system RAM and CPU usage are reduced without me having to manually close tabs.

#### Acceptance Criteria

1. WHEN a browser tab has not been actively interacted with for a duration equal to the configured Snooze_Timer, THE Snooze_System SHALL discard (unload) that tab's page content from browser memory using the browser tab discard API.
2. WHEN a user actively interacts with a browser tab (e.g., clicks on it, types in it, or scrolls it), THE Snooze_System SHALL reset the Inactivity_Period timer for that tab to zero.
3. WHEN a user clicks on or navigates to a Snoozed_Tab, THE browser SHALL automatically reload the tab's page content as per standard browser discard behaviour.
4. THE Settings_Panel SHALL include a "Tab Snooze — Inactivity Timeout" configuration field where the user can set the Snooze_Timer value in minutes or hours (minimum: 1 minute, maximum: 10080 minutes / 7 days).
5. WHEN the Snooze_Timer configuration is saved, THE Snooze_System SHALL apply the new timeout value to all subsequently tracked tabs without requiring a browser restart.
6. WHILE a tab is in the Snoozed_Tab state, THE Dashboard SHALL render the corresponding tab entry within its group card in a visually distinct blurred and dimmed state to indicate the tab is unloaded.
7. WHILE a tab entry is rendered in the Snoozed_Tab state in the Dashboard, THE Dashboard SHALL display the Lorapok TabMan logo (`public/logo.png`) centred as an overlay on top of the blurred tab entry.
8. THE logo overlay on a Snoozed_Tab entry SHALL use the circular badge logo image referenced at `public/logo.png` (the worm-holding-tab-folders badge with "LORAPOK TABMAN / FIREFOX ADD-ON" text around it).
9. THE snoozed tab visual state in the Dashboard SHALL be a visual indicator only — the tab's data (title, URL, favicon) SHALL remain stored and visible beneath the overlay.
10. WHEN a tab group card in the Dashboard contains one or more Snoozed_Tabs, THE Dashboard SHALL apply the blurred/dimmed overlay treatment to each individual snoozed tab entry within that card, not to the entire group card.
11. THE `Tab` type definition in `src/types.ts` SHALL be extended with an optional `isSnoozed?: boolean` field to allow the Dashboard to reflect the snooze state of individual tabs.
12. WHEN the Firestore security rules are evaluated for a tab snooze state update, THE Firestore rules SHALL permit the `tabs` array field in the allowed update keys for the `groups/{groupId}` path so that individual tab snooze state changes are not rejected.

---

### Requirement 5: Firebase Integration Audit and Fix

**User Story:** As a developer, I want the Firebase integration (auth, Firestore, security rules) to be verified as functional and correctly configured, so that I can trust that user data is secure and the sync pipeline works reliably in production.

#### Acceptance Criteria

1. THE Firebase integration audit SHALL verify that `src/lib/firebase.ts` initializes the Firebase app using configuration values that can be sourced from environment variables, not exclusively from the committed `firebase-applet-config.json` file.
2. WHEN the Dashboard loads, THE Firebase integration SHALL successfully complete the connection test (`getDocFromServer` on `test/connection`) without throwing an unhandled exception.
3. THE Firestore security rules SHALL enforce that only authenticated users can read or write their own data under `users/{userId}/**`.
4. THE Firestore security rules SHALL include the `isArchived` field in the allowed update keys for `groups/{groupId}` so that archive operations are not rejected by the rules.
5. THE Firestore security rules SHALL include the `tabs` array field in the allowed update keys for `groups/{groupId}` so that tab-level snooze state updates are not rejected by the rules.
6. THE Firestore security rules SHALL include the `name` field in the allowed update keys for the `users/{userId}` profile document so that display name updates are not rejected.
7. THE Firebase integration audit SHALL produce a written checklist (in the implementation notes) documenting each rule, auth provider, and configuration value that was verified.
8. IF a Firebase configuration value is missing or malformed at app initialization, THEN THE Dashboard SHALL log a descriptive error message to the browser console identifying which value is missing.

---

### Requirement 6: Security Cleanup — Remove Hardcoded Secrets

**User Story:** As a developer and open-source maintainer, I want all API keys and secrets removed from tracked source files, so that the repository can be safely made public without exposing credentials.

#### Acceptance Criteria

1. THE Security_Audit SHALL identify all files in the repository that contain hardcoded API keys, Firebase configuration values, or other secrets.
2. THE `firebase-applet-config.json` file SHALL be replaced by environment variable injection so that the Firebase `apiKey` and other sensitive values are not committed to the repository in plaintext.
3. THE `src/lib/firebase.ts` module SHALL read Firebase configuration from `import.meta.env` variables (e.g., `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`) rather than importing from a committed JSON config file.
4. THE `.env.example` file SHALL be updated to document all required environment variables for Firebase configuration, including `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, and `VITE_FIREBASE_DATABASE_ID`.
5. THE `.gitignore` file SHALL include entries for `.env`, `.env.local`, and `firebase-applet-config.json` to prevent accidental future commits of secrets.
6. THE existing `deploy.yml` GitHub Actions workflow SHALL be updated to inject all required Firebase environment variables from GitHub Actions repository secrets during the build step.
7. WHEN the build runs in CI/CD, THE CI_CD_Pipeline SHALL source Firebase configuration from GitHub Actions secrets (e.g., `${{ secrets.FIREBASE_API_KEY }}`) and pass them as `VITE_*` environment variables to the Vite build process.
8. THE `firebase-blueprint.json` file SHALL be reviewed and, if it contains sensitive project identifiers, SHALL be added to `.gitignore` or replaced with a non-sensitive template.

---

### Requirement 7: Documentation Update

**User Story:** As a contributor or new developer, I want the README.md and AGENTS.md to accurately reflect the v2 feature set and deployment process, so that I can understand the project and contribute effectively without relying on outdated information.

#### Acceptance Criteria

1. THE `README.md` SHALL be updated to document the Tab Snooze System feature under the "Key Features" section, describing it as an extension-level inactivity-based tab discard feature with a configurable timeout and Dashboard visual indicators for snoozed tabs.
2. THE `README.md` SHALL be updated to include a "Deployment" section describing the CI/CD pipeline, the required GitHub Actions secrets (`AMO_API_KEY`, `AMO_API_SECRET`, `FIREBASE_API_KEY`, and all other `VITE_*` Firebase secrets), and how to configure them.
3. THE `README.md` SHALL be updated to replace the placeholder `https://your-github-io-url/dashboard` URL in the Background_Script description with a note that the dashboard URL must be configured before publishing.
4. THE `README.md` SHALL update the version badge from `v1.0.0 Stable` to reflect the current version after the CI/CD pipeline performs its first automated bump.
5. THE `AGENTS.md` SHALL be updated to document the Snooze_System architecture, including the `isSnoozed` field on `Tab`, the inactivity tracking mechanism in the Background_Script, and the Dashboard visual overlay behaviour for snoozed tab entries.
6. THE `AGENTS.md` SHALL be updated to reflect that Firebase configuration is now sourced from environment variables rather than a committed JSON file.
7. THE `AGENTS.md` SHALL be updated to document the CI/CD pipeline workflow file location (`.github/workflows/publish-firefox.yml`) and the secrets it requires.
8. WHEN documentation references a command or configuration value, THE documentation SHALL use code blocks or inline code formatting for all commands, file paths, and environment variable names.

---

### Requirement 8: Full Deployment Preparation

**User Story:** As a developer preparing for a public release, I want a complete deployment readiness check and plan so that I can confidently publish the extension and dashboard without exposing secrets or breaking the user experience.

#### Acceptance Criteria

1. THE deployment preparation SHALL produce a checklist verifying that all GitHub Actions secrets required by both `deploy.yml` and `publish-firefox.yml` are documented and their names are consistent across all workflow files.
2. THE `public/extension/background.js` Background_Script SHALL be updated to replace the hardcoded placeholder URL `https://your-github-io-url/dashboard` with a configurable constant that is clearly marked for the developer to update before publishing.
3. THE deployment preparation SHALL verify that the Vite build (`npm run build`) completes without TypeScript errors after all environment variable and security changes are applied.
4. THE deployment preparation SHALL verify that the `firestore.rules` file is deployable to the Firebase project using the Firebase CLI (`firebase deploy --only firestore:rules`), and SHALL include the deploy command in the documentation.
5. THE `manifest.json` version field SHALL follow semantic versioning (`MAJOR.MINOR.PATCH`) and the CI_CD_Pipeline SHALL be the sole mechanism for incrementing the patch version on automated releases.
6. WHEN all deployment prerequisites are met, THE deployment preparation documentation SHALL provide a step-by-step "First Deploy" guide covering: configuring GitHub secrets, deploying Firestore rules, triggering the CI/CD pipeline, and verifying the AMO submission.
7. THE deployment preparation SHALL confirm that the `deploy.yml` workflow correctly builds the React dashboard and deploys it to GitHub Pages, with all Firebase environment variables injected from secrets.

---

### Requirement 9: Brand Name Typography — "TabMan" Capitalisation [COMPLETED]

**User Story:** As a user and as the product owner, I want the brand name to be consistently rendered as "TabMan" (capital M) across the entire application, so that the product identity is correct and professional everywhere it appears.

#### Acceptance Criteria

1. THE Dashboard SHALL render the brand name as "TabMan" (capital M) in all locations where the product name appears, including page titles, headings, descriptive text, and any component that references the brand name.
2. THE LandingPage SHALL render the brand name as "TabMan" (capital M) in all locations where the product name appears, including the hero section, feature descriptions, the CTA section, and the footer.
3. THE Navbar component (`src/components/Navbar.tsx`) SHALL render the brand name as "Lorapok TabMan" with capital M in the logo/brand text element.
4. WHEN the Navbar renders the brand name, THE Navbar SHALL preserve the existing glowing animation applied to the "TabMan" portion of the text — only the capitalisation of the letter "M" shall change, not the styling or animation.
5. THE Logo component (`src/components/Logo.tsx`) SHALL use "Lorapok TabMan" in any `alt` text or accessible label that references the brand name.
6. THE brand name capitalisation fix SHALL be applied to all files that render the brand name as a string literal, including but not limited to: `src/components/Navbar.tsx`, `src/components/Logo.tsx`, `src/pages/LandingPage.tsx`, and `src/pages/Dashboard.tsx`.
7. IF any other file in the `src/` directory contains the string "Tabman" (lowercase m), THEN THE file SHALL be updated to use "TabMan" (capital M) to maintain consistency.

---

### Requirement 10: Dashboard CTA Button Visual Enhancement [COMPLETED]

**User Story:** As a user visiting the LandingPage, I want the "Launch Dashboard" / "Go to Dashboard" button to be visually prominent and polished, so that it clearly communicates the primary action and reflects the quality of the Brutalist-Modern design system.

#### Acceptance Criteria

1. THE Dashboard_CTA_Button on the LandingPage hero section SHALL use a gradient background of `linear-gradient(135deg, #38bdf8, #0ea5e9, #0284c7)` to be more prominent than a flat `bg-sky-500` style.
2. WHEN a user hovers over the Dashboard_CTA_Button, THE LandingPage SHALL apply a glow effect using `box-shadow` with the `#38bdf8` accent colour (`0 0 40px rgba(56,189,248,0.4)`) to reinforce the interactive affordance.
3. THE Dashboard_CTA_Button SHALL include a shimmer animation (a translucent white gradient that sweeps across the button on hover) to reinforce the interactive affordance.
4. THE Dashboard_CTA_Button SHALL include the `Layout` icon from `lucide-react` displayed alongside the button label to improve visual clarity.
5. THE Dashboard_CTA_Button SHALL use padding and font sizing that makes it visually larger and more prominent than secondary action buttons on the same page (e.g., the "Download Addon" button).
6. THE Dashboard_CTA_Button SHALL remain keyboard focusable and SHALL display a visible focus ring (`focus:ring-4 focus:ring-sky-500/40`) that meets WCAG 2.1 AA contrast requirements when focused via keyboard navigation.
7. THE Dashboard_CTA_Button SHALL maintain a text contrast ratio of at least 4.5:1 against its background colour in both default and hover states, in compliance with WCAG 2.1 AA.
8. THE same visual enhancement treatment (gradient, shimmer, glow, Layout icon) SHALL be applied to the "Go to Dashboard" button in the LandingPage CTA section for visual consistency.
9. WHEN the Dashboard_CTA_Button is activated (clicked or keyboard-activated), THE LandingPage SHALL navigate the user to the `/dashboard` route without any JavaScript errors.

---

### Requirement 11: Footer Cleanup and Navigation Fix [COMPLETED]

**User Story:** As a user visiting the LandingPage or Dashboard, I want a clean, minimal footer and a functional "Add to Firefox" download button, so that the page feels polished and the extension download works correctly.

#### Acceptance Criteria

1. THE LandingPage SHALL replace the previous heavy text footer ("Built with passion by Mohammad Maizied Hasan Majumder · Bangladesh") with a slim Social_Footer_Bar containing the Lorapok Labs logo, brand name, social media icon links, and a copyright notice.
2. THE Dashboard SHALL replace the previous heavy text footer with the same slim Social_Footer_Bar treatment used on the LandingPage, ensuring visual consistency across both pages.
3. THE Social_Footer_Bar SHALL include icon links to the following social profiles: GitHub (`https://github.com/lorapok`), X/Twitter (`https://x.com/LorapokLabs`), Email (`mailto:lorapokdev@gmail.com`), LinkedIn (`https://www.linkedin.com/showcase/lorapok/`), Reddit (`https://www.reddit.com/r/LorapokLabs/`), Gravatar (`https://gravatar.com/lorapok`), and the Lorapok website (`https://lorapok.github.io/#contact`).
4. THE Social_Footer_Bar SHALL use a `border-t border-white/5 bg-black/20` surface treatment to remain visually recessive and not compete with page content.
5. THE Add_to_Firefox_Button in the Navbar (`src/components/Navbar.tsx`) SHALL be implemented as a `<motion.a href="/extension/tabman-v1.0.0.zip" download>` anchor element rather than a non-functional `<button>` element, so that clicking it triggers a file download.
6. WHEN a user clicks the Add_to_Firefox_Button, THE Navbar SHALL initiate a download of the file at `/extension/tabman-v1.0.0.zip` without navigating away from the current page.
7. THE "Download Addon" button in the LandingPage hero section SHALL also be implemented as an `<a href="/extension/tabman-v1.0.0.zip" download>` anchor element to ensure consistent download behaviour.

---

### Requirement 12: Build System Fix [COMPLETED]

**User Story:** As a developer, I want `npm run build` to complete successfully without errors, so that the project can be built and deployed reliably.

#### Acceptance Criteria

1. THE project build (`npm run build`) SHALL complete without errors or unresolved peer dependency warnings related to `react-is`.
2. THE `react-is` package SHALL be present as a dependency (or resolved peer dependency) in `package.json` or `package-lock.json` so that the Vite build process does not fail due to a missing module.
3. WHEN the build completes, THE `dist/` directory SHALL contain a valid production build of the React dashboard ready for deployment.
4. THE build fix SHALL not introduce breaking changes to any existing runtime behaviour of the Dashboard or LandingPage.
