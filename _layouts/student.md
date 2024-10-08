---
layout: default
---
## {{ page.name }}

Data Look Up:
{{ site.data.students[page.slug] | json }}

### Songs

{% for song in page.songs %}
{{ song }}
{% endfor %}

### Chords

{% for ch in page.chords %}
{{ ch }}
{% endfor %}