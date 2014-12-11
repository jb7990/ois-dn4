var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";
var APIKEY = "387b7f21d745d323f43550ac4e419245";
var url = 'https://api.forecast.io/forecast/';
var weatherData;
var meritevLokacija = [];

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
        "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

window.onload = getLocation();


function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showLocationError, {timeout:10000});
    } else {
        console.log("Geolocation not available");
    }
}

function showPosition(position) {
    $("#latitude").val(position.coords.latitude);
    $("#longitude").val(position.coords.longitude);
    var date = new Date(position.timestamp).toISOString();
    $("#date").val(date);
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
                            if(meritevLokacija.length == 0) {
                                meritevLokacija.push({
                                    "ime" : ime + " " + priimek,
                                    "meritve" : []
                                });
                                $('#preberiPredlogoOsebe').append($('<option/>', {
                                    value: ""+ime+","+priimek+","+datumRojstva+"",
                                    text : ""+ime+" "+priimek+""
                                }));
                                $('#dodajTemperaturo').append($('<option/>', {
                                    value: ""+ehrId+"",
                                    text : ""+ime+" "+priimek+""
                                }));
                            } else {
                                var imeObstaja = false;
                                for(var i = 0; i < meritevLokacija.length; i++) {
                                    if(meritevLokacija[i].ime == ime + " " + priimek) {
                                        imeObstaja = true;
                                    }
                                }
                                if(imeObstaja == false) {
                                    meritevLokacija.push({
                                        "ime" : ime + " " + priimek,
                                        "meritve" : []
                                    });
                                    $('#preberiPredlogoOsebe').append($('<option/>', {
                                        value: ""+ime+","+priimek+","+datumRojstva+"",
                                        text : ""+ime+" "+priimek+""
                                    }));
                                    $('#dodajTemperaturo').append($('<option/>', {
                                        value: ""+ehrId+"",
                                        text : ""+ime+" "+priimek+""
                                    }));
                                }
                            }
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
    var zunTemperatura = $("#zunanjaTemperatura").val();

    getLocation();

    if (!ehrId || ehrId.trim().length == 0 || !temperatura || temperatura.trim().length == 0 || !zunTemperatura || zunTemperatura.trim().length == 0) {
        $("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
    } else {
        $.ajaxSetup({
            headers: {"Ehr-Session": sessionId}
        });
        var podatki = {
            "ctx/language": "en",
            "ctx/territory": "SI",
            "ctx/time": $("#date").val(),
            "vital_signs/body_temperature/any_event/temperature|magnitude": temperatura,
            "vital_signs/body_temperature/any_event/temperature|unit": "°C"
        };
        var parametriZahteve = {
            "ehrId": ehrId,
            templateId: 'Vital Signs',
            format: 'FLAT'
        };
        $.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		    	console.log(res.meta.href);
                var ime = $("#dodajTemperaturo").text();
                for(var i = 0; i < meritevLokacija.length; i++) {
                    if(meritevLokacija[i].ime == ime) {
                        if(meritevLokacija[i].meritve.length == 0) {
                            meritevLokacija[i].meritve.push({
                                "date" : $("#date").val(),
                                "longitude" : $("#longitude").val(),
                                "latitude" : $("#latitude").val()
                            });
                        } else {
                            var trenutni = meritevLokacija[i].meritve;
                            var dateObstaja = false;
                            trenutni.forEach(function(date) {
                               var cDate = date.date;
                               if(cDate == $("#date").val()){
                                   dateObstaja = true;
                               }
                            });
                            if(!dateObstaja) {
                                meritevLokacija[i].meritve.push({
                                    "date" : $("#date").val(),
                                    "longitude" : $("#longitude").val(),
                                    "latitude" : $("#latitude").val()
                                });
                            }
                        }
                        break;
                    }
                }
                if(zunTemperatura > 0) {
                    $("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-success fade-in'>Ni nevarnosti za podhladitev.</span>");
                } else {
                    $("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-success fade-in'>Nevarnost podhladitve!</span>");
                }
		    },
		    error: function(err) {
		    	$("#dodajMeritevTemperatureSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
		    }
		});
    }

}

function preglejTemperaturo() {
    getLocation();
    var latitude =  $("#latitude").val();
    var longitude = $("#longitude").val();
    var date = $("#date").val();
    date = date.substr(0, date.length-5);
    $.getJSON(url + APIKEY + "/" + latitude + "," + longitude + "," + date + "?callback=?", function(weatherData) {
        $("#zunanjaTemperatura").val(convertToCelsius(weatherData.currently.apparentTemperature));
    });
}

function convertToCelsius(fahr) {
    return Math.round(((fahr - 32) * 5/9 *10))/10;
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

