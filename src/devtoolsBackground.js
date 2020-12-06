var panels = chrome && chrome.devtools && chrome.devtools.panels;
var elementsPanel = panels && panels.elements;

if (panels) {
  panels.create(
    "API Genie",
    "wifi_network.png",
    "index.html",
    function () {}
  );
}
