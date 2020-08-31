const pg = require('./db/pg-query');
const User = require('./user');
const MPromise = require('./utils/metered').MPromise;
const LruCache = require("lru-cache");
const Translator = require('./translator');

const detectLanguage = Translator.detectLanguage;
const translateString = Translator.translateString;
const useTranslateApi = Translator.useTranslateApi;

function createXidRecord(ownerUid, uid, xid, x_profile_image_url, x_name, x_email) {
  return pg.queryP("insert into xids (owner, uid, xid, x_profile_image_url, x_name, x_email) values ($1, $2, $3, $4, $5, $6) " +
    "on conflict (owner, xid) do nothing;", [
      ownerUid,
      uid,
      xid,
      x_profile_image_url || null,
      x_name || null,
      x_email || null,
    ]);
}

function createXidRecordByZid(zid, uid, xid, x_profile_image_url, x_name, x_email) {
  return getConversationInfo(zid).then((conv) => {
    const shouldCreateXidRecord = conv.use_xid_whitelist ? isXidWhitelisted(conv.owner, xid) : Promise.resolve(true);
    return shouldCreateXidRecord.then((should) => {
      if (!should) {
        throw new Error("polis_err_xid_not_whitelisted_2");
      }
      return pg.queryP("insert into xids (owner, uid, xid, x_profile_image_url, x_name, x_email) values ((select org_id from conversations where zid = ($1)), $2, $3, $4, $5, $6) " +
        "on conflict (owner, xid) do nothing;", [
          zid,
          uid,
          xid,
          x_profile_image_url || null,
          x_name || null,
          x_email || null,
        ]);
    });
  });
}

function getXidRecord(xid, zid) {
  return pg.queryP("select * from xids where xid = ($1) and owner = (select org_id from conversations where zid = ($2));", [xid, zid]);
}

function getXidRecordByXidOwnerId(xid, owner, zid_optional, x_profile_image_url, x_name, x_email, createIfMissing) {
  return pg.queryP("select * from xids where xid = ($1) and owner = ($2);", [xid, owner]).then(function(rows) {
    if (!rows || !rows.length) {
      console.log('no xInfo yet');
      if (!createIfMissing) {
        return null;
      }

      var shouldCreateXidEntryPromise = !zid_optional ? Promise.resolve(true) : getConversationInfo(zid_optional).then((conv) => {
        return conv.use_xid_whitelist ? isXidWhitelisted(owner, xid) : Promise.resolve(true);
      });

      return shouldCreateXidEntryPromise.then((should) => {
        if (!should) {
          return null;
        }
        return User.createDummyUser().then((newUid) => {
          console.log('created dummy');
          return createXidRecord(owner, newUid, xid, x_profile_image_url||null, x_name||null, x_email||null).then(() => {
            console.log('created xInfo');
            return [{
              uid: newUid,
              owner: owner,
              xid: xid,
              x_profile_image_url: x_profile_image_url,
              x_name: x_name,
              x_email: x_email,
            }];
          });
        });
      });
    }
    return rows;
  });
}

function getXidStuff(xid, zid) {
  return getXidRecord(xid, zid).then((rows) => {
    if (!rows || !rows.length) {
      return "noXidRecord";
    }
    let xidRecordForPtpt = rows[0];
    if (xidRecordForPtpt) {
      return User.getPidPromise(zid, xidRecordForPtpt.uid, true).then((pidForXid) => {
        xidRecordForPtpt.pid = pidForXid;
        return xidRecordForPtpt;
      });
    }
    return xidRecordForPtpt;
  });
}

function isXidWhitelisted(owner, xid) {
  return pg.queryP("select * from xid_whitelist where owner = ($1) and xid = ($2);", [owner, xid]).then((rows) => {
    return !!rows && rows.length > 0;
  });
}

