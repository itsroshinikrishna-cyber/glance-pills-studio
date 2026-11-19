/* Shared client code for Studio, Library and Generate. Exposes window.PS */
window.PS = (function () {
  "use strict";
  const LS_PASS = "pillsStudio.pass";

  /* ---------- API ---------- */
  async function api(path, opts = {}) {
    const headers = {}; let body;
    if (opts.body !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(opts.body); }
    const pass = localStorage.getItem(LS_PASS); if (pass) headers["x-passcode"] = pass;
    const r = await fetch(path, { method: opts.method || "GET", headers, body });
    if (r.status === 401 && !opts._retry) {
      const p = prompt("This studio is protected. Enter the team passcode:");
      if (p) { localStorage.setItem(LS_PASS, p); return api(path, { ...opts, _retry: true }); }
    }
    let data = null; try { data = await r.json(); } catch (e) {}
    if (!r.ok) throw Object.assign(new Error((data && data.error) || "Request failed (" + r.status + ")"), { status: r.status });
    return data;
  }
  let cfgP;
  const config = () => cfgP || (cfgP = api("/api/config").then(c => c.ready === false ? { offline: true, reason: "no Blob storage connected" } : c).catch(e => ({ offline: true, reason: e.message })));

  /* ---------- Images ---------- */
  function readFile(file, max, type) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(type === "png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", .9));
      }; im.onerror = () => rej(new Error("Could not read this image. Use JPG, PNG or WebP (iPhone HEIC photos need converting first).")); im.src = fr.result; };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  async function uploadFile(kind, file) {
    if (!file || !(file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|jfif|bmp)$/i.test(file.name))) throw new Error("Please choose an image file (JPG, PNG or WebP)");
    const dataUrl = await readFile(file, kind === "mascot" ? 512 : 1600, kind === "mascot" ? "png" : "jpg");
    const cfg = await config();
    if (cfg.offline) return { url: dataUrl, name: file.name, kind, offline: true };
    return api("/api/assets", { method: "POST", body: { kind, name: file.name, dataUrl } });
  }
  async function listAssets(kind) {
    const cfg = await config(); if (cfg.offline) return [];
    return (await api("/api/assets?kind=" + kind)).items;
  }

  /* ---------- UI helpers ---------- */
  const style = document.createElement("style");
  style.textContent = `
  .ps-nav{display:flex;gap:2px}
  .ps-nav a{padding:8px 14px;font-weight:700;font-size:13px;color:#15131a;text-decoration:none;border-bottom:3px solid transparent}
  .ps-nav a:hover{background:#f1eef8}
  .ps-nav a.on{border-bottom-color:#6b3df0}
  .ps-modal{position:fixed;inset:0;background:rgba(10,8,16,.6);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}
  .ps-box{background:#fff;width:min(900px,100%);max-height:88vh;display:flex;flex-direction:column;border:1px solid #15131a}
  .ps-head{display:flex;gap:8px;align-items:center;padding:12px 14px;border-bottom:1px solid #dcd8e4}
  .ps-btn{border:1px solid #15131a;background:#fff;padding:6px 10px;font:inherit;font-weight:600;font-size:13px;cursor:pointer}
  .ps-btn:hover{background:#eee}
  .ps-grid{padding:14px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
  .ps-cell{border:1px solid #dcd8e4;background:#fff;padding:0;cursor:pointer;text-align:left;font:inherit}
  .ps-cell:hover{border-color:#6b3df0;outline:1px solid #6b3df0}
  .ps-cell .t{aspect-ratio:3/4;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0 0/16px 16px;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .ps-cell .t img{width:100%;height:100%;object-fit:contain;display:block}
  .ps-cell .n{font-size:11px;padding:5px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#6c6877}
  .ps-empty{grid-column:1/-1;color:#6c6877;padding:30px;text-align:center}
  .g{margin-top:10px}.g>summary{cursor:pointer;font-weight:700;font-size:12px}
  .g h4{margin:12px 0 4px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6c6877}
  .g p{margin:0;font-size:12px;line-height:1.5;color:#3c3846}
  .g .chips span{display:inline-block;background:#fdecea;color:#8a1f1c;padding:1px 6px;margin:0 4px 4px 0;font-size:11px}
  .g2{margin-top:6px}.g2>summary{cursor:pointer;font-size:12px;font-weight:600}
  .mp{width:100%}
  .mp-q{width:100%;border:1px solid #dcd8e4;padding:6px;margin-bottom:6px;font:inherit;background:#fff}
  .mp-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-height:210px;overflow:auto;padding:2px}
  .mp-t{aspect-ratio:1;border:1px solid #dcd8e4;background:#f1eef8;padding:3px;cursor:pointer;font:700 20px system-ui;color:#6c6877;display:flex;align-items:center;justify-content:center}
  .mp-t img{width:100%;height:100%;object-fit:contain;display:block}
  .mp-t:hover{border-color:#6b3df0}
  .mp-t.on{border:2px solid #15131a;padding:2px}
  .mp-foot{font-size:11px;color:#6c6877;margin-top:6px}
  pre.lock{white-space:pre-wrap;font:11px/1.5 ui-monospace,Menlo,monospace;background:#fff;border:1px solid #dcd8e4;padding:8px;max-height:240px;overflow:auto;margin:6px 0 0}
  #ps-toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#15131a;color:#fff;padding:8px 14px;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:60}
  #ps-toast.show{opacity:1}`;
  document.head.appendChild(style);

  function nav(active) {
    const n = document.getElementById("nav"); if (!n) return;
    n.className = "ps-nav";
    n.innerHTML = [["studio", "./", "Studio"], ["bulk", "bulk", "Bulk"], ["library", "library", "Library"], ["generate", "generate", "Generate"]]
      .map(([k, h, t]) => `<a href="${h}" class="${k === active ? "on" : ""}">${t}</a>`).join("");
  }
  let toastT;
  function toast(m) {
    let t = document.getElementById("ps-toast");
    if (!t) { t = document.createElement("div"); t.id = "ps-toast"; document.body.appendChild(t); }
    t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Modal picker: resolves with an asset item, or null */
  function pickAsset(kinds, title) {
    kinds = [].concat(kinds);
    return new Promise(resolve => {
      const wrap = document.createElement("div"); wrap.className = "ps-modal";
      wrap.innerHTML = `<div class="ps-box"><div class="ps-head"><b>${esc(title || "Choose")}</b><span style="flex:1"></span>
        <button class="ps-btn" data-up>Upload new</button><button class="ps-btn" data-x>Close</button></div><div class="ps-grid"></div></div>`;
      document.body.appendChild(wrap);
      const grid = wrap.querySelector(".ps-grid"), file = document.createElement("input");
      file.type = "file"; file.accept = "image/*"; file.multiple = true;
      const done = v => { wrap.remove(); resolve(v); };
      wrap.addEventListener("click", e => { if (e.target === wrap || e.target.closest("[data-x]")) done(null); });
      async function load() {
        grid.innerHTML = '<div class="ps-empty">Loading…</div>';
        let items = [];
        try { items = (await Promise.all(kinds.map(listAssets))).flat().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)); }
        catch (e) { grid.innerHTML = `<div class="ps-empty">${esc(e.message)}</div>`; return; }
        if (!items.length) { grid.innerHTML = '<div class="ps-empty">Nothing here yet. Use “Upload new”.</div>'; return; }
        grid.innerHTML = "";
        for (const it of items) {
          const b = document.createElement("button"); b.className = "ps-cell";
          b.innerHTML = `<div class="t"><img loading="lazy" src="${esc(it.url)}" alt=""></div><div class="n">${esc(it.name)}</div>`;
          b.onclick = () => done(it); grid.appendChild(b);
        }
      }
      wrap.querySelector("[data-up]").onclick = () => file.click();
      file.onchange = async () => {
        const files = [...file.files]; if (!files.length) return;
        try {
          const kind = kinds.includes("mascot") ? "mascot" : "image", ups = [];
          for (const f of files) ups.push(await uploadFile(kind, f));
          if (ups[0] && ups[0].offline) return done(ups[0]);
          toast(files.length + " uploaded"); if (files.length === 1) return done(ups[0]); await load();
        } catch (e) { toast(e.message); }
      };
      load();
    });
  }

  /* ---------- Strategy: treatments + prompt builders ---------- */
  function nameColor(hex) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (d < .08) return l > .8 ? "off-white" : l < .2 ? "near-black" : "neutral grey";
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    const names = [[15, "red"], [40, "orange"], [65, "yellow"], [95, "lime green"], [160, "green"], [190, "teal"], [250, "blue"], [290, "purple"], [335, "pink"], [361, "red"]];
    const s = d / (1 - Math.abs(2 * l - 1));
    const tone = l < .28 ? "deep " : l > .7 ? "soft " : (s >= .7 && l >= .38 && l <= .62 ? "bright " : "");
    return tone + names.find(n => h < n[0])[1];
  }
  const colorPhrase = hex => `${nameColor(hex)} (${hex})`;
  const RATIO = {
    image9: "vertical 9:16 portrait composition",
    image45: "vertical 4:5 portrait composition, keeping the key subject inside the central 80% of the width",
  };
  const CAST = {
    female: "The model is a woman.",
    male: "The model is a man.",
    neutral: "Casting is open; avoid gendered styling cues.",
  };
  const FOOTER = "Keep the bottom 35% of the frame calm and uncluttered so overlay text stays readable.";
  const NO_TEXT = "No text, letters, logos, watermarks or UI anywhere in the image.";

  // Locked style block for the contre-jour pill. Change it here, in one place.
  const CONTREJOUR_STYLE = `Style: contre-jour backlit beauty photography. A thin crisp rim light from behind traces the edge of the subject, with a soft low-intensity fill from the front so skin texture, pores and fabric weave stay readable. No harsh shadows on the face. Smooth single-colour gradient background, brightest as a soft glow directly behind the subject and falling to near-black at the edges and corners. Shot on an 85mm lens, f/2.8, shallow depth of field, fine film grain, editorial high-end campaign look, cinematic colour grade.

Realism: real person, unretouched natural skin with visible pores, fine peach fuzz, subtle uneven skin tone, tiny imperfections, flyaway hairs, slight facial asymmetry, true-to-life proportions, photographed on a real camera.

Avoid: text, logos, watermarks, multiple actions, busy backgrounds, flat front lighting, airbrushed or plastic skin, CGI or 3D render look, illustration, over-sharpened or HDR look, perfectly symmetrical face, glossy waxy skin, extra fingers, distorted hands.`;

  // Locked style block for the Expression & Twist pill. Change it here, in one place.
  const PLAYFUL_STYLE = `Style: playful conceptual studio portrait. Soft, bright, even studio lighting from a large softbox slightly above and in front, gentle fill so the whole face is clearly lit with no harsh shadows. Solid saturated seamless paper backdrop, single flat colour, no gradient. Sharp focus on the eyes and face. Shot on a 50mm lens, f/5.6, fine film grain, editorial humour campaign look, vivid but natural colour grade.

Realism: real person caught in a genuine moment, unretouched natural skin with visible pores, fine peach fuzz, subtle uneven skin tone, flyaway hairs, slight facial asymmetry, real facial expression with natural muscle creases, photographed on a real camera.

Avoid: text, logos, watermarks, readable labels, more than one prop, more than one twist, busy backgrounds, dramatic shadows, backlighting, airbrushed or plastic skin, CGI or 3D render look, illustration, over-sharpened or HDR look, perfectly symmetrical face, extra fingers, distorted hands.`;

  // Locked style block for the Product & Place pill. Change it here, in one place.
  const HERO_STYLE = `Style: natural-light hero product still life, shot on location. Soft directional daylight from a single window or open shade, gentle shadows that give the product shape, no artificial flash. Tonal, muted colour palette where the surroundings sit in the same colour family as the product. Product in sharp focus, background softly blurred. Shot on a 50mm lens, f/4, fine film grain, clean editorial product campaign look, restrained natural colour grade.

Realism: real physical materials, true-to-life metal reflections, visible fabric weave, leather grain and surface texture, tiny natural imperfections, accurate product proportions, photographed on a real camera. Any hands or skin shown have visible pores, natural creases, fine hair and uneven skin tone.

Avoid: faces, eyes, lips, noses, any part of the head, text, logos, watermarks, readable labels, more than one product, studio backdrop, gradient backdrop, dramatic shadows, CGI or 3D render look, over-glossy plastic surfaces, over-sharpened or HDR look, clutter, extra fingers, distorted hands.`;

  const TREATMENTS = {
    contrejour: {
      name: "Contre-jour beauty close-ups",
      focus: "Light & texture",
      blurb: "Tight, backlit macro crops of the moment a product is used. Premium and cinematic.",
      style: "Contre-jour backlit beauty photography: a thin crisp rim light from behind with a soft low-intensity fill, so skin texture, pores and fabric weave stay readable.",
      rules: ["One macro crop and one action per image", "One gradient colour per category: a soft glow behind the subject, falling to near-black at the edges", "Thin crisp rim light with a soft fill so skin texture stays readable", "Real, unretouched skin: never airbrushed or plastic", "Consistent 9:16 or 4:5 ratio"],
      lock: CONTREJOUR_STYLE,
      tips: {
        model: "Be specific, and vary casting across images: ethnicity, gender, age range, hair.",
        crop: "Say exactly where the frame stops and what stays visible.",
        action: "One action only.",
        element: "One thing catches the light.",
        rim: "The side the thin rim light comes from.",
        color: "One colour per category. A glow behind the subject, near-black at the edges.",
      },
      fields: [
        { k: "model", label: "Model (ethnicity, gender, age range, hair)", ph: "a white European man in his 30s with a full dark beard" },
        { k: "crop", label: "Crop point", ph: "just below the eyes, only nose, lips and beard visible" },
        { k: "action", label: "One action", ph: "head tilted back as a single drop of beard oil falls from a glass dropper held by a hand entering from the top right" },
        { k: "element", label: "Hero element catching the light", ph: "the individual beard hairs and the amber oil drop" },
        { k: "rim", label: "Rim light from behind", type: "select", opts: ["left", "right"] },
        { k: "color", label: "Category colour (background gradient)", type: "color", def: "#1f7a7a" },
      ],
      examples: [{ name: "Beard oil", values: {
        model: "a white European man in his 30s with a full dark beard",
        crop: "just below the eyes, only nose, lips and beard visible",
        action: "head tilted back as a single drop of beard oil falls from a glass dropper held by a hand entering from the top right",
        element: "the individual beard hairs and the amber oil drop",
        rim: "left", color: "#1f7a7a",
      } }],
      // Base prompt + the locked style block. Empty slots stay in [BRACKETS] so they are easy to spot.
      build: v => `Tight macro crop of ${v.model || "[MODEL: ethnicity, gender, age range, hair]"}, cropped ${v.crop || "[CROP POINT]"}, ${v.action || "[ONE ACTION]"}. The hero element catching the light: ${v.element || "[ONE ELEMENT]"}. Rim light from behind ${v.rim || "left"}. Background: smooth ${nameColor(v.color || "#1f7a7a")} gradient.\n\n${CONTREJOUR_STYLE}`,
    },
    playful: {
      name: "Playful conceptual portraits",
      focus: "Expression & twist",
      blurb: "Full-face model caught mid-action with the product as a prop and one unexpected twist. Fun and human.",
      style: "Playful conceptual studio portrait: soft, bright, even softbox light so the whole face is clearly lit, on a solid saturated seamless backdrop, with a visible sense of humour.",
      rules: ["One full-face model, one prop, one twist per image", "One solid saturated backdrop colour per category (flat, no gradient)", "Soft, bright, even light: no harsh shadows or backlighting", "Real, unretouched skin and a genuine facial expression", "Consistent 9:16 or 4:5 ratio"],
      lock: PLAYFUL_STYLE,
      tips: {
        model: "Be specific, and vary casting across images: ethnicity, gender, age range, hair.",
        expression: "A real, exaggerated expression with natural muscle creases.",
        action: "One action only.",
        product: "One prop only. Unbranded, no readable labels.",
        twist: "One unexpected twist, never two. This is the joke.",
        outfit: "One colour, simple, nothing busy.",
        color: "Solid, saturated and flat. No gradient.",
      },
      fields: [
        { k: "model", label: "Model (ethnicity, gender, age range, hair)", ph: "a Black man in his 30s with short hair and a trimmed beard" },
        { k: "expression", label: "Expression", ph: "scrunched in an exaggerated grimace" },
        { k: "action", label: "One action", ph: "holding an unbranded tube of face mask between his teeth" },
        { k: "product", label: "Product as prop", ph: "a plain white squeeze tube" },
        { k: "twist", label: "The one unexpected twist", ph: "his whole face is covered in thick green clay mask, with only the eyes and mouth clean" },
        { k: "outfit", label: "Outfit (one colour, simple)", ph: "a plain white t-shirt" },
        { k: "color", label: "Backdrop colour (solid, saturated)", type: "color", def: "#1f5a33" },
      ],
      examples: [
        { name: "Skincare", values: {
          model: "a Black man in his 30s with short hair and a trimmed beard",
          expression: "scrunched in an exaggerated grimace",
          action: "holding an unbranded tube of face mask between his teeth",
          product: "a plain white squeeze tube",
          twist: "his whole face is covered in thick green clay mask, with only the eyes and mouth clean",
          outfit: "a plain white t-shirt", color: "#1f5a33" } },
        { name: "Haircare", values: {
          model: "a white European man in his 20s with long straight light-brown hair",
          expression: "wide-eyed and delighted",
          action: "holding a pink balloon on top of his head with both hands",
          product: "the balloon",
          twist: "static electricity makes every strand of hair stand up and stretch toward the balloon",
          outfit: "a plain yellow sweater", color: "#1f5fd6" } },
      ],
      // Base prompt + the locked style block. Empty slots stay in [BRACKETS] so they are easy to spot.
      build: v => `Full-face portrait of ${v.model || "[MODEL: ethnicity, gender, age range, hair]"}, ${v.expression || "[EXPRESSION: e.g. \"wide-eyed and delighted\", \"scrunched in a grimace\"]"}, ${v.action || "[ONE ACTION: e.g. \"holding a tube of face mask between his teeth\"]"}. Product as prop: ${v.product || "[PRODUCT]"}. The twist: ${v.twist || "[ONE UNEXPECTED TWIST]"}. Wearing ${v.outfit || "[OUTFIT: one colour, simple]"}. Background: solid ${nameColor(v.color || "#1f5a33")} seamless backdrop.\n\n${PLAYFUL_STYLE}`,
    },
    hero: {
      name: "Hero product still life",
      focus: "Product & place",
      blurb: "The product is the hero, shot on location in natural light. No face is ever shown. Clean and product-led.",
      style: "Natural-light hero product still life shot on location: soft directional daylight, a tonal palette, product in sharp focus. No face is ever shown.",
      rules: ["One hero product per image, shot on location in natural light", "No face, ever. A hand, wrist, clasped fingers or torso fragment is allowed", "Tonal palette: the surroundings sit in the same colour family as the product", "Real materials and textures; no studio or gradient backdrop, no logos or readable labels", "Consistent 9:16 or 4:5 ratio"],
      lock: HERO_STYLE,
      tips: {
        product: "One product only: type, material and colour.",
        placement: "Where it sits, or who holds or wears it and what they are doing.",
        place: "One location or surface only.",
        light: "Soft daylight from a single window or open shade. No flash.",
        palette: "One colour family. The surroundings match the product.",
        human: "Type none for product only, or a fragment: hand, wrist, clasped hands, torso. Never a face.",
        crop: "Where the human fragment is cropped, e.g. the wrist, shoulder or chest.",
      },
      fields: [
        { k: "product", label: "Product (type, material, colour)", ph: "a gold-link wristband watch with a rose-pink dial" },
        { k: "placement", label: "Placement (how it sits, is held or worn)", ph: "worn on the wrist of a Black man in his 30s who is pulling open the lapel of an olive leather jacket with the other hand" },
        { k: "place", label: "Place (starts with a word like in / on / against)", ph: "in a plain indoor setting" },
        { k: "light", label: "Light", ph: "soft window light from the upper left" },
        { k: "palette", label: "Palette (one colour family)", ph: "olive green and warm gold" },
        { k: "human", label: "Human element (type none for product only)", ph: "wrist and hand only" },
        { k: "crop", label: "Crop point (only if there is a human element)", ph: "the shoulder" },
      ],
      examples: [
        { name: "Watch", values: {
          product: "a gold-link wristband watch with a rose-pink dial",
          placement: "worn on the wrist of a Black man in his 30s who is pulling open the lapel of an olive leather jacket with the other hand",
          place: "in a plain indoor setting", light: "soft window light from the upper left",
          palette: "olive green and warm gold", human: "wrist and hand only", crop: "the shoulder" } },
        { name: "Jewellery", values: {
          product: "three signet rings, one gold oval and one black onyx square",
          placement: "on the clasped fingers of a mixed-race man in his 20s",
          place: "resting against a dusty teal knit sweater", light: "low warm side light from the right",
          palette: "teal and antique gold", human: "hands only", crop: "the wrists" } },
        { name: "No model", values: {
          product: "a green metal safety razor", placement: "standing upright",
          place: "on a stone bathroom ledge beside a frosted window", light: "soft morning daylight from the left",
          palette: "sage green and pale grey", human: "none", crop: "" } },
      ],
      // Base prompt + the locked style block. Empty slots stay in [BRACKETS] so they are easy to spot.
      build: v => {
        const place = v.place || "in [PLACE: one location or surface]", placement = v.placement || "[PLACEMENT: how it sits, is held or worn]";
        const join = /^on\b/i.test(place) && !placement.includes(",") ? " " : ", ";   // "standing upright on a ledge"
        const none = /^\s*(none|no|product only)\b/i.test(v.human || "");
        const human = !v.human ? "Human element: [HUMAN ELEMENT: none / hand / wrist / clasped hands / torso fragment], cropped at [CROP POINT: wrist, shoulder, chest], no face in frame."
          : none ? "Human element: none, product only."
          : `Human element: ${v.human}, cropped at ${v.crop || "[CROP POINT: wrist, shoulder, chest]"}, no face in frame.`;
        return `Hero shot of ${v.product || "[PRODUCT: type, material, colour]"}, ${placement}${join}${place}. Light: ${v.light || "[LIGHT: e.g. \"soft window light from the left\", \"low golden-hour sun from behind right\"]"}. Palette: ${v.palette || "[ONE COLOUR FAMILY]"}. ${human}\n\n${HERO_STYLE}`;
      },
    },
  };
  function buildPrompt(treatment, values, common) { return TREATMENTS[treatment].build(values || {}, common); }
  function defaults(treatment) {
    const v = {}; for (const f of TREATMENTS[treatment].fields) v[f.k] = f.type === "select" ? f.opts[0] : f.def || ""; return v;
  }

  /* ---------- Copy hierarchy ----------
     One full line  ->  small line above / headline / small line below.
       "Find matcha mask for your skin"  ->  Find | Matcha mask | For your skin
       "Gift ideas that don't get regifted" ->  - | Gift ideas | That don't get regifted
       "Build my fragrance"              ->  Build my | Fragrance | -
     Lead-ins (kicker) and qualifier starters (subline) come from the visual-system examples. */
  const LEADS = ["build my", "find", "shop", "discover", "get", "the", "your", "my"];
  const SUB_STARTS = ["for", "that", "to", "with", "without", "under", "in", "on", "so", "like", "when", "from", "by", "if"];
  function splitCopy(text) {
    const w = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (!w.length) return { kicker: "", headline: "", sub: "" };
    const low = w.map(x => x.toLowerCase().replace(/[.,!?:;]+$/, ""));
    let start = 0;
    for (const lead of LEADS) {                       // longest lead-ins listed first
      const n = lead.split(" ").length;
      if (low.slice(0, n).join(" ") === lead && w.length > n) { start = n; break; }
    }
    let end = w.length;
    for (let j = start + 1; j < w.length; j++) if (SUB_STARTS.includes(low[j])) { end = j; break; }
    return { kicker: w.slice(0, start).join(" "), headline: w.slice(start, end).join(" "), sub: w.slice(end).join(" ") };
  }
  const wc = s => String(s || "").trim().split(/\s+/).filter(Boolean).length;
  function copyIssues(c, max) {
    const out = [], total = wc(c.kicker) + wc(c.headline) + wc(c.sub);
    if (total > (max || 7)) out.push(`${total} words (max ${max || 7})`);
    if (wc(c.headline) > 4) out.push("Headline is long; the big text may wrap to 3+ lines");
    return out;
  }

  /* ---------- Mascot picker (emoji-style) ----------
     A grid of every mascot in the shared library. One click picks it, the + tile uploads more. */
  let mascotCache = null;
  async function loadMascots(force) {
    if (!mascotCache || force) { try { mascotCache = await listAssets("mascot"); } catch (e) { mascotCache = []; } }
    return mascotCache;
  }
  const DEFAULT_MASCOT_SVG = '<svg viewBox="0 0 40 40" width="100%" height="100%"><defs><radialGradient id="mg" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#A57BFF"/><stop offset="1" stop-color="#4A1FD1"/></radialGradient></defs><ellipse cx="20" cy="22" rx="18" ry="16.5" fill="url(#mg)"/><ellipse cx="14.5" cy="22" rx="2.2" ry="4" fill="#fff"/><ellipse cx="25.5" cy="22" rx="2.2" ry="4" fill="#fff"/></svg>';
  function mascotPicker(box, opts) {
    opts = opts || {};
    let value = opts.value || "", q = "";
    box.classList.add("mp"); box.style.display = "block";
    box.innerHTML = '<input type="text" class="mp-q" placeholder="Search mascots by name…" hidden><div class="mp-grid"></div><div class="mp-foot"></div>';
    const grid = box.querySelector(".mp-grid"), search = box.querySelector(".mp-q"), foot = box.querySelector(".mp-foot");
    const file = document.createElement("input"); file.type = "file"; file.accept = "image/*"; file.multiple = true; file.hidden = true; box.appendChild(file);
    const tile = (label, inner, selected, onClick) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "mp-t" + (selected ? " on" : ""); b.title = label; b.innerHTML = inner; b.onclick = onClick; return b;
    };
    async function draw(force) {
      const items = await loadMascots(force), shown = q ? items.filter(i => i.name.toLowerCase().includes(q)) : items;
      search.hidden = items.length <= 12;
      grid.innerHTML = "";
      grid.appendChild(tile("Default mascot", DEFAULT_MASCOT_SVG, !value, () => pick("", null)));
      shown.forEach(it => grid.appendChild(tile(it.name, `<img src="${esc(it.url)}" alt="" loading="lazy">`, it.url === value, () => pick(it.url, it))));
      grid.appendChild(tile("Upload more mascots (PNG with a transparent background)", "+", false, () => file.click()));
      foot.textContent = items.length ? `${items.length} mascot${items.length > 1 ? "s" : ""}. Click one to choose it, + to add more.` : "No mascots yet. Click + to upload your first one (PNG, transparent background).";
    }
    function pick(url, item) { value = url; draw(); if (opts.onPick) opts.onPick(url, item); }
    search.oninput = () => { q = search.value.trim().toLowerCase(); draw(); };
    file.onchange = async () => {
      const files = [...file.files]; file.value = ""; if (!files.length) return;
      try {
        const cfg = await config(), ups = [];
        for (const f of files) ups.push(await uploadFile("mascot", f));
        if (!cfg.offline) { toast(`${files.length} mascot${files.length > 1 ? "s" : ""} added`); await loadMascots(true); }
        value = ups[0].url; if (opts.onPick) opts.onPick(value, ups[0]); draw();
      } catch (e) { toast(e.message); }
    };
    draw();
    return { setValue(v) { value = v || ""; draw(); } };
  }

  /* Guidelines panel for a pill. The look / realism / never-include text is read from the same
     locked style block that goes into every prompt, so the two can never disagree. */
  function guideHTML(key, opts) {
    const t = TREATMENTS[key]; if (!t) return "";
    const rules = `<ul>${t.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul>`;
    if (opts && opts.compact) return `<b>${esc(t.name)}</b><br>${esc(t.style)}${rules}<a href="generate?treatment=${esc(key)}">Full guidelines and prompt builder →</a>`;
    const parts = String(t.lock || "").split("\n\n");
    const get = h => { const p = parts.find(x => x.startsWith(h + ":")); return p ? p.slice(h.length + 1).trim() : ""; };
    const avoid = get("Avoid").replace(/\.$/, "").split(", ").filter(Boolean);
    return `<b>How we use it</b>${rules}
      <details class="g" open><summary>Full guidelines</summary>
        <h4>The look</h4><p>${esc(get("Style"))}</p>
        <h4>Keep it real</h4><p>${esc(get("Realism"))}</p>
        <h4>Never include</h4><div class="chips">${avoid.map(a => `<span>${esc(a)}</span>`).join("")}</div>
        <h4>Locked style block</h4><p>Added to the end of every prompt. It can't be changed from the fields.</p>
        <details class="g2"><summary>Show the exact text</summary><pre class="lock">${esc(t.lock || "")}</pre></details>
      </details>`;
  }

  function offlineMsg(cfg) {
    return `<b>Shared storage isn't connected</b>${cfg && cfg.reason ? " (" + esc(cfg.reason) + ")" : ""}. Open <a href="api/health" target="_blank">api/health</a> to see what is missing. The setup steps are in DEPLOY.md.`;
  }

  return { mascotPicker, loadMascots, guideHTML, offlineMsg, api, config, readFile, uploadFile, listAssets, pickAsset, nav, toast, esc, TREATMENTS, buildPrompt, defaults, nameColor, splitCopy, copyIssues };
})();
