---
layout: layouts/base.njk
title: Writing - Marcus Lau
---

# Writing

<ul class="space-y-12">
{% for post in collections.posts | reverse %}
  <li class="group">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="text-2xl font-serif font-semibold m-0">
        <a href="{{ post.url }}" class="text-text hover:text-link-hover transition-colors duration-200 no-underline">
          {{ post.data.title }}
        </a>
      </h2>
      <time class="text-sm text-gray-500 font-sans whitespace-nowrap ml-4">{{ post.date | date("MMM YYYY") }}</time>
    </div>
    {% if post.data.description %}
      <p class="text-gray-600 leading-relaxed m-0">{{ post.data.description }}</p>
    {% endif %}
  </li>
{% endfor %}
</ul>