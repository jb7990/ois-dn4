var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';
var osebe = [{ "ime" : "Janez", "priimek" : "Novak", "datumRojstva" : "1968-03-12T07:35", "ehrId" : "9f3a1583-d9ee-4524-a4c4-91af1e4808c1" },
             { "ime" : "Majda", "priimek" : "Anders", "datumRojstva" : "1960-09-21T04:29", "ehrId" : "8d2c6b4b-4c39-4435-acea-de201aba801b" },
             { "ime" : "Monika", "priimek" : "Horvat", "datumRojstva" : "1987-04-23T10:30", "ehrId" : "625154ac-23a0-4289-8be8-63ab1f7f27df" }];
var username = "ois.seminar";
var password = "ois4fri";
var APIKEY = "387b7f21d745d323f43550ac4e419245";
var url = 'https://api.forecast.io/forecast/';
var meritevLokacija = [];
var trenutnaPoizvedba = [];

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
        navigator.geolocation.getCurrentPosition(showPosition, showLocationError, {timeout:10000});
    } else {
        console.log("Geolocation not available");
    }
}

function showPosition(position) {
    $("#latitude").val(position.coords.latitude);
    $("#longitude").val(position.coords.longitude);
    var date = new Date(position.timestamp);
    var tempDate = date.toISOString();
    $("#date").val(tempDate);
    var dateStart = tempDate.substr(0,11);
    var dateTime = date.toLocaleTimeString();
    var dateEnd = tempDate.substring(19,date.length);
    date = dateStart.concat(dateTime, dateEnd);
    $("#dateLocal").val(date);
}

function showLocationError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            $("#lokacijaError").html("<span class='label label-warning fade-in pull-right'>User denied the request for Geolocation.</span>");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            $("#lokacijaError").html("<span class='label label-warning fade-in pull-right'>Location information is unavailable.</span>");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            $("#lokacijaError").html("<span class='label label-warning fade-in pull-right'>The request to get user location timed out.</span>");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            $("#lokacijaError").html("<span class='label label-warning fade-in pull-right'>An unknown error occurred.</span>");
            break;
    }
}

function dodajOsebo() {
    sessionId = getSessionId();

    var ime = $("#kreirajIme").val();
    var priimek = $("#kreirajPriimek").val();
    var datumRojstva = $("#kreirajDatumRojstva").val();

    var celoIme = ime+ " "+ priimek;

    for(var i = 0; i < meritevLokacija.length; i++) {
        if(meritevLokacija[i].ime == celoIme) {
            $("#kreirajSporocilo").html("<span class='label label-warning fade-in'>Ta oseba že obstaja!</span>");
            return;
        }
    }

    if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
        $("#kreirajSporocilo").html("<span class='label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
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
                            $("#kreirajSporocilo").html("<span class='label label-success fade-in'>Uspešno kreiran EHR.</span>");
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
                                $('#preglejTemperaturoOseba').append($('<option/>', {
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
                                    $('#preglejTemperaturoOseba').append($('<option/>', {
                                        value: ""+ehrId+"",
                                        text : ""+ime+" "+priimek+""
                                    }));
                                }
                            }
                        }
                    },
                    error: function(err) {
                        $("#kreirajSporocilo").html("<span class='label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                        console.log(JSON.parse(err.responseText).userMessage);
                    }
                });
            }
        });
    }
}

