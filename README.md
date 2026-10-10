# Collex HR — Mobile app

Employee app for Collex HR (Expo / React Native, TypeScript, Expo Router).
Check in / out with location, attendance history, leaves and requests,
notifications, payslips, administrative actions, and approvals for managers.
Arabic and English.

The API contract is `docs/MOBILE_API.md` in the Collex HR backend.

## Server

The app talks to the Collex HR API over the office Wi-Fi. Default:
`http://192.168.1.10:8055` (see `src/lib/api.ts`); it can be changed from the
gear icon on the sign-in screen. The backend must listen on the network:
`python manage.py runserver 0.0.0.0:8055`.

## Develop

```bash
npm install
npx tsc --noEmit
```

## Build the APK (Windows, local)

Needs JDK 17 and the Android SDK (paths at the top of `build-apk.ps1`).

```powershell
powershell -ExecutionPolicy Bypass -File build-apk.ps1
```

Output: `Collex-HR.apk`.
