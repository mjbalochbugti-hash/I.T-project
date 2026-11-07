// ShieldScan - background.js
// Before a page opens, the URL is checked with the backend.
// If it is suspicious or malicious, the tab is sent to warning.html (the alert box).

const API_URL = "http://localhost:5000/api/check-url";
const CACHE_TIME = 60 * 1000;          // remember a result for 1 minute
const ALLOW_TIME = 10 * 60 * 1000;     // "Continue anyway" is remembered for 10 minutes
const resultCache = new Map();

async function checkUrl(url) {
  const cached = resultCache.get(url);
  if (cached && Date.now() - cached.time < CACHE_TIME) return cached.data;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url })
    });
    const data = await response.json();
    resultCache.set(url, { time: Date.now(), data: data });
    return data;
  } catch (err) {
    console.log("ShieldScan: backend not reachable -", err.message);
    return null;
  }
}

async function isAllowed(host) {
  const key = "allow_" + host;
  const saved = await chrome.storage.session.get(key);
  return !!saved[key] && saved[key] > Date.now();
}

function shouldIgnore(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return true;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return true;
  return false;
}

chrome.webNavigation.onBeforeNavigate.addListener(async function (details) {
  if (details.frameId !== 0) return;
  const url = details.url;
  if (shouldIgnore(url)) return;

  let host = "";
  try { host = new URL(url).hostname; } catch (e) { return; }
  if (await isAllowed(host)) return;

  const data = await checkUrl(url);
  if (!data) return;

  chrome.storage.local.set({
    lastCheck: { url: url, status: data.status, reasons: data.reasons, confidence: data.confidence }
  });

  if (data.status === "suspicious" || data.status === "malicious") {
    const params = new URLSearchParams({
      url: url,
      status: data.status,
      reason: data.reasons && data.reasons[0] ? data.reasons[0] : "",
      confidence: data.confidence || ""
    });
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL("warning.html?" + params.toString())
    });
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "MANUAL_CHECK") {
    checkUrl(message.url).then(function (data) { sendResponse(data); });
    return true;
  }
  if (message.type === "ALLOW_HOST") {
    const key = "allow_" + message.host;
    chrome.storage.session.set({ [key]: Date.now() + ALLOW_TIME }).then(function () {
      sendResponse({ ok: true });
    });
    return true;
  }
});
