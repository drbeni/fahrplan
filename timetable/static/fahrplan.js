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

function incrementBy(elem_id, inc) {
    if (elem_id == 'hour') {
        hourInput.value = zeroPad(Math.min(Math.max(0, parseInt(hourInput.value) + inc), 23));
    } else if (elem_id == 'minute') {
        minuteInput.value = zeroPad((Math.max(((parseInt(parseInt(minuteInput.value) / 10)) + inc), 0) % 6) * 10);
    } else if (elem_id == 'date') {
        var newDate = new Date(0);
        newDate.setMilliseconds(realDate.setDate(realDate.getDate() + inc));
        dateInput.value = formatDate(newDate);
        realDate = newDate;
    }
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
    return zeroPad(date.getDate()) + '.' + zeroPad(date.getMonth() + 1) + '.' + date.getFullYear();
}

function zeroPad(n) {
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
    hourInput.value = zeroPad(now.getHours());
    minuteInput.value = zeroPad(now.getMinutes());
}

function getMidnightTime(date) {
    var millis = date.getTime();
    return millis - (millis % 86400000);
}

function addTitleRow(table, name) {
    var titleRow = table.insertRow(-1);
    var titleCell = titleRow.insertCell(0);
    titleRow.className = 'title_row';
    titleCell.colSpan = 3;
    titleCell.innerHTML = '<p class="connection_title">' + name + '</p>';
}

function addContentRow(table, connection, i) {
    var contentRow = table.insertRow(-1);

    var startCol = contentRow.insertCell(0);
    var transferCol = contentRow.insertCell(1);
    var toCol = contentRow.insertCell(2);

    startCol.innerHTML = '<p class="time">' + formatTime(connection.realDepartureTime) + '</p><p>' + formatPlatform(connection.platform) + '</p>';
    transferCol.innerHTML = '<p class="time">' + formatDuration(connection.duration) + '</p><p>Umst.: ' + connection.transfers + '</p>';
    toCol.innerHTML = '<p class="time">' + formatTime(connection.realArrivalTime) + '</p><p><button id="show_detail_button_' + i + '" class="show_details" onclick="toggleConnectionDetails(' + i + ')">+</button></p>';

    var detailRow = table.insertRow(-1);
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

function do_query() {


    var table = document.getElementById("results");
    table.innerHTML = "";

    var from = document.getElementById("from").value;
    var to = document.getElementById("to").value;
    var selectedTime = getMidnightTime(realDate) + (parseInt(hourInput.value) - 1) * 3600000 + parseInt(minuteInput.value) * 60000;

    if (from.length > 1 && to.length > 1) {
        var connectionDiv = document.getElementById("connections");
        if (connectionDiv.style.display == "none")
            connectionDiv.style.display = "block";

        var ajax = new XMLHttpRequest();
        ajax.open("GET", "connection/" + selectedTime + '/' + from + "/" + to, true);
        ajax.onload = function (data) {

            var response_data = JSON.parse(data.target.response);
            for (var i = 0; i < response_data.length; i++) {
                var connection = response_data[i];
                addTitleRow(table, connection.name);
                addContentRow(table, connection, i);

                var detailDiv = document.getElementById("con_details_" + i);
                detailDiv.innerHTML = '';

                for (var s = 0; s < connection.sections.length; s++) {
                    var section = connection.sections[s];
                    addConnectionDetail(detailDiv, section);
                }

                detailDiv.innerHTML += '<div class="location">' + connection.to + '</div>'
            }
        };
        ajax.send();
    }
}
