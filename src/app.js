const sw = document.getElementById("switch");

chrome.storage.sync.get(["showEnvInfo"], function ({ showEnvInfo }) {
  sw.checked = showEnvInfo;
});

sw.addEventListener("change", changeEnvInfo);

async function changeEnvInfo(ev) {
  await chrome.storage.sync.set({ showEnvInfo: ev.target.checked });
}
