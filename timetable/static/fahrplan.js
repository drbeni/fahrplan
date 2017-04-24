var dateInput;
var hourInput;
var minuteInput;
var realDate;

initTimeSelect();

new autoComplete({
    selector: '#from',
    minChars: 2,
    source: function (term, response) {
        var ajax = new XMLHttpRequest();
        ajax.open("GET", "query/" + term, true);
        ajax.onload = function (data) {
            response(JSON.parse(data.target.response));
        };
        ajax.send();
    }
});

new autoComplete({
    selector: '#to',
    minChars: 2,
    source: function (term, response) {
        var ajax = new XMLHttpRequest();
        ajax.open("GET", "query/" + term, true);
        ajax.onload = function (data) {
            response(JSON.parse(data.target.response));
        };
        ajax.send();
    }
});

function incrementHour(inc) {
    if (parseInt(hourInput.value) + inc > 23) {
        incrementDate(1);
        hourInput.value = '00';
    }
    else if (parseInt(hourInput.value) + inc < 0) {
        incrementDate(-1);
        hourInput.value = 23;
    } else {
        hourInput.value = z(parseInt(hourInput.value) + inc);
    }

}

function incrementMinute(inc) {
    if (parseInt(minuteInput.value) + inc * 10 > 50) {
        incrementHour(1);
        minuteInput.value = '00';
    }
    else if (parseInt(minuteInput.value) + inc * 10 < 0) {
        incrementHour(-1);
        minuteInput.value = '50';
    } else {
        minuteInput.value = z((((parseInt(parseInt(minuteInput.value) / 10)) + inc) % 6) * 10);
    }
}

function incrementDate(inc) {
    var newDate = new Date(0);
    newDate.setMilliseconds(realDate.setDate(realDate.getDate() + inc));
    dateInput.value = formatDate(newDate);
    realDate = newDate;
}

function switch_locations() {
    var from = document.getElementById("from");
    var to = document.getElementById("to");
    var tmp = from.value;
    from.value = to.value;
    to.value = tmp;
}

function formatTime(timestamp) {
    var date = new Date(0);
    date.setSeconds(timestamp / 1000);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes;
}

function formatDuration(duration) {
    return new Date(duration).toISOString().substr(11, 5);
}

function formatDate(date) {
    return z(date.getDate()) + '.' + z(date.getMonth() + 1) + '.' + date.getFullYear();
}

function z(n) {
    if (n < 10)
        return '0' + n;
    return n;
}

function formatPlatform(platform) {
    if (!platform)
        return "";
    return "Gl. " + platform;
}

function toggleConnectionDetails(i) {
    var detailTable = document.getElementById("con_details_" + i);
    detailTable.style.display = detailTable.style.display == "none" ? "" : "none";
    var btn = document.getElementById("show_detail_button_" + i);
    btn.innerHTML = btn.innerHTML == "+" ? "-" : "+";
}

function initTimeSelect() {
    var now = new Date();
    dateInput = document.getElementById('date');
    hourInput = document.getElementById('hour');
    minuteInput = document.getElementById('minute');

    dateInput.value = formatDate(now);
    realDate = now;
    hourInput.value = z(now.getHours());
    minuteInput.value = z(now.getMinutes());
}

function getMidnightTime(date) {
    var millis = date.getTime();
    return millis - (millis % 86400000);
}

function addTitleRow(table, name, append) {
    var rowIndex = -1;
    if (!append)
        rowIndex = 0;

    var titleRow = table.insertRow(rowIndex);
    var titleCell = titleRow.insertCell(0);
    titleRow.className = 'title_row';
    titleCell.colSpan = 3;
    titleCell.innerHTML = '<p class="connection_title">' + name + '</p>';
}

function addContentRow(table, connection, i, append) {
    var contentRowIndex = -1;
    var detailRowIndex = -1;
    if (!append) {
        contentRowIndex = 0;
        detailRowIndex = 1;
    }

    var contentRow = table.insertRow(contentRowIndex);

    var startCol = contentRow.insertCell(0);
    var transferCol = contentRow.insertCell(1);
    var toCol = contentRow.insertCell(2);

    startCol.innerHTML = '<p class="time">' + formatTime(connection.realDepartureTime) + '</p><p>' + formatPlatform(connection.platform) + '</p>';
    transferCol.innerHTML = '<p class="time">' + formatDuration(connection.duration) + '</p><p>Umst.: ' + connection.transfers + '</p>';
    toCol.innerHTML = '<p class="time">' + formatTime(connection.realArrivalTime) + '</p><p><button id="show_detail_button_' + i + '" class="show_details" onclick="toggleConnectionDetails(\'' + i + '\')">+</button></p>';

    var detailRow = table.insertRow(detailRowIndex);
    var detailCol = detailRow.insertCell(0);
    detailRow.className = 'connection_details_row';
    detailCol.colSpan = 3;
    detailCol.innerHTML = '<div class="connection_details" style="display: none" id="con_details_' + i + '"></div>';
}

