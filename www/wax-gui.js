var tempSlider = document.getElementById('tempSlider');
var tempCurDiv = document.getElementById("tempCurDiv");
var unitsF = document.getElementById("unitsF");
var unitsC = document.getElementById("unitsC");
var conditionsForm = document.getElementById("conditionsForm");
var getWaxButton = document.getElementById("getWax");
var brandsDiv = document.getElementById("brandsDiv");
var resultsText = document.getElementById("resultsText");
var shareBtn = document.getElementById("shareBtn");
var brandCheckboxes = [];
var brandString = "";
var snowCondition;
var temperature;
var myDB;

String.prototype.endsWith = function(str) {
    return (this.match(str + "$") == str)
}

const NO_WAX = '{' +
    '"color":"none",' +
    '"brand":"none",' +
    '"picture":"waxless.png",' +
    '"name":"none"' +
    '}';

tempSlider.oninput = function() {
    var unit = "C";
    if (unitsF.checked) {
        unit = "F";
    }
    tempCurDiv.innerHTML = this.value + "°" + unit;
};

function fToC(degF) {
    var degC = ((5.0 / 9.0) * (degF - 32));
    return (degC);
}

function buildBrandCheckboxes() {

    buildBrandCheckbox("Swix");
    buildBrandCheckbox("Toko");
    buildBrandCheckbox("Toko_SportLine");
}

function buildBrandCheckbox(name) {
    var newLabel = document.createElement('label');
    newLabel.for = name + "Checkbox";
    newLabel.innerHTML = name;
    newLabel.className = 'checkbox-inline';
    brandsDiv.appendChild(newLabel);
    var newCB = document.createElement('input');
    newCB.type = 'checkbox';
    newCB.name = name + 'Checkbox';
    newCB.value = name;
    newCB.checked = true;

    newCB.id = name + 'checkbox';

    brandCheckboxes.push(newCB);
    brandsDiv.appendChild(newCB);

}

conditionsForm.onsubmit = function() {
    var celsiusTemp = this.temperature.value;
    if (this.units.value == "Imperial") {

        celsiusTemp = fToC(this.temperature.value);
    }
    brandString = "";
    for (i in brandCheckboxes) {
        var brand = brandCheckboxes[i];
        if (brand.checked === true) {
            if (brandString.length > 0) {
                brandString += ',';
            }
            brandString += brand.value;

        }
    }
    snowCondition = this.conditions.value;
    temperature = celsiusTemp;
    getWax();
    return false;
}

function getWax() {

    var minTempStr = "newMinTemp";
    var maxTempStr = "newMaxTemp";
    var isKlister = 0;
    if (snowCondition === "Transformed") {
        minTempStr = "transMinTemp";
        maxTempStr = "transMaxTemp";
    } else if (snowCondition === 'Ice' || snowCondition === 'Corn') {
        isKlister = 1;
    }

    if (!brandString || brandString === "") {
        showWax(NO_WAX);
        return;
    }
    //Build the brand string.  TODO - is this safe?
    var brandQueryString = "(";
    var brands = brandString.split(',');
    for (var brand in brands) {
        if (!!brandQueryString.endsWith && brandQueryString.endsWith("'")) { //this is not the first brand, include separator
            brandQueryString += " OR ";
        }
        brandQueryString += "brand == '" + brands[brand] + "'";
    }
    brandQueryString += ")";

    var stmt = myDB.executeSql('select * from Waxes where ' + brandQueryString + " AND " + minTempStr + '<= (?) AND ' + maxTempStr + ' >= (?) AND isKlister==? order by abs\( (?) - \(' + maxTempStr + "+" + minTempStr + '/ 2\)\)', [temperature, temperature, isKlister, temperature], function(res) {

        var jsonData;
        if (res.rows.length > 0) {
            jsonData = '{' +
                '"color":"' + res.rows.item(0).color + '",' +
                '"brand":"' + res.rows.item(0).brand + '",' +
                '"picture":"' + res.rows.item(0).picture + '",' +
                '"name":"' + res.rows.item(0).name + '"' +
                '}';

        } else {
            jsonData = NO_WAX;
        }
        showWax(JSON.parse(jsonData));
    }, function(error) {
        console.log('Query error: ' + error.message);
    });
}

function showWax(wax) {
    resultsDiv.className = "jumbotron visibleResult";

    if (wax.brand === 'none') {
        resultsText.textContent = "No suitable wax found for these conditions";
        shareBtn.style.visibility = "hidden";
    } else {
        resultsText.textContent = wax.brand + " " + wax.name;
        shareBtn.style.visibility = "visible";
    }
    if (!!wax.picture) {
        var waxImage = document.getElementById("waxImage");
        waxImage.src = 'images/' + wax.picture;
    }

}

function shareWax() {
    window.plugins.socialsharing.share('My phone says the wax is ' + resultsText.textContent, "Wax Recommendation", 'www/' + waxImage.src, null);
}

function tempChange() {

    if (unitsF.checked) {
        tempSlider.max = 40;
    } else {
        tempSlider.max = 15;
    }
    tempSlider.oninput();
}
unitsC.onclick = tempChange;
unitsF.onclick = tempChange;

//TODO, get brands from db
buildBrandCheckboxes();

// Wait for Cordova to load
document.addEventListener('deviceready', onDeviceReady, false);

// Cordova is ready
function onDeviceReady() {
    myDB = window.sqlitePlugin.openDatabase({
        name: "waxdb.db",
        createFromLocation: 1,
        createFromResource: 1
    });
    shareBtn.style.visibility = "hidden";
}