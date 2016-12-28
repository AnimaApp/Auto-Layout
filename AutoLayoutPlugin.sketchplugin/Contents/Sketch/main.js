// plugin.js
// Copyright (c) 2016 Anima App LTD
//

@import "lib/runtime.js"
@import "send_to_anima.js"

function togglePanel(context) {
	if (NSClassFromString("APSketch") == null) {
		runtime.loadBundle("AnimaPlugin.bundle");
		[APSketch setPluginContextDictionary:context];
	}
    try {
        [APSketch setPluginContextDictionary:context];
    } catch (e) {}

    [APSketch togglePanel];
}
