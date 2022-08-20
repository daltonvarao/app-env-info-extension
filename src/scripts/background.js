const PROD_URL = "app.teceo.co";
const HOMOLOG_URL = "app.homolog.teceo.co";

const PROD_COLOR = "#FF703D";
const DEV_COLOR = "#00DAAD";
const HML_COLOR = "#3366FF";

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
  const { text, color } = getCurrentEnv(tab.url);
  chrome.action.setBadgeText({ text });
  chrome.action.setTitle({
    title: `Você está utilizando a versão de ${text} da teceo`,
  });

  if (!color) return;
  chrome.action.setBadgeBackgroundColor({ color });

  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["./src/scripts/style.css"],
  });

  const { showEnvInfo } = await chrome.storage.sync.get(["showEnvInfo"]);

  if (!showEnvInfo) return;

  if (tab.status === "complete") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showEnvBadge,
      args: [color, text],
    });
  }
};

const getCurrentEnv = (url) => {
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return { text: "DEV", color: DEV_COLOR };
  }

  if (url.includes(PROD_URL)) {
    return { text: "PROD", color: PROD_COLOR };
  }

  if (url.includes(HOMOLOG_URL)) {
    return { text: "HML", color: HML_COLOR };
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
  if (changes.showEnvInfo.newValue) {
    changeEnv(tab);
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: removeEnvBadge,
    });
  }
});
