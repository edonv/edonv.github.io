---
layout: default
---
## {{ page.name }}

Data Look Up:
{{ site.data.[page.slug] | json }}

### Songs

{% for song in page.songs %}
{{ song }}
{% endfor %}

### Chords

{% for ch in page.chords %}
{{ ch }}
{% endfor %}