function addConnectionDetail(detailDiv, section) {
    var connectionDetailsRoute = '<p class="time">' + formatTime(section.from_time) + '</p>';
    connectionDetailsRoute += '<p class="platform">' + formatPlatform(section.from_platform) + '</p>';
    connectionDetailsRoute += '<p>' + section.route + '</p>';
    connectionDetailsRoute += '<p class="italic">' + formatDuration(section.to_time - section.from_time) + '</p>';
    connectionDetailsRoute += '<p class="time">' + formatTime(section.to_time) + '</p>';
    connectionDetailsRoute += '<p class="platform">' + formatPlatform(section.to_platform) + '</p>';

    detailDiv.innerHTML += '<div class="location">' + section.from + '</div><div class="connection_details_route">' + connectionDetailsRoute + '</div>';
}

function addNextButton(table, time) {
    var row = table.insertRow(-1);
    var col = row.insertCell(0);
    col.colSpan = 3;
    col.style.backgroundColor = '#fff';
    col.innerHTML = '<button onclick="do_query(' + time + ', true)" class="query_button">Sp&auml;ter</button>'
}

function addPrevButton(table, time) {
    var row = table.insertRow(0);
    var col = row.insertCell(0);
    col.colSpan = 3;
    col.style.backgroundColor = '#fff';
    col.innerHTML = '<button onclick="do_query(' + time + ', false)" class="query_button">Fr&uuml;her</button>'
}

function processConnection(table, connections, selectedTime, departure, i) {
    var connection = connections[i];

    if (departure) {
        addTitleRow(table, connection.name, departure);
        addContentRow(table, connection, selectedTime + '_' + i, departure);
    } else {
        addContentRow(table, connection, selectedTime + '_' + i, departure);
        addTitleRow(table, connection.name, departure);
    }

    var detailDiv = document.getElementById("con_details_" + selectedTime + '_' + i);
    detailDiv.innerHTML = '';

    for (var s = 0; s < connection.sections.length; s++) {
        var section = connection.sections[s];
        addConnectionDetail(detailDiv, section);
    }

    detailDiv.innerHTML += '<div class="location">' + connection.to + '</div>'
}

function do_query(time, departure) {
    var table = document.getElementById("results");
    var refresh = true;
    if (time == 0) {
        table.innerHTML = "";
        var selectedTime = getMidnightTime(realDate) + (parseInt(hourInput.value) - 1) * 3600000 + parseInt(minuteInput.value) * 60000;
    } else {
        refresh = false;
        var selectedTime = time;
    }

    var from = document.getElementById("from").value.split("/").join("$.$");
    var to = document.getElementById("to").value.split("/").join("$.$");
    var d = departure ? "1" : 0;

    if (from.length > 1 && to.length > 1) {
        var connectionDiv = document.getElementById("connections");
        if (connectionDiv.style.display == "none")
            connectionDiv.style.display = "block";

        var ajax = new XMLHttpRequest();
        ajax.open("GET", "connection/" + selectedTime + '/' + d + '/' + from + "/" + to, true);
        ajax.onload = function (data) {
            if (departure)
                table.deleteRow(-1);
            else
                table.deleteRow(0);

            if (data.target.status == 200) {
                var response_data = JSON.parse(data.target.response);

                if (departure) {
                    if (refresh)
                        addPrevButton(table, response_data.prevTime);
                    for (var i = 0; i < response_data.connections.length; i++) {
                        processConnection(table, response_data.connections, selectedTime, departure, i);
                    }
                    addNextButton(table, response_data.nextTime);
                } else {
                    for (var i = response_data.connections.length - 1; i >= 0; i--) {
                        processConnection(table, response_data.connections, selectedTime, departure, i);
                    }
                    addPrevButton(table, response_data.prevTime);
                }
            } else {
                alert("Keine Verbindungen gefunden");
            }
        };
        ajax.send();
    }
}