function preglejMeritveTemperature() {
    sessionId = getSessionId();

    var ime = $("#preglejTemperaturoOseba option:selected").text();
	var ehrId = $("#preglejTemperaturoOseba").val();
	var tip = $("#preglejTemperaturoTip").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0 || !ime || ime.trim().length == 0) {
		$("#preglejMeritveTemperature").html("<span class='label label-warning fade-in'>Prosim izberite osebo in tip poizvedbe!");
	} else {
        $.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveTemperature").html("<br/><span>Pridobivanje podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
				if(tip == "telesna temperatura") {
                    $.ajax({
                        url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            if (res.length > 0) {
                                trenutnaPoizvedba = [];
                                var meritveArray = [];
                                for(var i = 0; i < meritevLokacija.length; i++) {
                                    if(meritevLokacija[i].ime == ime) {
                                        meritveArray = meritevLokacija[i].meritve;
                                        break;
                                    }
                                }
                                var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-center'>Telesna temperatura</th><th class='text-right'>Zunanja temperatura</th></tr>";
                                for (var i in res) {
                                    var date = res[i].time.substring(0, res[i].time.length-10);
                                    console.log(date);
                                    var temp = 0;
                                    for(var j = 0; j < meritveArray.length; j++) {
                                        if(meritveArray[j].date == date) {
                                            temp = meritveArray[j].temperatura;
                                            break;
                                        }
                                    }
                                    trenutnaPoizvedba.push({
                                        "temperature" : res[i].temperature,
                                        "oTemperature" : temp,
                                        "date" : date
                                    });
                                    results += "<tr><td>" + date + "</td><td class='text-center'>" + res[i].temperature + " " 	+ res[i].unit + "</td><td class='text-right'>" + temp + " " + res[i].unit + "</td>";
                                }
                                results += "</table>";
                                results += '<button type="button" class="btn btn-primary btn-xs pull-right" onclick="narisiGraf()">Narisi graf</button>'
                                $("#rezultatMeritveTemperature").append(results);
                            } else {
                                $("#preglejMeritveTemperature").html("<span class='label label-warning fade-in'>Ni podatkov!</span>");
                            }
                        },
                        error: function() {
                            $("#preglejMeritveTemperature").html("<span class='label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }
                    });
                    $("#preglejMeritveTemperature").html("<span class='label label-warning fade-in'>");
                } else if(tip == "podhlajenost") {
                    var AQL =
                        "select " +
                        "t/data[at0002]/events[at0003]/time/value as time, " +
                        "t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperature, " +
                        "t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as unit " +
                        "from EHR e[e/ehr_id/value='" + ehrId + "'] " +
                        "contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
                        "where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude<35 " +
                        "order by t/data[at0002]/events[at0003]/time/value desc ";
                    $.ajax({
                        url: baseUrl + "/query?" + $.param({"aql": AQL}),
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            if (typeof res !== "undefined") {
                                trenutnaPoizvedba = [];
                                var meritveArray = [];
                                for(var i = 0; i < meritevLokacija.length; i++) {
                                    if(meritevLokacija[i].ime == ime) {
                                        meritveArray = meritevLokacija[i].meritve;
                                        break;
                                    }
                                }
                                var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-center'>Telesna temperatura</th><th class='text-right'>Zunanja temperatura</th></tr>";

                                for (var i in res.resultSet) {
                                    var date = res.resultSet[i].time.substring(0, res.resultSet[i].time.length-10);
                                    var temp = 0;
                                    for(var j = 0; j < meritveArray.length; j++) {
                                        if(meritveArray[j].date == date) {
                                            temp = meritveArray[j].temperatura;
                                            break;
                                        }
                                    }
                                    trenutnaPoizvedba.push({
                                        "temperature" : res.resultSet[i].temperature,
                                        "oTemperature" : temp,
                                        "date" : date
                                    });
                                    results += "<tr><td>" + date + "</td><td class='text-center'>" + res.resultSet[i].temperature + " " 	+ res.resultSet[i].unit + "</td><td class='text-right'>" + temp + " " + res.resultSet[i].unit + "</td>";
                                }
                                results += "</table>";
                                results += '<button type="button" class="btn btn-primary btn-xs pull-right" onclick="narisiGraf()">Narisi graf</button>'
                                $("#rezultatMeritveTemperature").append(results);
                            } else {
                                $("#preglejMeritveTemperature").html("<span class='label label-warning fade-in'>Ni podatkov!</span>");
                            }
                        },
                        error: function() {
                            $("#preglejMeritveTemperature").html("<span class='label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }
                    });
                    $("#preglejMeritveTemperature").html("<span class='label label-warning fade-in'>");
                } else if(tip == "vročina") {
                    var AQL =
                        "select " +
                        "t/data[at0002]/events[at0003]/time/value as time, " +
                        "t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperature, " +
                        "t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as unit " +
                        "from EHR e[e/ehr_id/value='" + ehrId + "'] " +
                        "contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
                        "where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude>37 " +
                        "order by t/data[at0002]/events[at0003]/time/value desc ";
                    $.ajax({
                        url: baseUrl + "/query?" + $.param({"aql": AQL}),
                        type: 'GET',
                        headers: {"Ehr-Session": sessionId},
                        success: function (res) {
                            if (typeof res !== "undefined") {
                                trenutnaPoizvedba = [];
                                var meritveArray = [];
                                for(var i = 0; i < meritevLokacija.length; i++) {
                                    if(meritevLokacija[i].ime == ime) {
                                        meritveArray = meritevLokacija[i].meritve;
                                        break;
                                    }
                                }
                                var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-center'>Telesna temperatura</th><th class='text-right'>Zunanja temperatura</th></tr>";

                                for (var i in res.resultSet) {
                                    var date = res.resultSet[i].time.substring(0, res.resultSet[i].time.length-10);
                                    var temp = 0;
                                    for(var j = 0; j < meritveArray.length; j++) {
                                        if(meritveArray[j].date == date) {
                                            temp = meritveArray[j].temperatura;
                                            break;
                                        }
                                    }
                                    trenutnaPoizvedba.push({
                                        "temperature" : res.resultSet[i].temperature,
                                        "oTemperature" : temp,
                                        "date" : date
                                    });
                                    results += "<tr><td>" + date + "</td><td class='text-center'>" + res.resultSet[i].temperature + " " 	+ res.resultSet[i].unit + "</td><td class='text-right'>" + temp + " " + res.resultSet[i].unit + "</td>";
                                }
                                results += "</table>";
                                results += '<button type="button" class="btn btn-primary btn-xs pull-right" onclick="narisiGraf()">Narisi graf</button>'
                                $("#rezultatMeritveTemperature").append(results);
                            } else {
                                $("#preglejMeritveTemperature").html("<span class='label label-warning fade-in'>Ni podatkov!</span>");
                            }
                        },
                        error: function() {
                            $("#preglejMeritveTemperature").html("<span class='label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                            console.log(JSON.parse(err.responseText).userMessage);
                        }
                    });
                    $("#preglejMeritveTemperature").html("<span class='label label-warning fade-in'>");
                }
            },
            error: function(err) {
                $("#preglejMeritveTemperature").html("<span class='label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
                console.log(JSON.parse(err.responseText).userMessage);
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
        $("#dodajMeritevTemperatureSporocilo").html("<span class='label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
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
                            var date = $("#dateLocal").val();
                            date = date.substring(0, date.length-5);
                            meritevLokacija[i].meritve.push({
                                "date" : date,
                                "longitude" : $("#longitude").val(),
                                "latitude" : $("#latitude").val(),
                                "temperatura" : zunTemperatura
                            });
                        } else {
                            var trenutni = meritevLokacija[i].meritve;
                            var dateObstaja = false;
                            trenutni.forEach(function(date) {
                               var cDate = date.date;
                               if(cDate == $("#dateLocal").val()){
                                   dateObstaja = true;
                               }
                            });
                            if(!dateObstaja) {
                                var date = $("#dateLocal").val();
                                date = date.substring(0, date.length-5);
                                meritevLokacija[i].meritve.push({
                                    "date" : date,
                                    "longitude" : $("#longitude").val(),
                                    "latitude" : $("#latitude").val(),
                                    "temperatura" : zunTemperatura
                                });
                            }
                        }
                        break;
                    }
                }
                if(zunTemperatura > 0) {
                    $("#dodajMeritevTemperatureSporocilo").text("Ni nevarnosti za podhladitev.");
                } else {
                    $("#dodajMeritevTemperatureSporocilo").text("Nevarnost podhladitve!");
                }
                var trenText = $("#dodajMeritevTemperatureSporocilo").text();
                if(temperatura < 35) {
                    $("#dodajMeritevTemperatureSporocilo").html("<span class='label label-warning fade-in'>" + trenText + " Podhladitev!</span>");;
                } else if(temperatura > 37) {

                    $("#dodajMeritevTemperatureSporocilo").html("<span class='label label-warning fade-in'>" + trenText + " Vročina!</span>");
                } else {
                    if(trenText == "Nevarnost podhladitve!") {
                        $("#dodajMeritevTemperatureSporocilo").html("<span class='label label-warning fade-in'>" + trenText + " Normalna telesna temperatura.</span>");
                    } else {
                        $("#dodajMeritevTemperatureSporocilo").html("<span class='label label-success fade-in'>" + trenText + " Normalna telesna temperatura.</span>");
                    }
                }
		    },
		    error: function(err) {
		    	$("#dodajMeritevTemperatureSporocilo").html("<span class='label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
		    }
		});
    }

}

