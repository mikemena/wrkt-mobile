# WRKT

A strength training mobile app for custom workouts and progress tracking.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Project Structure

- `/src` - App source code
- `/tools` - Development utilities
  - `resizeScreenshots.js` - Resizes screenshots for App Store
  - `validateScreenshots.js` - Validates App Store screenshot requirements
- `/docs` - Project documentation
  - `/app-store` - App Store assets and copy

## Scripts

```bash
# Validate screenshots
node scripts/validateScreenshots.js ./screenshots

# Resize screenshots
node scripts/resizeScreenshots.js ./screenshots
```

## Deployment Platforms

wrkt-backend > Railway
wrkt-docs > Vercel
