/* eslint-disable */

const fs = require("fs");

class JsonReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    const failedTests = results.testResults.filter((testResult) => testResult.numFailingTests > 0);
    if (failedTests.length > 0) {
      console.log("\nFailed tests:");
      console.log(failedTests.map((testResult) => testResult.testFilePath.replace(process.cwd() + "/", "")).join("\n"));
    }
  }
}

module.exports = JsonReporter;
