/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

const babel = require('@babel/core');
const fs = require('fs-extra');
const globby = require('globby');
const path = require('path');
const tempy = require('tempy');
const {BABEL_SRC_GLOBS, THIRD_PARTY_TRANSFORM_GLOBS} = require('./sources');
const {log} = require('../common/logging');
const {red, cyan} = require('kleur/colors');

/**
 * Files on which to run pre-closure babel transforms.
 *
 * @private @const {!Array<string>}
 */
let filesToTransform;

/**
 * Directory used to cache babel transforms.
 *
 * @private @const {string}
 */
let cacheDir;

/**
 * Returns the name of the babel cache directory if it has been created.
 * @return {string}
 */
function getBabelCacheDir() {
  return cacheDir || '';
}

/**
 * Computes the set of files on which to run pre-closure babel transforms.
 *
 * @return {!Array<string>}
 */
function getFilesToTransform() {
  return globby
    .sync([...BABEL_SRC_GLOBS, '!node_modules/', '!third_party/'])
    .concat(globby.sync(THIRD_PARTY_TRANSFORM_GLOBS))
    .map(path.normalize);
}

/**
 * Apply babel transforms prior to closure compiler pass and return the path
 * of the transformed file.
 *
 * When a source file is transformed for the first time, it is written to a
 * cache directory from where it is retrieved every subsequent time without
 * invoking babel.
 *
 * @param {string} file
 * @param {string} outputFilename
 * @param {!Object} options
 * @return {string}
 */
async function preClosureBabel(file, outputFilename, options) {
  if (!cacheDir) {
    cacheDir = tempy.directory();
    console.log(cacheDir);
  }
  if (!filesToTransform) {
    filesToTransform = getFilesToTransform();
  }
  const transformedFile = path.join(cacheDir, file);
  if (fs.existsSync(transformedFile)) {
    return transformedFile;
  }
  if (!filesToTransform.includes(file)) {
    await fs.copy(file, transformedFile);
    return transformedFile;
  }
  const babelOptions = babel.loadOptions({
    caller: {name: 'pre-closure'},
    filename: file,
    sourceFileName: path.relative(process.cwd(), file),
  });
  try {
    const {code} = await babel.transformFileAsync(file, babelOptions);
    await fs.outputFile(transformedFile, Buffer.from(code, 'utf-8'));
  } catch (err) {
    handlePreClosureError(err, outputFilename, options);
  }
  return transformedFile;
}

/**
 * Handles a pre-closure babel error. Optionally doesn't emit a fatal error when
 * compilation fails and signals the error so subsequent operations can be
 * skipped (used in watch mode).
 *
 * @param {Error} err
 * @param {string} outputFilename
 * @param {?Object=} options
 */
function handlePreClosureError(err, outputFilename, options) {
  log(red('ERROR:'), err.message, '\n');
  const reasonMessage = `Could not compile ${cyan(outputFilename)}`;
  if (options && options.continueOnError) {
    log(red('ERROR:'), reasonMessage);
    options.errored = true;
  } else {
    throw new Error(reasonMessage);
  }
}

module.exports = {
  getBabelCacheDir,
  preClosureBabel,
};
