# Marrions Pharmacy — Android setup

This project is prepared for Android packaging with Capacitor.

## Phone-only build

1. Upload the whole project to a new GitHub repository.
2. Open the repository's **Actions** tab.
3. Select **Build Android APK**.
4. Tap **Run workflow**.
5. Wait for the workflow to finish.
6. Open the completed workflow and download the artifact named **marrions-pharmacy-debug-apk**.
7. Extract the APK and install it on the Android phone.

The Android application ID is `ke.marrions.pharmacy`.

## Important

The app still uses the existing Supabase backend. Internet access is therefore required for Supabase operations unless offline storage/synchronisation is added separately.
