#!/usr/bin/env node

const core = require('@actions/core');
const { exec } = require('@actions/exec');
const io = require('@actions/io');

const OutputListener = require('./lib/output-listener');
const pathToCLI = require('./lib/tflint-bin');

async function checkTflint() {
  // Setting check to `true` will cause `which` to throw if tflint isn't found
  const check = true;
  return io.which(pathToCLI, check);
}

(async () => {
  // This will fail if tflint isn't found, which is what we want
  await checkTflint();

  // Create listeners to receive output (in memory) as well
  const stdout = new OutputListener();
  const stderr = new OutputListener();
  const listeners = {
    stdout: stdout.listener,
    stderr: stderr.listener,
  };

  // Execute tflint and capture output
  const args = process.argv.slice(2);
  const options = {
    listeners,
    ignoreReturnCode: true,
  };
  const exitCode = await exec(pathToCLI, args, options);
  core.debug(`tflint exited with code ${exitCode}.`);
  core.debug(`stdout: ${stdout.contents}`);
  core.debug(`stderr: ${stderr.contents}`);
  core.debug(`exitcode: ${exitCode}`);

  // Set outputs, result, exitcode, and stderr
  core.setOutput('stdout', stdout.contents);
  core.setOutput('stderr', stderr.contents);
  core.setOutput('exitcode', exitCode.toString(10));

  if (exitCode === 0 || exitCode === 2) {
    // A exitCode of 0 is considered a success
    // An exitCode of 2 denotes no errors occurred, but issues found
    return;
  }

  // A non-zero exitCode is considered an error
  core.setFailed(`TFlint exited with code ${exitCode}.`);
})();