function pobrisiIme() {
    $("#kreirajIme").val("");
    $("#kreirajPriimek").val("");
    $("#kreirajDatumRojstva").val("");
}

function pobrisiDodaj() {
    $("#preberiEHRid").val("");
    $("#dodajTelesnaTemperatura").val("");
    $("#zunanjaTemperatura").val("");
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

function narisiGraf() {
    var dodanHtml =
        '<div class="panel panel-primary">' +
            '<div class="panel-heading">' +
                '<div><b>Graf</b></div>' +
            '</div>' +
            '<div class="panel-body">' +
                '<div id="graf"></div>'
            '</div>' +
        '</div>';
    $("#grafDiv").html(dodanHtml);

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = $("#graf").parent().width() - margin.left - margin.right,
        height = $("#preglejMeritve").height() - margin.top - margin.bottom - $("#grafDiv").height();

    var x0 = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var x1 = d3.scale.ordinal();

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.ordinal()
        .range(["#6b486b", "#d0743c"]);

    var xAxis = d3.svg.axis()
        .scale(x0)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format(".2s"));

    var svg = d3.select("#graf").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var dates = d3.keys(trenutnaPoizvedba[0]).filter(function(key) { return key !== "date"; });

    trenutnaPoizvedba.forEach(function(d) {
        d.dates = dates.map(function(name) { return {name: name, value: +d[name]}; });
    });


    x0.domain(trenutnaPoizvedba.map(function(d) { return d.date; }));
    x1.domain(dates).rangeRoundBands([0, x0.rangeBand()]);
    y.domain([0, d3.max(trenutnaPoizvedba, function(d) { return d3.max(d.dates, function(d) { return d.value; }); })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 2)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Temperature");

    var date = svg.selectAll(".date")
        .data(trenutnaPoizvedba)
        .enter().append("g")
        .attr("class", "g")
        .attr("transform", function(d) { return "translate(" + x0(d.date) + ",0)"; });

    date.selectAll("rect")
        .data(function(d) { return d.dates; })
        .enter().append("rect")
        .attr("width", x1.rangeBand())
        .attr("x", function(d) { return x1(d.name); })
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return height - y(d.value); })
        .style("fill", function(d) { return color(d.name); });

    dates[0] = "Zunanja temperatura";
    dates[1] = "Telesna temperatura";

    var legend = svg.selectAll(".legend")
        .data(dates.slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

    trenutnaPoizvedba.forEach(function(d){
        delete d.dates;
    });


}

