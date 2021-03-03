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

const closureCompiler = require('@ampproject/google-closure-compiler').gulp();
const gulp = require('gulp');
const rename = require('gulp-rename');
const {cyan, red, yellow} = require('kleur/colors');
const {getBabelCacheDir} = require('./pre-closure-babel');
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
  log(`${message}\n` + err);
}

/**
 * Runs closure compiler with the given set of flags.
 * @param {!Object} options
 * @param {!Object} closureOptions
 * @param {!Array<string>} transformedSrcFiles
 * @param {string} outputFilename
 * @param {string} outputDir
 * @return {Promise<void>}
 */
async function runClosure(
  options,
  closureOptions,
  transformedSrcFiles,
  outputFilename,
  outputDir
) {
  return gulp
    .src(transformedSrcFiles, {base: getBabelCacheDir()})
    .pipe(closureCompiler(closureOptions))
    .on('error', (err) => {
      options.typeCheckOnly
        ? handleTypeCheckError(err)
        : handleCompilerError(err, outputFilename, options);
    })
    .pipe(rename(outputFilename))
    .pipe(gulp.dest(outputDir));
}

module.exports = {
  runClosure,
  handleCompilerError,
  handleTypeCheckError,
};
