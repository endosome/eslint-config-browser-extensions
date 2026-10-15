export function listen() {
  chrome.runtime.onMessage.addListener(message => {
    document.title = String(message);
  });
  browser.runtime.sendMessage('ready');
}

export const environment = () => process.env.NODE_ENV;
