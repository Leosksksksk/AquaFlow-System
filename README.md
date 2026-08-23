# AquaFlow — Setup Instructions

This zip contains ONLY the custom app files (lib, types, utils, screens, components, App.tsx, .env.example).
It is NOT a full Expo project by itself — you still create the base project once with Expo's CLI,
then drop these files in. This is the normal, correct way to do it (the base project contains
hundreds of auto-generated config/native files that should not be hand-copied).

## Step 1 — Create the base Expo project (one time only)

Open a terminal in the folder where you want your project to live, then run:

```bash
npx create-expo-app@latest aquaflow --template blank-typescript
cd aquaflow
code .
```

## Step 2 — Install the required packages

```bash
npx expo install @supabase/supabase-js react-native-url-polyfill
npx expo install expo-constants
npx expo install expo-image-picker expo-file-system
npx expo install react-native-safe-area-context
```

## Step 3 — Copy these files into your project

Unzip this file. Copy EVERYTHING inside `aquaflow-files/` into the ROOT of your `aquaflow` project
folder (the same level as `App.tsx` and `package.json`), overwriting the default `App.tsx`.

Using File Explorer / Finder:
1. Open the unzipped `aquaflow-files` folder in one window.
2. Open your `aquaflow` project folder (created in Step 1) in another window.
3. Drag `lib`, `types`, `utils`, `screens`, `components` folders and `App.tsx` into the project root.
4. Rename `.env.example` to `.env` and fill in your real Supabase URL and key.

Your project root should now look like:

```
aquaflow/
├── .env                  (renamed from .env.example, filled in)
├── App.tsx               (overwritten)
├── lib/
│   └── supabase.ts
├── types/
│   └── report.ts
├── utils/
│   └── escalation.ts
├── screens/
│   ├── RoleSelectScreen.tsx
│   ├── ResidentScreen.tsx
│   ├── AdminScreen.tsx
│   └── TechnicianScreen.tsx
├── components/
│   ├── ReportForm.tsx
│   ├── AdminReportCard.tsx
│   └── TechnicianReportCard.tsx
├── package.json           (already existed)
├── app.json                (already existed)
└── ...other Expo default files
```

## Step 4 — Set up Supabase

In your Supabase project's SQL Editor, run the SQL from `supabase-setup.sql` (included in this zip).
It creates the `fault_reports` table, RLS policies, and the storage bucket for photos.

## Step 5 — Run the app

```bash
npx expo start
```

Scan the QR code with the Expo Go app on your phone.

## Testing the escalation flow

Open `utils/escalation.ts` and temporarily set `ESCALATION_MINUTES = 0` to test the auto-escalation
to Technician view quickly. Set it back to a real value (e.g. 30) afterward.
