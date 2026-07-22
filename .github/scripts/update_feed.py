import json
import urllib.request
import xml.etree.ElementTree as ET


# ==============================
# NightCast YouTube Channel ID
# ==============================

CHANNEL_ID = "UCNv-iKOizOhOIWCdujWQGYA"


RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"


items = []


try:

    response = urllib.request.urlopen(RSS_URL)

    xml_data = response.read()


    root = ET.fromstring(xml_data)


    namespace = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015"
    }


    for entry in root.findall("atom:entry", namespace)[:5]:

        title = entry.find(
            "atom:title",
            namespace
        ).text


        link = entry.find(
            "atom:link",
            namespace
        ).attrib["href"]


        video_id = entry.find(
            "yt:videoId",
            namespace
        ).text


        published = entry.find(
            "atom:published",
            namespace
        ).text


        items.append({

            "platform": "YouTube",

            "title": title,

            "description": "آخرین ویدئوی منتشر شده NightCast",

            "image": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",

            "url": link,

            "published": published

        })


except Exception as error:

    print("YouTube Feed Error:", error)



# فقط اگر اطلاعات دریافت شد فایل را بروزرسانی کن
if items:

    with open(
        "data/social-feed.json",
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            items,
            file,
            ensure_ascii=False,
            indent=2
        )

    print("NightCast feed updated successfully")

else:

    print("No new data received. Keeping previous social-feed.json")
