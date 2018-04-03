// plugin.js
// Copyright (c) 2016 Anima App LTD
//

@import "lib/runtime.js"

function togglePanel(context) {
    if (NSClassFromString("APSketch") == null) {
        runtime.loadBundle("AutoLayoutPlugin.bundle");
        [APSketch setPluginContextDictionary:context];
    }
    try {
        [APSketch setPluginContextDictionary:context];
    } catch (e) {}
    
    try {
        [APSketch togglePanel];
    } catch (e) {}
}

function start(context) {
    if (NSClassFromString("APSketch") == null) {
        runtime.loadBundle("AutoLayoutPlugin.bundle");
        [APSketch setPluginContextDictionary:context];
    }
    try {
        [APSketch setPluginContextDictionary:context];
    } catch (e) {}
    try {
        [APSketch start];
    } catch (e) {}
}