function updateGraph() {
    if($("#graf").length) {
        $("#graf").empty();
        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = $("#graf").parent().width() - margin.left - margin.right,
            height = $("#preglejMeritve").height() - margin.top - margin.bottom - $("#grafDiv").height();

        var x0 = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var x1 = d3.scale.ordinal();

        var y = d3.scale.linear()
            .range([height, 0]);

        var color = d3.scale.ordinal()
            .range(["#6b486b", "#d0743c"]);

        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(d3.format(".2s"));

        var svg = d3.select("#graf").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var dates = d3.keys(trenutnaPoizvedba[0]).filter(function(key) { return key !== "date"; });


        trenutnaPoizvedba.forEach(function(d) {
            d.dates = dates.map(function(name) { return {name: name, value: +d[name]}; });
        });


        x0.domain(trenutnaPoizvedba.map(function(d) { return d.date; }));
        x1.domain(dates).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(trenutnaPoizvedba, function(d) { return d3.max(d.dates, function(d) { return d.value; }); })]);



        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 2)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Temperature");

        var date = svg.selectAll(".date")
            .data(trenutnaPoizvedba)
            .enter().append("g")
            .attr("class", "g")
            .attr("transform", function(d) { return "translate(" + x0(d.date) + ",0)"; });

        date.selectAll("rect")
            .data(function(d) { return d.dates; })
            .enter().append("rect")
            .attr("width", x1.rangeBand())
            .attr("x", function(d) { return x1(d.name); })
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { return height - y(d.value); })
            .style("fill", function(d) { return color(d.name); });

        dates[0] = "Zunanja temperatura";
        dates[1] = "Telesna temperatura";

        var legend = svg.selectAll(".legend")
            .data(dates.slice().reverse())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });
    }

    trenutnaPoizvedba.forEach(function(d){
        delete d.dates;
    });
}

