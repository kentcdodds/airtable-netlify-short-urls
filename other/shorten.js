const path = require('path')
const {URL} = require('url')
const Airtable = require('airtable')
const {copy} = require('copy-paste')

require('dotenv').config({path: path.join(__dirname, '../.env')})

const apiKey = getEnv('AIRTABLE_KEY')
const base = getEnv('AIRTABLE_BASE')
const table = getEnv('AIRTABLE_TABLE', 'URLs')
const urlBase = getEnv('URL_BASE')
const shortCodeField = getEnv('AIRTABLE_SHORT_CODE_FIELD', 'Short Code')
const longLinkField = getEnv('AIRTABLE_LONG_LINK_FIELD', 'Long Link')
const airtable = new Airtable({apiKey})

let [, , longLink, code] = process.argv
code = code || generateCode()

main()

async function main() {
  if (!longLink) {
    console.log('Must provide the full link as an argument')
    return
  }
  try {
    // validate URL
    new URL(longLink)
  } catch (error) {
    console.log(`${longLink} is not a valid URL`)
    return
  }
  console.log(`Attempting to set redirect "${code}" -> ${longLink}`)
  const existingRecords = await getExistingRecord()
  if (existingRecords && existingRecords[0]) {
    const existingLink = existingRecords[0].get(longLinkField)
    console.log(
      `A link with this code already exists. It points to ${existingLink}`,
    )
    return
  }
  const createdRecord = await shorten()
  await copyLink(`${urlBase}${createdRecord.fields[shortCodeField]}`)
}

function getExistingRecord() {
  return airtable
    .base(base)(table)
    .select({
      maxRecords: 1,
      fields: [longLinkField],
      filterByFormula: `{${shortCodeField}} = "${code}"`,
    })
    .firstPage()
}

function shorten() {
  return airtable
    .base(base)(table)
    .create({
      [shortCodeField]: code,
      [longLinkField]: longLink,
    })
}

function copyLink(link) {
  return new Promise(resolve => {
    copy(link, () => {
      console.log(`${link} has been copied to your clipboard`)
      resolve(link)
    })
  })
}

function generateCode() {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < 5; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

function getEnv(name, defaultValue) {
  return process.env[name] || defaultValue
}
