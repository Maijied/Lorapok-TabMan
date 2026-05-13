# Implementation Plan: Lorapok TabMan v2 Enhancements (Requirements 3–8)

## Overview

Implementation of the six pending requirements, ordered so that each phase unblocks the next:
security cleanup first (firebase.ts must read from env vars before CI/CD can inject them),
then Firestore rules fixes, then the Tab Snooze feature, then the CI/CD pipeline, then
documentation, and finally deployment preparation.

Requirements 1, 2, 9, 10, 11, and 12 are already complete and are excluded from this plan.

---

## Tasks

- [x] 1. Security cleanup — migrate Firebase config to environment variables (Req 6)
  - [x] 1.1 Rewrite `src/lib/firebase.ts` to read from `import.meta.env`
    - Remove the `import firebaseConfig from '../../firebase-applet-config.json'` import
    - Define the `REQUIRED_VARS` tuple of all 7 `VITE_FIREBASE_*` variable names
    - Implement `validateFirebaseConfig()` that calls `console.error` once per missing variable, naming it in the message
    - Build the `firebaseConfig` object from `import.meta.env.VITE_FIREBASE_*` values
    - Pass `import.meta.env.VITE_FIREBASE_DATABASE_ID` as the third argument to `initializeFirestore` instead of `firebaseConfig.firestoreDatabaseId`
    - Keep the existing `testConnection()` call and all exports unchanged
    - _Requirements: 6.1, 6.2, 6.3, 5.1, 5.8_

  - [ ]* 1.2 Write property test for `validateFirebaseConfig` (Property 5)
    - **Property 5: Firebase Config Validation**
    - For any subset of the 7 required env vars being `undefined`, `validateFirebaseConfig()` must log exactly one `console.error` per missing variable, naming the variable in the message
    - **Validates: Requirements 5.8, 6.3**

  - [x] 1.3 Update `.env.example` with all required Firebase variables
    - Replace the existing AI Studio placeholder content with a Firebase configuration block
    - Document all 7 variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_DATABASE_ID`
    - Add a comment block explaining where to find these values (Firebase Console → Project Settings → General → Your apps)
    - _Requirements: 6.4_

  - [x] 1.4 Update `.gitignore` to exclude `firebase-applet-config.json`
    - Add `firebase-applet-config.json` as an explicit entry (`.env*` is already present; the JSON file is not)
    - Verify `.env` and `.env.local` are covered by the existing `.env*` glob
    - _Requirements: 6.5_

  - [x] 1.5 Update `deploy.yml` to inject Firebase secrets into the Vite build
    - Add all 7 `VITE_FIREBASE_*` environment variables to the "Install and Build" step's `env:` block
    - Map each to its corresponding `${{ secrets.FIREBASE_* }}` secret (e.g., `VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}`)
    - Remove the `# Add other secrets here if needed` placeholder comment
    - _Requirements: 6.6, 6.7, 8.7_

- [x] 2. Checkpoint — verify build still compiles after env var migration
  - Run `npm run build` locally (or confirm CI passes) to ensure no TypeScript errors were introduced by the firebase.ts rewrite
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.3_

- [x] 3. Firebase audit and Firestore rules fix (Req 5)
  - [x] 3.1 Fix the `groups/{groupId}` update rule — add `isArchived` to `hasOnly()`
    - In `firestore.rules`, locate the `allow update` rule for `match /users/{userId}/groups/{groupId}`
    - Add `'isArchived'` to the `hasOnly([...])` array alongside the existing keys
    - _Requirements: 5.4, 4.12_

  - [x] 3.2 Fix the `users/{userId}` update rule — add `name` to `hasOnly()`
    - In `firestore.rules`, locate the `allow update` rule for `match /users/{userId}`
    - Add `'name'` to the `hasOnly([...])` array alongside `'email'`, `'lastSync'`, `'displayName'`, `'updatedAt'`
    - _Requirements: 5.6_

