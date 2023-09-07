currentApp = "None"
installedApps = {}

getApps();

function getApps() {

    fetch("/api/installedapps").then(function (response) {
        return response.json();
    }).then(function (apps) {
        var appBar = document.getElementById("appBar");
        var appIframes = document.getElementById("appIframes");
        installedApps = apps;

        Object.keys(apps).forEach(function (key) {
            var temp = document.createElement('div');
            temp.innerHTML = `<button style="width: 100%; margin-bottom: 15px;" onclick="loadApp('${key}')">${apps[key].name}</button>`.trim();
            appBar.appendChild(temp.firstChild);
            var appframe = document.createElement('iframe');
            appframe.className = "appFrame";
            appframe.id = `appFrame_${key}`;
            appframe.src = `/apps/${key}/index.html`;
            appframe.hidden = true;
            appIframes.appendChild(appframe);
        });

        loadApp(Cookies.get('App'))
    })
}

function loadApp(app) {
    if (app == currentApp) {
        return;
    }

    if (!app) {
        app = Object.keys(installedApps)[0];
        currentApp = app
    }


    if (currentApp != "None") {
        document.getElementById(`appFrame_${currentApp}`).hidden = true;
    }
    document.getElementById(`appFrame_${app}`).hidden = false;

    currentApp = app
    Cookies.set('App', app)

}

