import { initSignalAnimations } from "../components/signal-animation.js";

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function shortWallet(address) {
  const value = String(address || "");
  if (value.toLowerCase() === "0x000000000000000000000000000000000000dead") return "BURN";
  return value.length > 12 ? value.slice(0, 6) + "…" + value.slice(-4) : value;
}

function graphSvg(data) {
  const holders = (data.holders || []).slice(0, 6);
  const spots = [
    [150, 250], [310, 140], [560, 120], [820, 230], [760, 470], [280, 500],
  ];
  const lines = holders.map((_, i) => {
    const [x, y] = spots[i];
    return `<line x1="470" y1="330" x2="${x}" y2="${y}" stroke="#ffd800" stroke-opacity=".45" stroke-width="2"/>`;
  }).join("");
  const nodes = holders.map((holder, i) => {
    const [x, y] = spots[i];
    const share = holder.share == null ? "" : (holder.share * 100).toFixed(1) + "%";
    return `<g><circle cx="${x}" cy="${y}" r="16" fill="#ffd800"/><text x="${x}" y="${y + 36}" fill="#d7d7d0" font-size="13" text-anchor="middle">${esc(shortWallet(holder.wallet))}</text><text x="${x}" y="${y + 54}" fill="#9b9b91" font-size="12" text-anchor="middle">${esc(share)}</text></g>`;
  }).join("");
  const top = holders[0] && holders[0].share != null ? (holders[0].share * 100).toFixed(0) + "% top holder" : "top holders";
  const title = data.symbol ? "$" + data.symbol : "Token";
  return `<svg viewBox="0 0 960 720" role="img" aria-label="Live top holders for ${esc(title)}">`
    + `<rect width="960" height="720" rx="38" fill="#0a0b09"/>`
    + lines
    + `<circle cx="470" cy="330" r="78" fill="#11120f" stroke="#ffd800" stroke-width="3"/>`
    + `<text x="470" y="322" fill="#ffd800" font-size="20" font-weight="800" text-anchor="middle">${esc(title)}</text>`
    + `<text x="470" y="348" fill="#9b9b91" font-size="14" text-anchor="middle">${esc(top)}</text>`
    + nodes
    + `<text x="48" y="64" fill="#f5f5f5" font-family="ui-monospace,monospace" font-size="16">LIVE HOLDER LIST</text>`
    + `</svg>`;
}

async function loadEvidenceGraph(page) {
  const box = page.querySelector("[data-evidence-graph]");
  if (!box) return;
  let data;
  try {
    const response = await fetch("/api/graph", { cache: "no-store" });
    if (!response.ok) return;
    data = await response.json();
  } catch (error) {
    return;
  }
  if (!data || !Array.isArray(data.holders) || !data.holders.length) return;
  box.innerHTML = graphSvg(data);
  const kicker = page.querySelector("[data-evidence-kicker]");
  const note = page.querySelector("[data-evidence-note]");
  const t = window.FS && window.FS.i18n ? window.FS.i18n.t : (s) => s;
  if (kicker) {
    kicker.dataset.i18n = "Live holder list";
    kicker.textContent = t("Live holder list");
  }
  if (note) {
    note.dataset.i18n = "Public top holders — not a scored verdict.";
    note.textContent = t("Public top holders — not a scored verdict.");
  }
}

export function initAboutPage(scope = document) {
  const page = scope.querySelector("[data-about-page]");
  if (!page || page.dataset.initialized === "true") return;
  page.dataset.initialized = "true";
  page.querySelectorAll("[data-signal-reveal]").forEach((node) => {
    node.setAttribute("data-signal-animation", "");
  });
  page.classList.add("is-signal-ready");
  initSignalAnimations(page);
  loadEvidenceGraph(page);
}

initAboutPage();
