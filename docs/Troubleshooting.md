# Troubleshooting

## Endless Loading / Expo Go not connecting
- **Symptom**: App gets stuck loading after scanning QR code.
- **Solution**: Run `npx expo start --tunnel`. This bypasses local firewall and Wi-Fi restrictions.

## Clear Cache
- **Symptom**: Weird styling bugs, old code showing up, or Metro bundler crashes.
- **Solution**: Run `npx expo start -c` to clear the Metro bundler cache.

## Node Modules Issues
- **Symptom**: "Module not found" or peer dependency errors.
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install`.
