var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var latitude;
var longitude;
var timestamp;

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
        "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showLocationError);
    } else {
        console.log("Geolocation not available");
    }
}

function showPosition(position) {
    $('body').append($('<option/>', {
        value: ""+position.coords.latitude,
        id: "latitude"
    }));
    $('body').append($('<option/>', {
        value: ""+position.coords.longitude,
        id: "longitude"
    }));
    $('body').append($('<option/>', {
        value: ""+position.timestamp,
        id: "timestamp"
    }));
}

function showLocationError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            $("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-warning fade-in'>User denied the request for Geolocation.</span>");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            $("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-warning fade-in'>Location information is unavailable.</span>");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            $("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-warning fade-in'>The request to get user location timed out.</span>");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            $("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-warning fade-in'>An unknown error occurred.</span>");
            break;
    }
}

function dodajOsebo() {
    sessionId = getSessionId();

    var ime = $("#kreirajIme").val();
    var priimek = $("#kreirajPriimek").val();
    var datumRojstva = $("#kreirajDatumRojstva").val();

    if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
        $("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
    } else {
        $.ajaxSetup({
            headers: {"Ehr-Session": sessionId}
        });
        $.ajax({
            url: baseUrl + "/ehr",
            type: 'POST',
            success: function (data) {
                var ehrId = data.ehrId;
                var partyData = {
                    firstNames: ime,
                    lastNames: priimek,
                    dateOfBirth: datumRojstva,
                    partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
                };
                $.ajax({
                    url: baseUrl + "/demographics/party",
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(partyData),
                    success: function (party) {
                        if (party.action == 'CREATE') {
                            $("#kreirajSporocilo").append("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
                            console.log("Uspešno kreiran EHR '" + ehrId + "'.");
                            $('#preberiPredlogoOsebe').append($('<option/>', {
                                value: ""+ime+","+priimek+","+datumRojstva+"",
                                text : ""+ime+" "+priimek+""
                            }));
                            $('#dodajTemperaturo').append($('<option/>', {
                                value: ""+ehrId+"",
                                text : ""+ime+" "+priimek+""
                            }));
                            $("#preberiEHRid").val(ehrId);
                        }
                    },
                    error: function(err) {
                        $("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                        console.log(JSON.parse(err.responseText).userMessage);
                    }
                });
            }
        });
    }
}

function dodajMeritevTemperature() {
    sessionId = getSessionId();

    var ehrId = $("#preberiEHRid").val();
    var temperatura = $("#dodajTelesnaTemperatura").val();

    getLocation();
    latitude = $("#latitude").val();
    longitude = $("#longitude").val();
    timestamp = $("#timestamp").val();

    if (!ehrId || ehrId.trim().length == 0 || !temperatura || temperatura.trim().length == 0) {
        $("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
    } else {
        console.log(timestamp);
        timestamp = Date.parse(timestamp);
        console.log(timestamp);
        var date = new Date(timestamp);
        //if(currentPosition != null) {
        //    $.ajaxSetup({
        //        headers: {"Ehr-Session": sessionId}
        //    });
        //    var podatki = {
        //        "ctx/language": "en",
        //        "ctx/territory": "SI",
        //        "ctx/time": datumInUra,
        //        "vital_signs/body_temperature/any_event/temperature|magnitude": temperatura,
        //        "vital_signs/body_temperature/any_event/temperature|unit": "°C"
        //    };
        //    var parametriZahteve = {
        //        "ehrId": ehrId,
        //        templateId: 'Vital Signs',
        //        format: 'FLAT',
        //        committer: merilec
        //    };
        //}
    }


}


$(document).ready(function() {
    $('#preberiPredlogoOsebe').change(function() {
        $("#kreirajSporocilo").html("");
        var podatki = $(this).val().split(",");
        $("#kreirajIme").val(podatki[0]);
        $("#kreirajPriimek").val(podatki[1]);
        $("#kreirajDatumRojstva").val(podatki[2]);
    });
    $("#dodajTemperaturo").change(function() {
        var podatki = $(this).val();
        $("#preberiEHRid").val(podatki);
    });
});

