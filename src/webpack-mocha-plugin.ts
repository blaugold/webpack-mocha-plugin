import * as remap from 'remap-istanbul/lib/remap'
import * as istanbul from 'istanbul'
import { fork } from 'child_process'

import { TestConfigMessage, TestResultMessage } from './messages'
import { ChildProcess } from 'child_process'

export class WebpackMochaPlugin {

  private watchMode: boolean;
  private codeCoverage: boolean;
  private coverageVariable: string;
  private coverageReports: string[];
  private coverageDir: string;
  private mochaOptions: string;
  private mochaChildProcess: ChildProcess;

  constructor(config: {
    mocha?: any;
    codeCoverage?: boolean;
    coverageVariable?: string;
    coverageReports?: string[];
    coverageDir?: string;
  } = {}) {
    this.mochaOptions     = config.mocha || {};
    this.codeCoverage     = config.codeCoverage || false;
    this.coverageVariable = config.coverageVariable || '__coverage__';
    this.coverageReports  = config.coverageReports || ['html', 'json'];
    this.coverageDir      = config.coverageDir || 'coverage';
  }

  apply(compiler) {

    // // Register callback to start server when compiler is done.
    compiler.plugin('done', this.runTest.bind(this));

    // Detect whether compiler is in watch mode.
    compiler.plugin('run', (_, cb) => {
      this.watchMode = false;
      cb();
    });
    compiler.plugin('watch-run', (_, cb) => {
      this.watchMode = true;
      cb();
    });
  }

  runTest(stats) {
    // If old test is still running kill it.
    if (this.mochaChildProcess) {
      this.mochaChildProcess.kill('SIGTERM');
    }

    // Get bundle by using name of first asset which ends in .js.
    const assets      = stats.compilation.assets;
    const bundlePaths = Object.keys(assets)
      .filter(fileName => fileName.match(/\.js$/))
      .map(fileName => assets[fileName])
      .filter(bundle => !!bundle.existsAt)
      .map(bundle => bundle.existsAt);

    // Prepare test config for child process.
    const mochaMessage: TestConfigMessage = {
      coverageVariable: this.coverageVariable,
      files:            bundlePaths,
      mochaOptions:     this.mochaOptions,
      coverage:         this.codeCoverage
    };

    // Run test in next tick to let compiler complete all callbacks.
    // Otherwise logging in other callbacks becomes interlaced with mocha reporters.
    process.nextTick(() => {
      this.mochaChildProcess = fork(__dirname + '/mocha-runner');
      this.mochaChildProcess.on('message', this.handleResult.bind(this));
      this.mochaChildProcess.on('close', this.handleChildProcessClose.bind(this));
      this.mochaChildProcess.send(mochaMessage);
    })
  }

  private handleChildProcessClose(code) {
    if (code && !this.watchMode) {
      process.exit(code);
    }
  }

  private handleResult(testResult: TestResultMessage) {
    this.mochaChildProcess.kill();
    this.mochaChildProcess = null;

    if (!testResult.failures) {
      if (this.codeCoverage) {
        this.generateCoverageReport(testResult.coverage)
      }
    }
    // If this is a single run, exit if there are test failures.
    else if (!this.watchMode) {
      process.exit(1)
    }
  }

  private generateCoverageReport(coverageData) {
    const collector = remap(coverageData);

    const reporter = new istanbul.Reporter();
    reporter.dir   = this.coverageDir;
    reporter.addAll(this.coverageReports);
    reporter.write(collector, false, err => {
      if (err) {
        console.error('Failed to write coverage report:', err)
      }
    })
  }
}
