---
layout: default
title: Songbook
permalink: /music/songs.html
body-classes: bordered
---
{%- assign songs = site.data.songs | sort: "name" %}
{% for song in songs %}
- [{{ song.name }} - {{ song.artist }}]({{ site.url }}/music/song?filename={{ song.fileName | url_encode }})
{% endfor %}
