const params = new URLSearchParams(location.search);
const url = params.get("url") || "";
const status = params.get("status") || "malicious";
const reason = params.get("reason") || "This website matches known danger patterns.";
const confidence = params.get("confidence");

document.getElementById("url").textContent = url;
document.getElementById("reason").textContent = reason;
document.getElementById("status").textContent = status.toUpperCase();
if (confidence) document.getElementById("conf").textContent = "(Confidence: " + confidence + "%)";

if (status === "suspicious") {
  document.getElementById("box").classList.add("suspicious");
  document.getElementById("icon").innerHTML = "&#9888;&#65039;";
  document.getElementById("word").textContent = "suspicious";
} else {
  document.getElementById("word").textContent = "fake or dangerous";
}

document.getElementById("backBtn").addEventListener("click", function () {
  if (history.length > 1) {
    history.back();
  } else {
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.update(tab.id, { url: "chrome://newtab/" });
    });
  }
});

document.getElementById("goBtn").addEventListener("click", function () {
  let host = "";
  try { host = new URL(url).hostname; } catch (e) {}
  chrome.runtime.sendMessage({ type: "ALLOW_HOST", host: host }, function () {
    location.href = url;
  });
});
