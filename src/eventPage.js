var takanaClient = require('./takanaClient');
var url = require('url');
var hostnamesKey = 'hostnames';
var icons = chrome.runtime.getManifest().icons;

var showActiveIcon = function(tabId) {
  showIcon(tabId, icons.active);
}

var showDisabledIcon = function(tabId) {
  showIcon(tabId, icons.disabled);
}

var showIcon = function(tabId, iconPath) {
  console.debug('Icon', tabId, iconPath);

  if (!tabId) { return; }
  chrome.pageAction.setIcon({ tabId: tabId, path: iconPath });
  chrome.pageAction.show(tabId);    
}

var injectTakanaScript = function (e) {
  console.debug('Injecting', e.tabId);

  chrome.tabs.executeScript(e.tabId, { code: takanaClient });
  showActiveIcon(e.tabId);
}

var toggleHostname = function(hostname, callback) {
  console.debug('Toggling', hostname);

  chrome.storage.sync.get(hostnamesKey, function(o) {
    var hostnames = (o.hostnames || []);
    var index = hostnames.indexOf(hostname);
    if (index === -1) { hostnames.push(hostname); } else { hostnames.splice(index, 1); }

    chrome.storage.sync.set({ hostnames: hostnames });

    callback(index === -1);
  });
}

var restart = function() {
  console.debug('Restarting');

  chrome.storage.sync.get(hostnamesKey, function(o) {
    if (!o.hostnames || o.hostnames.length == 0) { return; }

    var filter = { 
      url: o.hostnames.map(function(hostname) { return { hostEquals: hostname }; })
    };  

    chrome.webNavigation.onDOMContentLoaded.removeListener(injectTakanaScript);
    chrome.webNavigation.onDOMContentLoaded.addListener(injectTakanaScript, filter);
  });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes[hostnamesKey]) { restart(); };
});

chrome.pageAction.onClicked.addListener(function(e) {
  console.debug('Clicked', e);

  e.tabId = e.id;
  var hostname = url.parse(e.url, true).hostname;
  toggleHostname(hostname, function(added) {
    if (added) { 
      injectTakanaScript(e); 
    } else { 
      showDisabledIcon(e.tabId);
    };
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') { 
    showDisabledIcon(tabId); 
  }
});

restart();