- [x] 4. Tab Snooze System (Req 4)
  - [x] 4.1 Extend `src/types.ts` — add `isSnoozed` to the `Tab` interface
    - Add `isSnoozed?: boolean` as an optional field to the `Tab` interface
    - _Requirements: 4.11_

  - [x] 4.2 Add `alarms` permission to `public/extension/manifest.json`
    - Add `"alarms"` to the `"permissions"` array (alongside the existing `"tabs"`, `"storage"`, `"activeTab"`, `"notifications"`)
    - _Requirements: 4.1_

  - [x] 4.3 Implement snooze inactivity tracking in `public/extension/background.js`
    - Add `updateLastActive(tabId)` helper that reads `lastActiveMap` from `browser.storage.local`, sets `lastActiveMap[tabId] = Date.now()`, and writes it back
    - Add `removeFromLastActiveMap(tabId)` helper that deletes the entry and writes back
    - Register `browser.tabs.onActivated` listener that calls `updateLastActive(tabId)` on the activated tab
    - Register `browser.tabs.onUpdated` listener that calls `updateLastActive(tabId)` when `changeInfo.status === 'complete'`
    - Register `browser.tabs.onRemoved` listener that calls `removeFromLastActiveMap(tabId)`
    - _Requirements: 4.2_

  - [x] 4.4 Implement the alarm-based snooze check in `public/extension/background.js`
    - Create a repeating alarm named `'snoozeCheck'` with `{ periodInMinutes: 1 }` at script startup
    - Register `browser.alarms.onAlarm` listener; skip if `alarm.name !== 'snoozeCheck'`
    - Read `snoozeTimeoutMinutes` (default `30`) and `lastActiveMap` (default `{}`) from `browser.storage.local`
    - Query all non-discarded, non-pinned tabs with `browser.tabs.query({ discarded: false, pinned: false })`
    - For each tab, call `shouldSnooze(lastActiveMap[tab.id] ?? now, now, thresholdMs)` and discard if true
    - Export `shouldSnooze(lastActive, now, thresholdMs)` as a named function (pure, no side effects) so it can be unit-tested
    - _Requirements: 4.1, 4.5_

  - [ ]* 4.5 Write property test for `shouldSnooze` (Property 2)
    - **Property 2: Inactivity Threshold Check**
    - For any `offsetMs` and `thresholdMinutes`, `shouldSnooze(now - offsetMs, now, thresholdMinutes * 60 * 1000)` must return `true` if and only if `offsetMs >= thresholdMs`
    - **Validates: Requirements 4.1, 4.5**

  - [ ]* 4.6 Write property test for `updateLastActive` (Property 3)
    - **Property 3: Activity Reset**
    - After calling `updateLastActive(tabId)`, the stored timestamp for that tab must be within 100ms of `Date.now()`
    - **Validates: Requirements 4.2**

  - [x] 4.7 Add snooze timeout settings UI to `src/pages/Dashboard.tsx`
    - Add `snoozeTimeoutMinutes` state (default `30`) to the Dashboard component
    - Add a `useEffect` that reads `snoozeTimeoutMinutes` from `browser.storage.local` on mount (guard with `typeof browser !== 'undefined'`)
    - In the `SettingsView` section, add a "Tab Snooze" subsection with a number input (min `1`, max `10080`) bound to `snoozeTimeoutMinutes`
    - On settings save, write `{ snoozeTimeoutMinutes }` to `browser.storage.local`
    - Style the input to match the existing settings inputs (dark card surface, `rounded-2xl`, `border-white/5`, `focus:ring-accent-soft`)
    - _Requirements: 4.4, 4.5_

  - [x] 4.8 Implement snoozed tab visual overlay in `src/pages/Dashboard.tsx`
    - Locate the per-tab rendering block inside the group card (the element that renders favicon, title, URL, tags, and delete button)
    - Wrap each tab entry in a `relative` container
    - Apply `blur-[2px] opacity-50 pointer-events-none select-none` to the inner tab content div when `tab.isSnoozed === true`
    - Render the overlay `<div>` (absolute, inset-0, `bg-black/30 backdrop-blur-sm z-10`, flex-centered) only when `tab.isSnoozed === true`
    - Inside the overlay, render `<img src="/logo.png" alt="Tab snoozed — Lorapok TabMan" className="w-8 h-8 opacity-80" />`
    - The overlay must be applied per-tab, not per-group-card
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ]* 4.9 Write property test for snoozed tab rendering completeness (Property 4)
    - **Property 4: Snoozed Tab Rendering Completeness**
    - For any tab group with N snoozed tabs, the rendered output must contain exactly N blur overlays, exactly N logo images, and must not blur the group card container
    - **Validates: Requirements 4.6, 4.7, 4.8, 4.9, 4.10**

