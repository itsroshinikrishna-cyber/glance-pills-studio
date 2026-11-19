import { mode } from "./_store.js";

export default function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  res.status(200).json({
    storage: mode,
    ready: mode === "blob" || !process.env.VERCEL,
    passcodeRequired: !!process.env.STUDIO_PASSCODE,
    ideas: !!(process.env.ANTHROPIC_API_KEY || process.env.MOCK_GENERATE),
  });
}
