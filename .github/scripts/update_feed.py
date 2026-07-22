import json
import urllib.request
import xml.etree.ElementTree as ET


CHANNEL_ID = "UCxxxxxxxx"


RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"


response = urllib.request.urlopen(RSS_URL)

xml_data = response.read()


root = ET.fromstring(xml_data)


namespace = {
    "atom": "http://www.w3.org/2005/Atom"
}


items = []


for entry in root.findall("atom:entry", namespace)[:5]:

    title = entry.find(
        "atom:title",
        namespace
    ).text


    link = entry.find(
        "atom:link",
        namespace
    ).attrib["href"]


    items.append({

        "platform":"YouTube",

        "title":title,

        "description":"آخرین ویدئوی NightCast",

        "image":"../images/default.jpg",

        "url":link

    })


with open(
    "data/social-feed.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        items,
        f,
        ensure_ascii=False,
        indent=2
    )


print("YouTube feed updated")
