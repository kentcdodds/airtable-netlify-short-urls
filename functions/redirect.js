require('dotenv').config()
const fs = require('fs')

const defaultRedirectURL = getEnv('DEFAULT_REDIRECT_URL')

exports.handler = async event => {
  // just something for grouping the netlify logs for this run together
  const runId = Date.now()
    .toString()
    .slice(-5)
  const log = (...args) => console.log(runId, ...args)

  const {host = ''} = event.headers
  const {code} = event.queryStringParameters
  if (!code) {
    log(`no code query param provided`)
    return getResponse()
  }
  const codeLength = code.length
  if (codeLength > 50) {
    log(`short code "${code}" is ${codeLength} characters long. Sounds fishy.`)
    return getResponse()
  }
  try {
    const apiKey = getEnv('AIRTABLE_KEY')
    const base = getEnv('AIRTABLE_BASE')
    const table = getEnv('AIRTABLE_TABLE', 'URLs')
    const shortCodeField = getEnv('AIRTABLE_SHORT_CODE_FIELD', 'Short Code')
    const longLinkField = getEnv('AIRTABLE_LONG_LINK_FIELD', 'Long Link')
    const Airtable = require('airtable')
    log(`Attempting to get long link for code "${code}"`)
    const result = await new Airtable({apiKey})
      .base(base)(table)
      .select({
        maxRecords: 1,
        fields: [longLinkField],
        filterByFormula: `{${shortCodeField}} = "${code}"`,
      })
      .firstPage()
    const longLink = result[0].get(longLinkField)
    if (longLink) {
      return getResponse({longLink, statusCode: 301})
    } else {
      log(`There was no Long Link associated with "${code}".`)
      return getResponse()
    }
  } catch (error) {
    if (error.stack) {
      log(error.stack)
    } else {
      log(error)
    }
    log('!! there was an error and we are ignoring it... !!')
  }

  return getResponse()

  function getResponse({longLink = defaultRedirectURL, statusCode = 302} = {}) {
    const title = `${host}/${code || ''}`
    log(`> redirecting: ${title} -> ${longLink}`)
    const body = `<html><head><title>${title}</title></head><body><a href="${longLink}">moved here</a></body></html>`

    return {
      statusCode,
      body,
      headers: {
        Location: longLink,
        // this needs to be enabled... but I'm really struggling on how to make
        // it work properly...
        // 'Cache-Control': 'public, max-age=10080', // 10080 seconds is 1 week
        'Cache-Control': 'no-cache',
        // these headers I got by curling a bit.ly URL
        // and just doing what they do.
        'Content-Length': String(body.length),
        'Content-Type': 'text/html; charset=utf-8',
        Connection: 'close',
        'Content-Security-Policy': 'referrer always',
        'Referrer-Policy': 'unsafe-url',
      },
    }
  }
}

function getEnv(name, defaultValue) {
  return process.env[name] || defaultValue
}
