# airtable-netlify-short-urls

This is a simple short-url service that works with
[netlify functions](https://www.netlify.com/docs/functions/) and uses
[airtable](https://airtable.com).

It's recommended to use this with
[CloudFlare caching](https://support.cloudflare.com/hc/en-us/articles/200168326-Are-301-and-302-redirects-cached-by-Cloudflare-)
because airtable has a limit of 5 requests per second. Also, CloudFlare can give
you nice analytics for free.

## Usage

First, setup an airtable account with a base and table. The table should have
a column for the short code and one for the long link.

Next deploy this github repo to netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kentcdodds/airtable-netlify-short-urls)

Then set the following environment variables in netlify:

```
DEFAULT_REDIRECT_URL -> https://example.com
AIRTABLE_KEY -> *****************
AIRTABLE_BASE -> *****************
AIRTABLE_TABLE -> URLs
AIRTABLE_SHORT_CODE_FIELD -> Short Code
AIRTABLE_LONG_LINK_FIELD -> Long Link
ENABLE_CACHE -> false
```

> Note: `AIRTABLE_TABLE`, `AIRTABLE_SHORT_CODE_FIELD`,
> `AIRTABLE_LONG_LINK_FIELD`, and `ENABLE_CACHE` are showing the default values
> above. If that's what you call your table and fields then you don't need to
> set those variables.

> Note also that you can use a `.env` file instead, just don't commit this to
> source control :) (this is useful for local development as `.env` is in the
> `.gitignore`).

Redirects should be setup automatically for you in the `netlify.toml`, so you
shouldn't have to do anything there.

Now go ahead and test that your redirects are working as expected. Just go to
the short URL version of your netlify app and it should redirect you like so:
http://jsair.netlify.com/first -> https://javascriptair.com/episodes/2015-12-09/

If that works you're on the right track!

Next, [set up Netlify with a custom domain](https://www.netlify.com/docs/custom-domains/)
then verify that the redirect works with the custom domain.

Now, go get CloudFlare setup with your custom domain to prevent your function
from being called more than airtable's rate limiting can handle.

If you're not using CloudFlare, then set `ENABLE_CACHE` to `true` so you can get
some caching from Netlify. That always seemed to not work very well for me
though (which is one reason I use CloudFlare instead) so good luck.
