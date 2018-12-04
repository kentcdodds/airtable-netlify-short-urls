require('dotenv').config()
const fs = require('fs')

const defaultRedirectURL = getEnv('DEFAULT_REDIRECT_URL')

exports.handler = async event => {
  const {host} = event.headers
  const {short} = event.queryStringParameters
  if (!short || short.length > 20) {
    return getResponse()
  }
  try {
    const apiKey = getEnv('AIRTABLE_KEY')
    const base = getEnv('AIRTABLE_BASE')
    const table = getEnv('AIRTABLE_TABLE', 'URLs')
    const shortCodeField = getEnv('AIRTABLE_SHORT_CODE_FIELD', 'Short Code')
    const longLinkField = getEnv('AIRTABLE_LONG_LINK_FIELD', 'Long Link')
    const Airtable = require('airtable')
    const result = await new Airtable({apiKey})
      .base(base)(table)
      .select({
        maxRecords: 1,
        fields: [longLinkField],
        filterByFormula: `{${shortCodeField}} = "${short}"`,
      })
      .firstPage()
    const longLink = result[0].get(longLinkField)
    return getResponse({longLink, statusCode: 301})
  } catch (error) {
    console.log(error.stack)
    console.log('there was an error and we are ignoring it...')
  }

  return getResponse()

  function getResponse({longLink = defaultRedirectURL, statusCode = 302} = {}) {
    const title = `${host}/${short || ''}`
    const body = `<html><head><title>${title}</title></head><body><a href="${longLink}">moved here</a></body>`

    return {
      statusCode,
      body,
      headers: {
        Location: longLink,
        // these headers I got by curling a bit.ly URL
        // and just doing what they do.
        'Cache-Control': 'public, max-age=10080', // 10080 seconds is 1 week
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
