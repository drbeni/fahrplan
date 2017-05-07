import ujson as json
import pytz
from datetime import datetime

import requests
from django.http import HttpResponse, Http404
from django.shortcuts import render


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
    start = start.replace("$.$", "/")
    to = to.replace("$.$", "/")

    if start and to:
        tz = pytz.timezone('Europe/Zurich')
        dt = datetime.fromtimestamp(int(selected_time), tz=tz)

        params = {
            "from": start,
            "to": to,
            "time": str(dt.time())[:5],
            "date": str(dt.date()),
            "isArrivalTime": departure,
        }
        r = requests.get("https://transport.opendata.ch/v1/connections", params=params)

        data = r.json()
        connections = []
        # print(r.text)
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
                            "capacity1st": section["journey"]["capacity1st"] if section["journey"] else None,
                            "capacity2nd": section["journey"]["capacity2nd"] if section["journey"] else None,
                        }
                    )

                connections.append(
                    {
                        "transfers": con["transfers"],
                        "arrivalTimestamp": con["to"]["arrivalTimestamp"],
                        "departureTimestamp": con["from"]["departureTimestamp"],
                        "sections": sections,
                        "name": name,
                        "platform": con["from"]["platform"],
                        "from": con["from"]["station"]["name"],
                        "to": con["to"]["station"]["name"],
                        "capacity1st": con["capacity1st"],
                        "capacity2nd": con["capacity2nd"],
                    }
                )

            prev_time = 0 if not connections else connections[0]["arrivalTimestamp"] - 60
            next_time = selected_time if not connections else connections[-1]["departureTimestamp"] + 60

            return HttpResponse(json.dumps({"connections": connections, "nextTime": next_time, "prevTime": prev_time}),
                                content_type="application/json")

        except KeyError:
            raise
            raise Http404("No connections found")
        except AttributeError:
            raise
            raise Http404("No connections found")
    raise Http404("No connections found")
