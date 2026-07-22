# =====================================
# NightCast v1.0
# Aparat RSS Updater
# =====================================

import json
import os
import requests
import xml.etree.ElementTree as ET


RSS_URL = "https://www.aparat.com/rss/NightCast"

OUTPUT_FILE = "data/aparat.json"



def get_aparat_feed():

    response = requests.get(
        RSS_URL,
        timeout=20,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    response.raise_for_status()

    return response.text



def parse_feed(xml_data):

    root = ET.fromstring(xml_data)

    channel = root.find("channel")

    item = channel.find("item")


    if item is None:

        return None



    title = item.findtext("title", "")

    link = item.findtext("link", "")

    description = item.findtext("description", "")

    pub_date = item.findtext("pubDate", "")



    data = {

        "platform": "aparat",

        "title": title.strip(),

        "url": link.strip(),

        "date": pub_date.strip(),

        "description": description.strip()

    }


    return data




def save_json(data):

    os.makedirs(
        os.path.dirname(OUTPUT_FILE),
        exist_ok=True
    )


    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:


        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=4
        )





def main():


    print("Reading Aparat RSS...")


    xml_data = get_aparat_feed()


    video = parse_feed(xml_data)



    if video:


        save_json(video)

        print(
            "Aparat feed updated successfully."
        )


    else:

        print(
            "No video found."
        )




if __name__ == "__main__":

    main()
