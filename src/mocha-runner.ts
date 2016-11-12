import * as Mocha from 'mocha'

import { TestConfigMessage, TestResultMessage } from './messages'

process.on('message', (testConfig: TestConfigMessage) => {
  const mocha = new Mocha(testConfig.mochaOptions);

  testConfig.files.forEach(file => mocha.addFile(file));

  mocha.run(failures => {
    const testResult: TestResultMessage = {
      failures
    };

    if (failures) {
      process.send(testResult);
    }
    else if (testConfig.coverage) {
      testResult.coverage = global[testConfig.coverageVariable];
      process.send(testResult);
    }
    else {
      process.send(testResult);
    }
  })
});