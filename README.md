# Trace Field Reporting

Mobile app for construction site progress reporting, built with React Native and Expo. Workers submit photo reports tagged with a construction stage, managers review and take action, and property owners get a high-level view of site activity.

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` for iOS simulator / `a` for Android emulator.

## Roles

- **Worker** — selects an active site, chooses the construction stage, takes or uploads a photo, and submits a report with notes
- **Manager** — reviews incoming reports, approves, flags, or rejects them, and monitors overall site progress
- **Property Owner** — read-only overview of all sites and recent activity

## Stack

- React Native with Expo SDK
- TypeScript
- React Navigation (stack and tab navigators)
- Expo Image Picker and Camera
- Custom REST API backend with AI image verification

## Project structure

```
src/
  components/   shared UI and layout components
  hooks/        useReports context hook
  navigation/   per-role navigators
  screens/      all screens grouped by role
  services/     API client and config
  theme/        colors, spacing, typography tokens
  types/        shared TypeScript types
```
