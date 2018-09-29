import { Observable } from 'rxjs/Observable';
import { getChromeOptions, querySelector as $ } from './utils';
import { keys as optionKeys } from './options/defaultOptions';

const CLASS_PREFIX = 'chat-danmaku';

class Chatroom {
  options = {};
  requireSelector = [];

  constructor() {
    this.msgObservable = Observable.create((observer) => {
      this.msgObserver = observer;
    });
    getChromeOptions().then(items => this.loadStorage(items, 'sync'));
    chrome.storage.onChanged.addListener(this.onStorageChanged.bind(this));
    this.checkReady().then(this.onReady.bind(this));
  }

  checkReady() {
    return new Promise((resolve) => {
      const handler = setInterval(() => {
        if (this.requireSelector.every(sel => $(sel) !== null)) {
          clearInterval(handler);
          resolve();
        }
      }, 1000);
    });
  }

  onReady() {}
  onUpdate() {}

  subscribe(...args) {
    this.msgObservable.subscribe(...args);
  }

  initDomObserver(chatroomEl) {
    const observerOptions = {
      childList: true,
    };

    this.domObservable = new MutationObserver(mutations => this.onUpdate(mutations));
    this.domObservable.observe(chatroomEl, observerOptions);
  }

  loadStorage(items, namespace) {
    const changed = {};
    Object.keys(items).forEach((key) => {
      changed[key] = {
        newValue: items[key],
        oldValue: null,
      };
    });
    this.onStorageChanged(changed, namespace);
  }

  onStorageChanged(changed) {
    optionKeys
      .filter(key => key in changed)
      .forEach((key) => {
        this.options[key] = changed[key].newValue;
      });
  }

  static createCanvas(parentEl) {
    if (parentEl === null) {
      return null;
    }
    const canvasEl = document.createElement('div');
    canvasEl.classList.add(`${CLASS_PREFIX}-messages`);
    parentEl.appendChild(canvasEl);
    canvasEl.addEventListener('animationend', e => e.target.remove());
    return canvasEl;
  }

  render(msg) {
    const msgEl = document.createElement('div');
    msgEl.classList.add(`${CLASS_PREFIX}-message`);
    if (this.options.messageColor) {
      msgEl.style.setProperty('--color', msg.color);
    }
    if (this.options.messageBorder) {
      msgEl.classList.add('border');
    }
    if (this.options.messageShadow) {
      msgEl.classList.add('shadow');
    }
    msgEl.style.setProperty('--opacity', this.options.messageOpacity / 100);
    msgEl.style.setProperty('--line-num', ~~(Math.random() * this.options.messageLineNumber));
    msgEl.innerHTML = msg.content;

    this.canvasEl.appendChild(msgEl);
  }
}

export default Chatroom;
