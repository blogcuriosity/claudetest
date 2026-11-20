// Generates the Android (Trusted Web Activity) project for Namaste Mega Mart from twa-manifest.json.
const { TwaManifest, TwaGenerator, ConsoleLog } = require('@bubblewrap/core');
(async () => {
  const manifest = await TwaManifest.fromFile('twa-manifest.json');
  const err = manifest.validate();
  if (err) throw new Error('twa-manifest.json invalid: ' + err);
  const log = new ConsoleLog('generate');
  await new TwaGenerator().createTwaProject('./android', manifest, log);
  console.log('Project generated for', manifest.packageId, 'version', manifest.appVersionName, manifest.appVersionCode);
})().catch((e) => { console.error(e); process.exit(1); });
