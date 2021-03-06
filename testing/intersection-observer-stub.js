/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
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

/**
 * @param {!Object} sandbox
 * @param {!Window} window
 * @return {!IntersectionObservers}
 */
export function installIntersectionObserverStub(sandbox, win) {
  return new IntersectionObservers(sandbox, win);
}

class IntersectionObservers {
  /**
   * @param {!Object} sandbox
   * @param {!Window} win
   */
  constructor(sandbox, win) {
    const observers = new Set();
    this.observers = observers;

    sandbox.stub(win, 'IntersectionObserver').value(function (callback) {
      const observer = new IntersectionObserverStub(callback, () => {
        observers.delete(observer);
      });
      observers.add(observer);
      return observer;
    });
  }

  /**
   * @param {!Element} target
   * @return {boolean}
   */
  isObserved(target) {
    return Array.from(this.observers).some((observer) =>
      observer.elements.has(target)
    );
  }

  /**
   * @param {!IntersectionObserverEntry|!Array<IntersectionObserverEntry>} entryOrEntries
   */
  notifySync(entryOrEntries) {
    const entries = Array.isArray(entryOrEntries)
      ? entryOrEntries
      : [entryOrEntries];
    this.observers.forEach((observer) => {
      const subEntries = entries.filter(({target}) =>
        observer.elements.has(target)
      );
      if (subEntries.length > 0) {
        observer.callback(subEntries);
      }
    });
  }
}

class IntersectionObserverStub {
  constructor(callback, onDisconnect) {
    this.onDisconnect_ = onDisconnect;
    this.callback = callback;
    this.elements = new Set();
  }

  disconnect() {
    const onDisconnect = this.onDisconnect_;
    onDisconnect();
  }

  /**
   * @param {!Element} element
   */
  observe(element) {
    this.elements.add(element);
  }

  /**
   * @param {!Element} element
   */
  unobserve(element) {
    this.elements.delete(element);
  }
}