function getConversationInfo(zid) {
  return new MPromise("getConversationInfo", function(resolve, reject) {
    pg.query("SELECT * FROM conversations WHERE zid = ($1);", [zid], function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.rows[0]);
      }
    });
  });
}

function getConversationInfoByConversationId(conversation_id) {
  return new MPromise("getConversationInfoByConversationId", function(resolve, reject) {
    pg.query("SELECT * FROM conversations WHERE zid = (select zid from zinvites where zinvite = ($1));", [conversation_id], function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result.rows[0]);
      }
    });
  });
}

const conversationIdToZidCache = new LruCache({
  max: 1000,
});

// NOTE: currently conversation_id is stored as zinvite
function getZidFromConversationId(conversation_id) {
  return new MPromise("getZidFromConversationId", function(resolve, reject) {
    let cachedZid = conversationIdToZidCache.get(conversation_id);
    if (cachedZid) {
      resolve(cachedZid);
      return;
    }
    pg.query_readOnly("select zid from zinvites where zinvite = ($1);", [conversation_id], function(err, results) {
      if (err) {
        return reject(err);
      } else if (!results || !results.rows || !results.rows.length) {
        console.error("polis_err_fetching_zid_for_conversation_id " + conversation_id);
        return reject("polis_err_fetching_zid_for_conversation_id");
      } else {
        let zid = results.rows[0].zid;
        conversationIdToZidCache.set(conversation_id, zid);
        return resolve(zid);
      }
    });
  });
}

function deleteConversationTranslations(zid) {
  return new Promise(function(resolve, reject) {
    pg.query("DELETE FROM conversation_translations WHERE zid = ($1);", [zid], function(err, results) {
      if (err) {
        // resolve, but complain
        yell("polis_err_removing_conversation_translations");
      }
      resolve();
    });
  });
}

function getConversationTranslations(zid, lang) {
  const firstTwoCharsOfLang = lang.substr(0,2);
  return new Promise(function(resolve, reject) {
    pg.queryP_readOnly("select * from conversation_translations where zid = ($1) and lang = ($2);", [zid, firstTwoCharsOfLang]).then(rows => {
      if (rows.length === 0 && useTranslateApi) {
        pg.queryP_readOnly("select topic, description from conversations where zid = ($1)", [zid]).then(conv => {
          if (conv.length > 0) {
            translateAndStoreConversationInfo(zid, conv[0].topic, conv[0].description, firstTwoCharsOfLang).then(row => {
              resolve([row]);
            });
          }
          else {
            resolve([]);
          }
          //conv.length > 0 ?  : resolve();
        });
      }
      else {
        resolve(rows);
      }
    });
  });
}

function translateAndStoreConversationInfo(zid, topic, description, lang) {
  if (useTranslateApi) {
    return translateString([topic, description], lang).then((results) => {
      const topicTranslation = results[0][0];
      const descriptionTranslation = results[0][1];
      const src = -1; // Google Translate of txt with no added context
      return pg.queryP("insert into conversation_translations (zid, topic, description, lang, src) values ($1, $2, $3, $4, $5) returning *;", [zid, topicTranslation, descriptionTranslation, lang, src]).then((rows) => {
        return rows[0];
      });
    });
  }
  return Promise.resolve(null);
}

function getConversationTranslationsMinimal(zid, lang) {
  if (!lang) {
    return Promise.resolve([]);
  }
  return getConversationTranslations(zid, lang).then(function(rows) {
    for (let i = 0; i < rows.length; i++) {
      delete rows[i].zid;
      delete rows[i].created;
      delete rows[i].modified;
      delete rows[i].src;
    }
    return rows;
  });
}

module.exports = {
  createXidRecordByZid,
  getXidRecord,
  getXidRecordByXidOwnerId,
  getXidStuff,
  isXidWhitelisted,
  getConversationInfo,
  getConversationInfoByConversationId,
  getZidFromConversationId,
  getConversationTranslationsMinimal,
  deleteConversationTranslations,
};
