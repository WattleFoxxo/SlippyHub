
function updateDeviceConn() {
    var menu = document.getElementById("DeviceConn");
    if (menu.value == "serial") {
        document.getElementById("device_serial").hidden = false;
        document.getElementById("device_tcp").hidden = true;
    } else {
        document.getElementById("device_serial").hidden = true;
        document.getElementById("device_tcp").hidden = false;
    }
}