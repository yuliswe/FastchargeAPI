/* eslint-disable */

const fs = require('fs');

/**
 * Writes test results as json file to
 * ${RUNNER_TEMP}/jest-json-reporter/shard-${SHARD}.json
 */
class JsonReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    if (!process.env.CI) {
      return;
    }
    const outDir = `${process.env.RUNNER_TEMP}/jest-json-reporter`;
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }
    const outFile = `${outDir}/shard-${process.env.SHARD}.json`;
    console.log('json-reporter: Writing to file: ', outFile);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  }
}

module.exports = JsonReporter;
