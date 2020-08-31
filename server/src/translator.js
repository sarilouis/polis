const fs = require('fs');
const Translate = require('@google-cloud/translate');
const isTrue = require('boolean');

const useTranslateApi = isTrue(process.env.SHOULD_USE_TRANSLATION_API);
let translateClient = null;
if (useTranslateApi) {
  // Tell translation library where to find credentials, and write them to disk.
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '.google_creds_temp'
  // TODO: Consider deprecating GOOGLE_CREDS_STRINGIFIED in future.
  const creds_string = process.env.GOOGLE_CREDENTIALS_BASE64 ?
    new Buffer(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('ascii') :
    process.env.GOOGLE_CREDS_STRINGIFIED;
  fs.writeFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, creds_string);
  translateClient = Translate();
}

function translateString(txt, target_lang) {
  if (useTranslateApi) {
    return translateClient.translate(txt, target_lang);
  }
  return Promise.resolve(null);
}

function detectLanguage(txt) {
  if (useTranslateApi) {
    return translateClient.detect(txt);
  }
  return Promise.resolve([{
    confidence: null,
    language: null,
  }]);
}

module.exports = {
  translateString,
  detectLanguage,
  useTranslateApi
};
