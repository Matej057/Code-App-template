# Code App template

<!-- TEMPLATE: This repository is a reusable starter for generic Items workspaces. -->

A React, TypeScript, and Vite starter for Microsoft Power Apps Code Apps. It provides a generic Items workspace with local demo data so you can adapt the layout and fields before connecting your own data source.

## Start locally

```sh
npm ci
npm run dev
```

To configure a new Power Apps Code App, copy `power.config.example.json` to `power.config.json` and replace its placeholders with values from your own Power Platform environment. The real `power.config.json` is intentionally ignored by Git because it contains app- and environment-specific identifiers.

## Build

```sh
npm run build
```

## Customize this template

- Update the `Item` and `ItemDraft` types in `src/data/items.ts` to match your domain.
- Replace the browser-local demo storage with the data source and service layer for your app.
- Add your own Dataverse tables with the supported Power Platform tooling, then map them in the data layer. The template intentionally does not assume a table schema.
- Adjust the fields and summary cards in `src/App.tsx` and the reusable styles in `src/App.css`.
- Switch between the Items table, Kanban, Timeline, Process, Calendar, and Activity views from the sidebar. Search and status filtering are shared across views.

The sample records are saved in the current browser with `localStorage`; they are not connected to Dataverse.
Timeline, Calendar, and Activity use each item's latest `updatedAt` date. This starter does not keep a full change history or due dates.