- [x] 5. Checkpoint — verify snooze feature and rules fix
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. CI/CD pipeline for Firefox AMO publishing (Req 3)
  - [x] 6.1 Create `.github/workflows/publish-firefox.yml`
    - Add `on.push` trigger scoped to `branches: [main]` and `paths: ['public/extension/**']`
    - Add `on.workflow_dispatch` trigger for manual runs
    - Set `permissions: contents: write`
    - Add a single job `publish` running on `ubuntu-latest`
    - Step 1: `actions/checkout@v4` with `fetch-depth: 0`
    - Step 2: `actions/setup-node@v4` with `node-version: '24'`
    - _Requirements: 3.1, 3.2, 3.11_

  - [x] 6.2 Add version bump step to `publish-firefox.yml`
    - Add a "Bump patch version" step that runs an inline Node.js script (`node -e "..."`)
    - The script reads `public/extension/manifest.json`, splits `version` on `.`, increments `parts[2]` by 1, writes the file back, and prints the new version
    - Capture the new version in a step output (`echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT`)
    - _Requirements: 3.3_

  - [x] 6.3 Add ZIP packaging step to `publish-firefox.yml`
    - After the version bump, add a step that creates `lorapok-tabman-${{ steps.bump.outputs.version }}.zip`
    - The ZIP must include `manifest.json`, `background.js`, and the entire `icons/` directory from `public/extension/`
    - Use `zip -r` with explicit paths: `cd public/extension && zip -r ../../lorapok-tabman-VERSION.zip manifest.json background.js icons/`
    - _Requirements: 3.4, 3.5_

  - [x] 6.4 Add `web-ext sign` step to `publish-firefox.yml`
    - Install `web-ext` globally: `npm install -g web-ext`
    - Run `web-ext sign --source-dir public/extension --api-key $AMO_API_KEY --api-secret $AMO_API_SECRET`
    - Set `continue-on-error: true` so a signing failure does not skip the artifact upload
    - Pass secrets via `env:` block using `${{ secrets.AMO_API_KEY }}` and `${{ secrets.AMO_API_SECRET }}` — no hardcoded values
    - _Requirements: 3.6, 3.7, 3.10_

  - [x] 6.5 Add artifact upload and version commit steps to `publish-firefox.yml`
    - Add `actions/upload-artifact@v4` step to upload the ZIP file as artifact named `firefox-extension`
    - Add a "Commit version bump" step that configures `github-actions[bot]` git identity, stages `public/extension/manifest.json`, commits with message `chore: bump extension version to X.Y.Z [skip ci]`, and pushes to `main`
    - _Requirements: 3.8, 3.9_

  - [ ]* 6.6 Write property test for `bumpPatchVersion` (Property 1)
    - **Property 1: Semver Patch Bump**
    - For any valid `MAJOR.MINOR.PATCH` string, the version bump function must increment PATCH by exactly 1, leave MAJOR and MINOR unchanged, and return a valid semver string
    - Extract the inline Node script logic into a testable `bumpPatchVersion(version: string): string` utility in `src/lib/utils.ts`
    - **Validates: Requirements 3.3, 8.5**

