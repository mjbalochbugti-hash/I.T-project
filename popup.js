function render(data, url) {
  const box = document.getElementById("statusBox");
  if (!data) { box.innerHTML = '<span class="scanning">Could not reach ShieldScan backend.</span>'; return; }
  const cls = data.status || "safe";
  const icon = cls==="malicious"?"🚨 ":cls==="suspicious"?"⚠️ ":"✅ ";
  box.innerHTML = `
    <span class="${cls}">${icon}${cls.toUpperCase()}</span>
    <div class="url-text">${url||data.url||""}</div>
    ${data.reasons&&data.reasons[0]?`<div class="reason">${data.reasons[0]}</div>`:""}
  `;
}

chrome.storage.local.get("lastCheck", res => {
  if (res.lastCheck) render(res.lastCheck, res.lastCheck.url);
  else document.getElementById("statusBox").innerHTML = '<span class="scanning">Browse a page to scan it.</span>';
});

document.getElementById("rescanBtn").addEventListener("click", () => {
  chrome.tabs.query({ active:true, currentWindow:true }, tabs => {
    const url = tabs[0].url;
    document.getElementById("statusBox").innerHTML = '<span class="scanning">Scanning…</span>';
    chrome.runtime.sendMessage({ type:"MANUAL_CHECK", url }, data => render(data, url));
  });
});
