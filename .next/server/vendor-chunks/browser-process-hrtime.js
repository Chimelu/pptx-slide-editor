/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/browser-process-hrtime";
exports.ids = ["vendor-chunks/browser-process-hrtime"];
exports.modules = {

/***/ "(ssr)/./node_modules/browser-process-hrtime/index.js":
/*!******************************************************!*\
  !*** ./node_modules/browser-process-hrtime/index.js ***!
  \******************************************************/
/***/ ((module) => {

eval("module.exports = process.hrtime || hrtime;\n// polyfil for window.performance.now\nvar performance = global.performance || {};\nvar performanceNow = performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || function() {\n    return new Date().getTime();\n};\n// generate timestamp or delta\n// see http://nodejs.org/api/process.html#process_process_hrtime\nfunction hrtime(previousTimestamp) {\n    var clocktime = performanceNow.call(performance) * 1e-3;\n    var seconds = Math.floor(clocktime);\n    var nanoseconds = Math.floor(clocktime % 1 * 1e9);\n    if (previousTimestamp) {\n        seconds = seconds - previousTimestamp[0];\n        nanoseconds = nanoseconds - previousTimestamp[1];\n        if (nanoseconds < 0) {\n            seconds--;\n            nanoseconds += 1e9;\n        }\n    }\n    return [\n        seconds,\n        nanoseconds\n    ];\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9wcHR4LWVkaXRvci8uL25vZGVfbW9kdWxlcy9icm93c2VyLXByb2Nlc3MtaHJ0aW1lL2luZGV4LmpzPzBkODciXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSBwcm9jZXNzLmhydGltZSB8fCBocnRpbWVcblxuLy8gcG9seWZpbCBmb3Igd2luZG93LnBlcmZvcm1hbmNlLm5vd1xudmFyIHBlcmZvcm1hbmNlID0gZ2xvYmFsLnBlcmZvcm1hbmNlIHx8IHt9XG52YXIgcGVyZm9ybWFuY2VOb3cgPVxuICBwZXJmb3JtYW5jZS5ub3cgICAgICAgIHx8XG4gIHBlcmZvcm1hbmNlLm1vek5vdyAgICAgfHxcbiAgcGVyZm9ybWFuY2UubXNOb3cgICAgICB8fFxuICBwZXJmb3JtYW5jZS5vTm93ICAgICAgIHx8XG4gIHBlcmZvcm1hbmNlLndlYmtpdE5vdyAgfHxcbiAgZnVuY3Rpb24oKXsgcmV0dXJuIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgfVxuXG4vLyBnZW5lcmF0ZSB0aW1lc3RhbXAgb3IgZGVsdGFcbi8vIHNlZSBodHRwOi8vbm9kZWpzLm9yZy9hcGkvcHJvY2Vzcy5odG1sI3Byb2Nlc3NfcHJvY2Vzc19ocnRpbWVcbmZ1bmN0aW9uIGhydGltZShwcmV2aW91c1RpbWVzdGFtcCl7XG4gIHZhciBjbG9ja3RpbWUgPSBwZXJmb3JtYW5jZU5vdy5jYWxsKHBlcmZvcm1hbmNlKSoxZS0zXG4gIHZhciBzZWNvbmRzID0gTWF0aC5mbG9vcihjbG9ja3RpbWUpXG4gIHZhciBuYW5vc2Vjb25kcyA9IE1hdGguZmxvb3IoKGNsb2NrdGltZSUxKSoxZTkpXG4gIGlmIChwcmV2aW91c1RpbWVzdGFtcCkge1xuICAgIHNlY29uZHMgPSBzZWNvbmRzIC0gcHJldmlvdXNUaW1lc3RhbXBbMF1cbiAgICBuYW5vc2Vjb25kcyA9IG5hbm9zZWNvbmRzIC0gcHJldmlvdXNUaW1lc3RhbXBbMV1cbiAgICBpZiAobmFub3NlY29uZHM8MCkge1xuICAgICAgc2Vjb25kcy0tXG4gICAgICBuYW5vc2Vjb25kcyArPSAxZTlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFtzZWNvbmRzLG5hbm9zZWNvbmRzXVxufSJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwicHJvY2VzcyIsImhydGltZSIsInBlcmZvcm1hbmNlIiwiZ2xvYmFsIiwicGVyZm9ybWFuY2VOb3ciLCJub3ciLCJtb3pOb3ciLCJtc05vdyIsIm9Ob3ciLCJ3ZWJraXROb3ciLCJEYXRlIiwiZ2V0VGltZSIsInByZXZpb3VzVGltZXN0YW1wIiwiY2xvY2t0aW1lIiwiY2FsbCIsInNlY29uZHMiLCJNYXRoIiwiZmxvb3IiLCJuYW5vc2Vjb25kcyJdLCJtYXBwaW5ncyI6IkFBQUFBLE9BQU9DLE9BQU8sR0FBR0MsUUFBUUMsTUFBTSxJQUFJQTtBQUVuQyxxQ0FBcUM7QUFDckMsSUFBSUMsY0FBY0MsT0FBT0QsV0FBVyxJQUFJLENBQUM7QUFDekMsSUFBSUUsaUJBQ0ZGLFlBQVlHLEdBQUcsSUFDZkgsWUFBWUksTUFBTSxJQUNsQkosWUFBWUssS0FBSyxJQUNqQkwsWUFBWU0sSUFBSSxJQUNoQk4sWUFBWU8sU0FBUyxJQUNyQjtJQUFZLE9BQU8sQUFBQyxJQUFJQyxPQUFRQyxPQUFPO0FBQUc7QUFFNUMsOEJBQThCO0FBQzlCLGdFQUFnRTtBQUNoRSxTQUFTVixPQUFPVyxpQkFBaUI7SUFDL0IsSUFBSUMsWUFBWVQsZUFBZVUsSUFBSSxDQUFDWixlQUFhO0lBQ2pELElBQUlhLFVBQVVDLEtBQUtDLEtBQUssQ0FBQ0o7SUFDekIsSUFBSUssY0FBY0YsS0FBS0MsS0FBSyxDQUFDLEFBQUNKLFlBQVUsSUFBRztJQUMzQyxJQUFJRCxtQkFBbUI7UUFDckJHLFVBQVVBLFVBQVVILGlCQUFpQixDQUFDLEVBQUU7UUFDeENNLGNBQWNBLGNBQWNOLGlCQUFpQixDQUFDLEVBQUU7UUFDaEQsSUFBSU0sY0FBWSxHQUFHO1lBQ2pCSDtZQUNBRyxlQUFlO1FBQ2pCO0lBQ0Y7SUFDQSxPQUFPO1FBQUNIO1FBQVFHO0tBQVk7QUFDOUIiLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYnJvd3Nlci1wcm9jZXNzLWhydGltZS9pbmRleC5qcyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/browser-process-hrtime/index.js\n");

/***/ })

};
;