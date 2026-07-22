# =====================================
# NightCast v1.0
# Aparat RSS + Thumbnail Updater
# =====================================

import json
import os
import re
import requests
import xml.etree.ElementTree as ET


RSS_URL = "https://www.aparat.com/rss/NightCast"

OUTPUT_FILE = "data/aparat.json"



def get_page(url):

    response = requests.get(
        url,
        timeout=20,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    response.raise_for_status()

    return response.text



def get_thumbnail(video_url):

    try:

        html = get_page(video_url)


        patterns = [

            r'<meta property="og:image" content="(.*?)"',

            r'"poster":"(.*?)"',

            r'"thumbnail":"(.*?)"'

        ]


        for pattern in patterns:


            result = re.search(
                pattern,
                html
            )


            if result:

                return result.group(1)


    except Exception:

        pass



    return ""





def get_rss():


    response = requests.get(

        RSS_URL,

        timeout=20,

        headers={
            "User-Agent":"Mozilla/5.0"
        }

    )


    response.raise_for_status()


    return response.text






def parse():

    xml = get_rss()


    root = ET.fromstring(xml)


    item = root.find("./channel/item")


    if item is None:

        return None



    title = item.findtext("title","")

    link = item.findtext("link","")

    description = item.findtext(
        "description",
        ""
    )


    date = item.findtext(
        "pubDate",
        ""
    )


    thumbnail = get_thumbnail(link)



    return {


        "platform":"aparat",

        "title":title,

        "url":link,

        "thumbnail":thumbnail,

        "date":date,

        "description":description

    }





def save(data):


    os.makedirs(
        "data",
        exist_ok=True
    )


    with open(

        OUTPUT_FILE,

        "w",

        encoding="utf-8"

    ) as f:


        json.dump(

            data,

            f,

            ensure_ascii=False,

            indent=4

        )






if __name__=="__main__":


    result = parse()


    if result:

        save(result)

        print(
            "NightCast Aparat updated"
        )

    else:

        print(
            "No data found"
        )
