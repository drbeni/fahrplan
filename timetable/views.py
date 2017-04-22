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
            "https://free.viapi.ch/v1/stations?apiKeyWeb={}&query=".format(settings.API_KEY) + term)
        for match in r.json():
            ret.append(match['name'])
    return HttpResponse(json.dumps(ret), content_type="application/json")


def connection(request, departure, selected_time, start, to):
    departure = "true" if departure == "1" else "false"
    start = start.replace("$.$", "/")
    to = to.replace("$.$", "/")

    if start and to:
        params = {
            "apiKeyWeb": settings.API_KEY,
            "from": start,
            "to": to,
            "time": selected_time,
            "departure": departure,
        }
        r = requests.get("https://free.viapi.ch/v1/connection", params=params)
        data = r.json()
        connections = []
        try:
            for con in data["connections"]:
                sections = []
                platform = ""
                name = ""
                departure_time = 0
                for section in con["sections"]:
                    if not platform and section["from"]["platform"]:
                        platform = section["from"]["platform"]
                    if not name and section["route"]:
                        name = "{} nach {}".format(section["route"]["name"], section["route"]["destination"])
                        departure_time = section["from"]["time"]

                    sections.append(
                        {
                            "from": section["from"]["location"]["name"],
                            "from_platform": section["from"]["platform"],
                            "from_time": section["from"]["time"],
                            "to": section["to"]["location"]["name"],
                            "to_platform": section["to"]["platform"],
                            "to_time": section["to"]["time"],
                            "route": "{} nach {}".format(section["route"]["name"],
                                                         section["route"]["destination"]) if section[
                                "route"] else "Fussweg",

                        }
                    )

                connections.append(
                    {
                        "duration": con["duration"],
                        "transfers": con["transfers"],
                        "realArrivalTime": con["realArrivalTime"],
                        "realDepartureTime": departure_time,
                        "sections": sections,
                        "name": name,
                        "platform": platform,
                        "from": con["from"]["location"]["name"],
                        "to": con["to"]["location"]["name"],
                    }
                )

            prev_time = 0
            for value in data["prevRequest"].split("&"):
                if value.startswith("time="):
                    prev_time = int(value.split("=")[1])
                    break

            next_time = 0
            for value in data["nextRequest"].split("&"):
                if value.startswith("time="):
                    next_time = int(value.split("=")[1])
                    break

            return HttpResponse(json.dumps({"connections": connections, "nextTime": next_time, "prevTime": prev_time}),
                                content_type="application/json")
        except KeyError:
            raise Http404("No connections found")
        except AttributeError:
            raise Http404("No connections found")
    raise Http404("No connections found")
