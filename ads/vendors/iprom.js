/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
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

import {parseJson} from '../../src/json';
import {validateData, writeScript} from '../../3p/3p';

/**
 * @param {!Window} global
 * @param {{
 *   sitepath: string,
 *   zone: Array<string>,
 *   keywords: (string|undefined),
 *   channels: (string|undefined)
 * }} data
 */
export function iprom(global, data) {
  validateData(data, ['zone', 'sitepath'], ['keywords', 'channels']);

  const ampdata = {
    sitepath: '[]',
    zone: [],
    keywords: '',
    channels: '',
    ...data,
  };

  /**
   * Callback for WriteScript
   */
  function namespaceLoaded() {
    const ipromNS = window.ipromNS || {};

    ipromNS.AdTag = ipromNS.AdTag || {};

    const config = {
      sitePath: parseJson(/** @type {{sitepath: string}} */ (ampdata).sitepath),
      containerId: 'c',
      zoneId: /** @type {{zone: Array<string>}} */ (ampdata).zone,
      prebid: true,
      amp: true,
      keywords: /** @type {{keywords: (string|undefined)}} */ (ampdata).keywords
        ? /** @type {{keywords: (string|undefined)}} */ (ampdata).keywords.split(
            ','
          )
        : [],
      channels: /** @type {{channels: (string|undefined)}} */ (ampdata).channels
        ? /** @type {{channels: (string|undefined)}} */ (ampdata).channels.split(
            ','
          )
        : [],
    };

    const tag = new ipromNS.AdTag(config);
    tag.init();
  }

  writeScript(global, 'https://cdn.ipromcloud.com/ipromNS.js', namespaceLoaded);
}