window.onresize = updateGraph;

function convertToCelsius(fahr) {
    return Math.round(((fahr - 32) * 5/9 *10))/10;
}

function dodajOsebe() {
    for (var i = 0; i < osebe.length; i++) {
        var ime = osebe[i].ime;
        var priimek = osebe[i].priimek;
        var datumRojstva = osebe[i].datumRojstva;
        var ehrId = osebe[i].ehrId;
        $('#preberiPredlogoOsebe').append($('<option/>', {
            value: ""+ime+","+priimek+","+datumRojstva+"",
            text : ""+ime+" "+priimek+""
        }));
        $('#dodajTemperaturo').append($('<option/>', {
            value: ""+ehrId+"",
            text : ""+ime+" "+priimek+""
        }));
        $('#preglejTemperaturoOseba').append($('<option/>', {
            value: ""+ehrId+"",
            text : ""+ime+" "+priimek+""
        }));
        meritevLokacija.push({
            "ime" : ime + " " + priimek,
            "meritve" : []
        });
    }
    console.log(meritevLokacija);
    for(var i = 0; i < osebe.length; i++) {
        if(i == 0) {
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-14T13:00:00",
                "longitude" : "14.2285582",
                "latitude" : "45.9170819",
                "temperatura" : "7.4"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-15T13:00:00",
                "longitude" : "14.2285582",
                "latitude" : "45.9170819",
                "temperatura" : "10.5"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-16T07:00:00",
                "longitude" : "14.2285582",
                "latitude" : "45.9170819",
                "temperatura" : "8.4"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-17T23:00:00",
                "longitude" : "14.2285582",
                "latitude" : "45.9170819",
                "temperatura" : "6.2"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-17T18:00:00",
                "longitude" : "14.2285582",
                "latitude" : "45.9170819",
                "temperatura" : "5.8"
            });
        } else if(i == 1) {
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-14T13:00:00",
                "longitude" : "14.1145798",
                "latitude" : "46.3683266",
                "temperatura" : "5.6"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-15T04:00:00",
                "longitude" : "14.1145798",
                "latitude" : "46.3683266",
                "temperatura" : "3.4"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-16T19:00:00",
                "longitude" : "14.1145798",
                "latitude" : "46.3683266",
                "temperatura" : "4.7"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-17T07:00:00",
                "longitude" : "14.1145798",
                "latitude" : "46.3683266",
                "temperatura" : "2.8"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-18T16:00:00",
                "longitude" : "14.1145798",
                "latitude" : "46.3683266",
                "temperatura" : "3.2"
            });
        } else {
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-14T13:00:00",
                "longitude" : "13.8738185",
                "latitude" : "45.7093519",
                "temperatura" : "13.8"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-15T01:00:00",
                "longitude" : "13.8738185",
                "latitude" : "45.7093519",
                "temperatura" : "12.3"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-16T16:00:00",
                "longitude" : "13.8738185",
                "latitude" : "45.7093519",
                "temperatura" : "12.8"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-17T14:00:00",
                "longitude" : "13.8738185",
                "latitude" : "45.7093519",
                "temperatura" : "12.5"
            });
            meritevLokacija[i].meritve.push({
                "date" : "2014-12-18T07:00:00",
                "longitude" : "13.8738185",
                "latitude" : "45.7093519",
                "temperatura" : "5"
            });
        }
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
    $("#preglejTemperaturoOseba").change(function() {
       $("#preglejTemperaturoTip").val("");
       $("#rezultatMeritveTemperature").empty();
       preglejMeritveTemperature()
    });
});

