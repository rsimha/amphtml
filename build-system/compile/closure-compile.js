/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const {cyan, red, yellow} = require('kleur/colors');
const {getOutput} = require('../common/process');
const {highlight} = require('cli-highlight');
const {log} = require('../common/logging');

/**
 * Formats a closure compiler error message into a more readable form by
 * syntax highlighting the error text.
 * @param {string} message
 * @return {string}
 */
function formatClosureCompilerError(message) {
  message = highlight(message, {ignoreIllegals: true})
    .replace(/ WARNING /g, yellow(' WARNING '))
    .replace(/ ERROR /g, red(' ERROR '));
  return message;
}

/**
 * Handles a closure error during multi-pass compilation. Optionally doesn't
 * emit a fatal error when compilation fails and signals the error so subsequent
 * operations can be skipped (used in watch mode).
 *
 * @param {string} err
 * @param {string} outputFilename
 * @param {?Object} options
 */
function handleCompilerError(err, outputFilename, options) {
  const message = `${red('ERROR:')} Could not minify ${cyan(outputFilename)}`;
  logError(message, err);
  if (options && options.continueOnError) {
    options.errored = true;
  } else {
    throw new Error(message);
  }
}

/**
 * Handles a closure error during type checking
 *
 * @param {string} err
 */
function handleTypeCheckError(err) {
  const message = `${red('ERROR:')} Type checking failed`;
  logError(message, err);
  throw new Error(message);
}

/**
 * Prints an error message when compilation fails
 * @param {string} message
 * @param {string} err
 */
function logError(message, err) {
  log(`${message}\n` + formatClosureCompilerError(err));
}

/**
 * Runs closure compiler with the given set of flags.
 * @param {Array<string>} flags
 * @return {!Object}
 */
function runClosure(flags) {
  const closureExecutable = 'npx @ampproject/google-closure-compiler';
  const closureCmd = `${closureExecutable} ${flags.join(' ')}`;
  return getOutput(closureCmd);
}

module.exports = {
  runClosure,
  handleCompilerError,
  handleTypeCheckError,
};
