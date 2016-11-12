export interface TestConfigMessage {
  files: string[];
  coverage: boolean;
  coverageVariable?: string;
  mochaOptions: any;
}

export interface TestResultMessage {
  failures?: any;
  coverage?: any;
}