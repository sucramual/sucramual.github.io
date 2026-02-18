---
layout: layouts/base.njk
title: About me
description: my background and what i'm doing
---

# About Me

I'm originally from Hong Kong and currently reside in Atlanta. I'm pursuing a Master in Analytics at Georgia Tech with a concentration in computational data analysis. 

Previously, I worked on strategy and analytics at a Hong Kong–based e-commerce marketplace and spent time in investment banking at Deutsche Bank and Credit Suisse (...now UBS).

I graduated from the University of Hong Kong with honours in political science and philosophy. Drawing from my interdisciplinary background, I'm especially interested in how geopolitics, business and technology can shape a more equitable and free world. Beyond these intersections, I also think a lot about financial markets, food and canto pop.

The best way to get in touch would be to email at ylau36[at]gatech.edu. I am also on [Linkedin](https://www.linkedin.com/in/marcuslauyc/), [Github](https://github.com/sucramual) and [X](https://x.com/ylau36).

## Writing

<ul class="space-y-12 mb-16">
{% for post in collections.posts | reverse %}
  <li class="group">
    <div class="flex items-baseline justify-between mb-2">
      <h3 class="text-xl font-serif font-medium m-0">
        <a href="{{ post.url }}" class="text-text hover:text-link-hover transition-colors duration-200 no-underline">
          {{ post.data.title }}
        </a>
      </h3>
      <time class="text-sm text-gray-500 font-sans whitespace-nowrap ml-4">{{ post.date | date("MMM YYYY") }}</time>
    </div>
    {% if post.data.description %}
      <p class="text-gray-600 leading-relaxed m-0 text-base">{{ post.data.description }}</p>
    {% endif %}
  </li>
{% endfor %}
</ul>