- [ ] 7. Checkpoint — verify CI/CD workflow syntax and version bump logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Documentation update (Req 7)
  - [x] 8.1 Update `README.md` — add Tab Snooze to Key Features
    - Add a "Tab Snooze" bullet under the Key Features section describing the inactivity-based tab discard feature, the configurable timeout (1 min – 7 days), and the Dashboard visual overlay for snoozed tabs
    - _Requirements: 7.1_

  - [x] 8.2 Update `README.md` — add Deployment section
    - Add a "Deployment" section documenting the CI/CD pipeline and all required GitHub Actions secrets
    - Include a table with all 9 secrets: `AMO_API_KEY`, `AMO_API_SECRET`, and the 7 `FIREBASE_*` secrets
    - Explain how to configure them (repo → Settings → Secrets and variables → Actions)
    - _Requirements: 7.2_

  - [x] 8.3 Update `README.md` — fix placeholder dashboard URL reference
    - Replace the hardcoded `https://your-github-io-url/dashboard` placeholder in the Background Script description with a note that the developer must configure this URL before publishing
    - _Requirements: 7.3_

  - [x] 8.4 Update `AGENTS.md` — document Snooze System architecture
    - Add a "Snooze System" subsection to the Architectural Blueprint section
    - Document the `isSnoozed?: boolean` field on `Tab`, the `lastActiveMap` and `snoozeTimeoutMinutes` keys in `browser.storage.local`, the alarm-based check in `background.js`, and the Dashboard blur/overlay rendering behaviour
    - _Requirements: 7.5_

  - [x] 8.5 Update `AGENTS.md` — document env var config and CI/CD pipeline
    - Update the Backend section to note that Firebase configuration is sourced from `import.meta.env` (`VITE_FIREBASE_*`) rather than a committed JSON file
    - Add a "CI/CD Pipeline" subsection documenting `.github/workflows/publish-firefox.yml`, its triggers, and the secrets it requires (`AMO_API_KEY`, `AMO_API_SECRET`)
    - _Requirements: 7.6, 7.7_

- [x] 9. Deployment preparation (Req 8)
  - [x] 9.1 Update `public/extension/background.js` — mark `DASHBOARD_URL` as a configurable constant
    - The `DASHBOARD_URL` constant already exists; update its comment block to clearly state it must be replaced with the actual GitHub Pages URL before publishing
    - Add a second comment line with an example: `// Example: "https://yourusername.github.io/lorapok-tabman/dashboard"`
    - _Requirements: 8.2_

  - [x] 9.2 Add deployment secrets checklist to `README.md`
    - Under the Deployment section (added in task 8.2), add a "First Deploy" step-by-step guide covering:
      1. Configuring all 9 GitHub Actions secrets
      2. Creating a local `.env` from `.env.example`
      3. Deploying Firestore rules with `firebase deploy --only firestore:rules`
      4. Updating `DASHBOARD_URL` in `background.js`
      5. Pushing to `main` to trigger `deploy.yml`
      6. Triggering `publish-firefox.yml` and verifying the AMO submission
    - Use code blocks for all commands, file paths, and variable names
    - _Requirements: 8.1, 8.4, 8.6_

  - [x] 9.3 Final build verification
    - Run `npm run build` to confirm the production build completes without TypeScript errors after all changes in tasks 1–9.2
    - Confirm the `dist/` directory is produced and the build output is valid
    - _Requirements: 8.3, 8.7_

- [x] 10. Final checkpoint — all tests pass, deployment artifacts ready
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests require `fast-check` and `vitest` — install them if not already present before running optional tasks
- Each task references specific requirements for traceability
- The ordering is intentional: task 1 (env vars) must complete before task 6 (CI/CD) can inject secrets correctly
- `firebase-applet-config.json` remains in the repo until task 1.4 adds it to `.gitignore`; do not delete it before that step or the build will break on machines without a `.env` file
- The `isSnoozed` field on `Tab` (task 4.1) is never written to Firestore — it is a transient, per-device state held only in `browser.storage.local`
