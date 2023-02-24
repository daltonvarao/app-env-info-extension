const PROD_COLOR = "#FF703D";
const DEV_COLOR = "#00DAAD";
const STAGING_COLOR = "#3366FF";

async function getStorageAsync(name) {
  const result = await chrome.storage.sync.get([name]);

  return result[name];
}

function showEnvBadge(color, env) {
  const div = document.createElement("div");
  div.style.left = String(window.innerWidth / 2 - 60) + "px";
  div.innerText = env;
  div.style.backgroundColor = color;
  div.id = "is-in-prod-badge";
  div.classList.add("env-badge");
  const envBadgeExists = document.getElementById(div.id);
  if (!envBadgeExists) {
    document.body.appendChild(div);
  }
}

function removeEnvBadge() {
  const envBadgeExists = document.getElementById("is-in-prod-badge");

  if (envBadgeExists) {
    document.body.removeChild(envBadgeExists);
  }
}

const changeEnv = async (tab) => {
  const { showEnvInfo } = await chrome.storage.sync.get(["showEnvInfo"]);

  if (!showEnvInfo) return;

  const { text, color } = await getCurrentEnv(tab.url);
  chrome.action.setBadgeText({ text });
  chrome.action.setTitle({ title: `In ${text} mode` });

  if (!color) return;
  chrome.action.setBadgeBackgroundColor({ color });

  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["./src/scripts/background.css"],
  });

  if (tab.status === "complete") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showEnvBadge,
      args: [color, text],
    });
  }
};

const matchAnyUrls = (url, compareUrls) => {
  let match = false;

  for (const index in compareUrls) {
    const sanitizedUrl = compareUrls[index]
      .replaceAll(".", "\\.")
      .replaceAll("*", "");
    const regex = new RegExp(sanitizedUrl, "i");

    if (url.match(regex)) {
      match = true;

      break;
    }
  }

  return match;
};

const getCurrentEnv = async (url) => {
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return { text: "DEV", color: DEV_COLOR };
  }

  const apps = await getStorageAsync("apps");
  let production_urls = apps?.map((app) => app.production);

  if (matchAnyUrls(url, production_urls)) {
    return { text: "PRODUCTION", color: PROD_COLOR };
  }

  let staging_urls = apps?.map((app) => app.staging);

  if (matchAnyUrls(url, staging_urls)) {
    return { text: "STAGING", color: STAGING_COLOR };
  }

  return {
    text: "",
    color: "",
  };
};

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  changeEnv(tab);
});

chrome.tabs.onUpdated.addListener(async (_, __, tab) => {
  changeEnv(tab);
});

chrome.storage.onChanged.addListener(async function (changes) {
  let [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (changes.showEnvInfo?.newValue) {
    changeEnv(tab);
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: removeEnvBadge,
    });
  }
});
