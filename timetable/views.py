import requests
import ujson as json
from django.shortcuts import render
from django.http import HttpResponse
from fahrplan import settings


def index(request):
    return render(request, 'timetable/index.html', {})


def query(request, term):
    ret = []
    if len(term) > 1:
        r = requests.get(
            "https://free.viapi.ch/v1/stations?apiKeyWeb=V001B9054D6D-FA3A-4FDC-A054-CCE51E07D6DA&query=" + term)
        for match in r.json():
            ret.append(match['name'])
    return HttpResponse(json.dumps(ret), content_type="application/json")


def connection(request, selected_time, start, to):
    ret = []
    departure = "true"

    if start and to:
        r = requests.get(
            "https://free.viapi.ch/v1/connection?apiKeyWeb={}&from={}&to={}&time={}&departure={}".format(
                settings.API_KEY, start, to, selected_time, departure))
        ret = []
        for con in r.json()["connections"]:
            sections = []
            platform = ""
            name = ""
            for section in con["sections"]:
                if not platform and section["from"]["platform"]:
                    platform = section["from"]["platform"]
                if not name and section["route"]:
                    name = "{} {} nach {}".format(section["route"]["name"], section["route"]["infoName"],
                                                  section["route"]["destination"])

                sections.append(
                    {
                        "from": section["from"]["location"]["name"],
                        "from_platform": section["from"]["platform"],
                        "from_time": section["from"]["time"],
                        "to": section["to"]["location"]["name"],
                        "to_platform": section["to"]["platform"],
                        "to_time": section["to"]["time"],
                        "route": "{} {} nach {}".format(section["route"]["name"], section["route"]["infoName"],
                                                        section["route"]["destination"]) if section[
                            "route"] else "Fussweg",

                    }
                )

            ret.append(
                {
                    "duration": con["duration"],
                    "transfers": con["transfers"],
                    "realArrivalTime": con["realArrivalTime"],
                    "realDepartureTime": con["realDepartureTime"],
                    "sections": sections,
                    "name": name,
                    "platform": platform,
                    "from": con["from"]["location"]["name"],
                    "to": con["to"]["location"]["name"],
                }
            )

    return HttpResponse(json.dumps(ret), content_type="application/json")
