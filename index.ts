import axios from 'axios';
import * as camaro from 'camaro';
import { Base64 } from 'js-base64';
import * as github from 'octonode';
import env from 'dotenv';
import fs from 'fs';

// XML content parsing template for camaro
// https://github.com/tuananh/camaro
const TEMPLATE = {
  adhkar: ['//adhkar', {
      id: 'number(group/@id)',
      titles: {
        arabic: 'group/title/arabic',
        english: 'group/title/english'
      },
      duas: ['//group/dua', {
          id: 'number(@id)',
          content: 'content',
          narrator: 'content/para/narrator',
          reference: {
            arabic: 'reference/arabic',
            english: 'reference/english'
          }
      }]
  }],
};

// ========================================================
// =====================================================| |
// This script is to retrieve the xml content locally   | |
// =====================================================| |
// =======================================================

// read the file locally
const XMLFILE = fs.readFileSync('contents/content.xml', 'utf-8');
// parse the file
const XMLTOJSON = camaro.default(XMLFILE, TEMPLATE);

console.log(XMLTOJSON);
// ========================================================
// =====================================================| |
// This script is to retrieve the xml content remotely  | |
// every time the master branch has updated on github   | |
// =====================================================| |
// =======================================================

// https://github.com/pksunkara/octonode#usage
env.config();
const CLIENT = github.client(process.env.GH_TOKEN);

// check your rate limit status by calling the following.
// CLIENT.limit((err, left, max, reset) => {
//   console.log(left); // 4999
//   console.log(max);  // 5000
//   console.log(reset);  // 1372700873 (UTC epoch seconds)
//   if (err) {
//     console.log(err);
//   }
// });

// instantiate the github repo
const GH_REPO = CLIENT.repo('khalid-hussain/Sahih-alAdhkar-XML');
// the xml file url from the repo
const URL = 'https://api.github.com/repos/khalid-hussain/Sahih-alAdhkar-XML/contents/content.xml';

// last update done by the app (UTC epoch seconds)
// you need to save when did you last updated your file
const APP_LAST_UPDATE = 0;

// this function checks the master branch last commit to judge if it needs to pull the fresh content
GH_REPO.branchAsync('master').then((branch) => {
  const MASTER_LAST_UPDATE: number = Date.parse(branch[0].commit.commit.committer.date);
  if (MASTER_LAST_UPDATE > APP_LAST_UPDATE) {
    // fetching the content
    axios.get(URL).then(async (res) => {
      const FETCHEDXML = Base64.decode(res.data.content);
      const XMLTOJSON = camaro.default(FETCHEDXML, TEMPLATE);
      console.log(XMLTOJSON);
    }).catch((e) => {
      throw new Error(e.message);
    });
  }
}).catch((e) => {
  throw new Error(e.message);
});
