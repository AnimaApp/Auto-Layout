//
//  framework_actions.js
//  AnimaPlugin
//
//  Created by Avishay Cohen on 18/12/2016.
//  Copyright © 2016 Anima App. All rights reserved.
//

@import "lib/runtime.js"

function loadBundleIfRequired() {
    if (NSClassFromString("APSketch") == null) {
        try {
            runtime.loadBundle("STCPlugin.bundle");
            [APSketch setPluginContextDictionary:context];
        } catch (e) {
            try {
                runtime.loadBundle("AnimaPlugin.bundle");
                [APSketch setPluginContextDictionary:context];
            } catch (e) {
                try {
                    runtime.loadBundle("AutoLayoutPlugin.bundle");
                    [APSketch setPluginContextDictionary:context];
                } catch (e) {}
            }
        }
    }
    try {
        [APSketch setPluginContextDictionary:context];
    } catch (e) {}
}

function createLinkForSelectedLayer(context) {
    loadBundleIfRequired();
    [APSketch createLinkForSelectedLayer];
}

function createScreenSizesDoc(context) {
    loadBundleIfRequired();
    [APSketch createScreenSizesDoc];
}

function checkForUpdate(context) {
    loadBundleIfRequired();
    [APSketch checkForUpdateAndShowIfNone];
}

function showMyExports(context) {
    loadBundleIfRequired();
    [APSketch showMyExports];
}

function presentChangeLog(context) {
    loadBundleIfRequired();
    [APSketch presentChangeLog];
}

function presentKeyboardShortcuts(context) {
    loadBundleIfRequired();
    [APSketch presentKeyboardShortcuts];
}

function openCommunity(context) {
    loadBundleIfRequired();
    [APSketch openCommunity];
}

function openDocs(context) {
    loadBundleIfRequired();
    [APSketch openDocs];
}

function exportWeb(context) {
    loadBundleIfRequired();
    [[NSUserDefaults standardUserDefaults] setBool:0 forKey:@"com.animaapp.show-developer-dashboard-link"];
    [APSketch exportWeb];
}

function exportWebReal(context) {
    loadBundleIfRequired();
    [[NSUserDefaults standardUserDefaults] setBool:1 forKey:@"com.animaapp.show-developer-dashboard-link"];
    [APSketch exportWeb];
}

function myAccount(context) {
    loadBundleIfRequired();
    [APSketch myAccount];
}

function upgradePlan(context) {
    loadBundleIfRequired();
    [APSketch upgradePlan];
}

function starOnGitHub(context) {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"https://github.com/AnimaApp/Auto-Layout/stargazers"]];
}

function duplicateAndDetachAllSymbols(context) {
    loadBundleIfRequired();
    [APSketch duplicateAndDetachAllSymbols];
}

function detachSymbolPreservingOverrides(context) {
    loadBundleIfRequired();
    [APSketch detachSymbolPreservingOverridesNonRecursive];
}

function detachSymbolPreservingOverridesRecursive(context) {
    loadBundleIfRequired();
    [APSketch detachSymbolPreservingOverridesRecursive];
}
