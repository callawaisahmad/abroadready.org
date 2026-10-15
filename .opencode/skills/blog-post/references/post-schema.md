# `data/blog.json` post schema

Top level:

```json
{
  "generatedNote": "Blog content for AbroadReady",
  "categories": ["Scholarship Guides", "Country Guides", "..."],
  "posts": []
}
```

Each entry in `posts`:

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | string | Matches `pages/<slug>.html` and `assets/blog/<slug>-*`. |
| `title` | string | Page `<title>` / card title. |
| `category` | string | Must be one of `categories`. |
| `format` | string | `"short"` selects the short SEO gate. Omit for long form. |
| `focusKeyword` | string | Must appear verbatim in one H2. |
| `metaDescription` | string | Meta description. |
| `excerpt` | string | Card / listing summary. |
| `tags` | string[] | Card tags. |
| `readMins` | number | Short posts are typically ~5. |
| `date` | string | Display form, e.g. `"Sep 30, 2026"`. |
| `faq` | `{q, a}[]` | 0–3 for short, ≥ 3 for long. |
| `bodyHtml` | string | Escaped HTML body (`\n` between blocks). |

## Short-form skeleton

```json
{
  "slug": "example-slug",
  "title": "Example Title 2027",
  "category": "Country Guides",
  "format": "short",
  "focusKeyword": "example focus keyword",
  "metaDescription": "...",
  "excerpt": "...",
  "tags": ["Tag One", "Tag Two"],
  "readMins": 5,
  "date": "Oct 15, 2026",
  "faq": [{ "q": "...", "a": "..." }],
  "bodyHtml": "<p>Direct answer with example focus keyword in the first sentence.</p>\n<figure class=\"article-inline-img\"><img src=\"../assets/blog/example-slug-inline.jpg\" alt=\"example focus keyword\" loading=\"lazy\" width=\"1200\" height=\"800\"><figcaption>Caption. (Photo: Pexels)</figcaption></figure>\n<h2>Example Focus Keyword: The Quick Answer</h2>\n<p>...</p>"
}
```

## Notes

- `bodyHtml` is a single escaped string — `\"` for quotes, `\n` for line breaks.
- Place a `<figure class="article-inline-img">` after the opening answer blocks.
- Keep external links `rel="noopener nofollow"` and dated so readers can judge currency.
