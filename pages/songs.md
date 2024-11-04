---
permalink: /music/songs.html
---
{% for song in site.data.songs %}
- [{{ song.name }} - {{ song.artist }}]({{ site.url }}/music/song?filename={{ songname | url_encode }})
{% endfor %}
