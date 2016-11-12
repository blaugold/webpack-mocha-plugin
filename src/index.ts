import * as Mocha from 'mocha'
import * as remap from 'remap-istanbul/lib/remap'
import * as istanbul from 'istanbul'

export class WebpackMochaPlugin {

  private watchMode: boolean;
  private codeCoverage: boolean;
  private coverageVariable: string;
  private coverageReports: string[];
  private coverageDir: string;
  private mochaOptions: string;

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
    // Get bundle by using name of first asset which ends in .js.
    // TODO multiple assets (choose one in config or start add all to test)
    const assets  = stats.compilation.assets;
    const bundles = Object.keys(assets).filter(fileName => fileName.match(/\.js$/));

    const mocha = new Mocha(this.mochaOptions);

    bundles
      .map(bundle => assets[bundle])
      .filter(bundle => !!bundle)
      .map(bundle => bundle.existsAt)
      .forEach(path => mocha.addFile(path));

    // Run test in next tick to let compiler complete all callbacks.
    // Otherwise logging in other callbacks becomes interlaced with mocha reporters.
    process.nextTick(() => {
      console.log('\n');
      this.runMocha(mocha)
    })
  }

  private runMocha(mocha) {
    console.log('MochaPlugin:');

    mocha.run(failures => {
      if (!failures) {
        if (this.codeCoverage) {
          this.generateCoverageReport()
        }
      }
      else if (!this.watchMode) {
        process.exit(1)
      }
    })
  }

  private generateCoverageReport() {
    const collector = remap(global[this.coverageVariable]);

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

module.exports = WebpackMochaPlugin;
