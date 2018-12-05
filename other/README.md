# shorten

This is intended to be used locally. I use it with a bash function I have
defined in my dotfiles:

```bash
shorten ()
{
    ~/code/airtable-netlify-short-urls/other/shorten.js "$1" "$2"
}
```

NOTE: You'll need a `URL_BASE` environment variable in your `.env` for this to
work properly.
