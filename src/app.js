const switcher = document.getElementById("switch");
const saveBtn = document.getElementById("save-edit");
const cancelBtn = document.getElementById("cancel-edit");
const destroyBtn = document.getElementById("destroy-edit");
const addBtn = document.getElementById("add-btn");

const inputAppName = document.getElementById("app-name");
const inputAppProduction = document.getElementById("app-production");
const inputAppStaging = document.getElementById("app-staging");

const BLANK_APP = {name: "", staging: "", production: ""};

let apps = [];

async function setStorageAsync(name, value) {
  await chrome.storage.sync.set({ [name]: value });
}

async function getStorageAsync(name) {
  const result = await chrome.storage.sync.get([name])

  return result[name]
}

function navigate(pageId) {
  const pages = document.querySelectorAll(".page");
  const targetPage = document.getElementById(pageId);

  Array.from(pages).forEach(page => {
    page.style.display = "none";
  });

  targetPage.style.display = "flex";
}

async function saveAppsAsync(appsCollection) {
  await setStorageAsync("apps", appsCollection);

  apps = appsCollection;
  showApps();
}

function showApps() {
  const homeApps = document.getElementById("home-apps");

  if(apps.length == 0){
    homeApps.innerHTML = `
      <span class="alert">No apps found, try creating a new one</span>
    `;

    return;
  }

  homeApps.innerHTML = '';

  apps.forEach((app, index) => {
    const app_btn = document.createElement("button");
    app_btn.innerText = app.name;
    app_btn.classList.add("btn");
    app_btn.onclick = () => editApp(index);

    homeApps.appendChild(app_btn);
  });
}

function editApp(index) {
  const currentApp = apps[index] || BLANK_APP;

  inputAppName.value = currentApp.name;
  inputAppProduction.value = currentApp.production;
  inputAppStaging.value = currentApp.staging;

  saveBtn.onclick = () => saveFormApp(index);

  if(currentApp.name) {
    destroyBtn.onclick = () => destroyApp(index);
  } else {
    destroyBtn.style.display = "none";
  }

  navigate("edit-page");
}

async function saveFormApp(appIndex) {
  let name = inputAppName.value;
  let production = inputAppProduction.value;
  let staging = inputAppStaging.value;

  const currentApp = {name, production, staging};
  let newApps = [];

  if(typeof(appIndex) == 'number'){
    newApps = apps.map((app, index) => appIndex == index ? currentApp : app );
  }
  else {
    newApps = [...apps, currentApp];
  }

  await saveAppsAsync(newApps)

  navigate("home-page");
}

async function destroyApp(appIndex) {
  let newApps = apps.filter((app, index) => appIndex != index );

  await saveAppsAsync(newApps);

  navigate("home-page");
}

async function loadActive(){
  const active = await getStorageAsync('showEnvInfo');

  switcher.checked = active;
}

async function init() {
  await loadActive();

  switcher.addEventListener("change", (event) => {
    setStorageAsync('showEnvInfo', event.target.checked);
  });

  apps = await getStorageAsync("apps");

  showApps();

  addBtn.onclick = () => editApp(null);
  cancelBtn.onclick = () => navigate("home-page");
}

init();
