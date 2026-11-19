// Open /api/health in the browser to see whether storage and keys are set up. Shows no secret values.
import { mode, putFile, removePath } from "./_store.js";

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  const out = {
    ok: false,
    storage: mode,
    blobTokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
    passcodeSet: !!process.env.STUDIO_PASSCODE,
    anthropicKeyPresent: !!process.env.ANTHROPIC_API_KEY,
    node: process.version,
    write: null,
    hint: "",
  };
  if (mode !== "blob" && process.env.VERCEL) {
    out.hint = "No Blob token found. In Vercel: Storage tab, create a PUBLIC Blob store, click Connect to Project, then Redeploy.";
    return res.status(200).json(out);
  }
  try {
    const name = `health/${Date.now()}.txt`;
    await putFile(name, Buffer.from("ok"), "text/plain");
    await removePath(name);
    out.write = "ok"; out.ok = true;
    out.hint = mode === "blob" ? "Storage works. Uploads should succeed." : "Local test storage works.";
  } catch (e) {
    out.write = "failed";
    out.error = String((e && e.message) || e).slice(0, 300);
    out.hint = /private/i.test(out.error)
      ? "Your Blob store is Private. Create a PUBLIC one, connect it to the project, then Redeploy."
      : "Storage write failed. See the error above.";
  }
  return res.status(200).json(out);
}
