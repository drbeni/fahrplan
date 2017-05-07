import ujson as json

import requests
from django.http import HttpResponse, Http404
from django.shortcuts import render

from fahrplan import settings


def index(request):
    return render(request, 'timetable/index.html', {})


def query(request, term):
    ret = []
    if len(term) > 1:
        r = requests.get(
            "https://transport.opendata.ch/v1/locations?query=" + term)
        data = r.json()
        if 'stations' in data:
            for match in data['stations'][:6]:
                ret.append(match['name'])
    return HttpResponse(json.dumps(ret), content_type="application/json")


def connection(request, departure, selected_time, start, to):
    # departure = "true" if departure == "1" else "false"
    start = start.replace("$.$", "/")
    to = to.replace("$.$", "/")

    if start and to:
        params = {
            "from": start,
            "to": to,
            "time": selected_time,
            "isArrivalTime": departure,
        }
        r = requests.get("https://transport.opendata.ch/v1/connections", params=params)
        data = r.json()
        connections = []
        try:
            for con in data["connections"]:
                sections = []
                name = ""
                for section in con["sections"]:
                    if not name and section["journey"]:
                        name = "{} nach {}".format(section["journey"]["name"], section["arrival"]["location"]["name"])

                    sections.append(
                        {
                            "from": section["departure"]["location"]["name"],
                            "from_platform": section["departure"]["platform"],
                            "from_time": section["departure"]["departureTimestamp"],
                            "to": section["arrival"]["location"]["name"],
                            "to_platform": section["arrival"]["platform"],
                            "to_time": section["arrival"]["arrivalTimestamp"],
                            "route": "{} nach {}".format(section["journey"]["name"],
                                                         section["arrival"]["location"]["name"]) if section[
                                "journey"] else "Fussweg",

                        }
                    )

                connections.append(
                    {
                        # "duration": con["duration"],
                        "transfers": con["transfers"],
                        "arrivalTimestamp": con["to"]["arrivalTimestamp"],
                        "departureTimestamp": con["from"]["departureTimestamp"],
                        "sections": sections,
                        "name": name,
                        "platform": con["from"]["platform"],
                        "from": con["from"]["station"]["name"],
                        "to": con["to"]["station"]["name"],
                    }
                )

            prev_time = 0 if not connections else connections[0]["arrivalTimestamp"]
            # for value in data["prevRequest"].split("&"):
            #     if value.startswith("time="):
            #         prev_time = int(value.split("=")[1])
            #         break

            next_time = 0
            # for value in data["nextRequest"].split("&"):
            #     if value.startswith("time="):
            #         next_time = int(value.split("=")[1])
            #         break

            return HttpResponse(json.dumps({"connections": connections, "nextTime": next_time, "prevTime": prev_time}),
                                content_type="application/json")

        except ImportWarning:
            pass
        # except KeyError:
        #     raise Http404("No connections found")
        # except AttributeError:
        #     raise Http404("No connections found")
    raise Http404("No connections found")
