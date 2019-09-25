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
            runtime.loadBundle("AutoLayoutPlugin.bundle");
            [APSketch setPluginContextDictionary:context];
        } catch (e) {
            try {
                runtime.loadBundle("AnimaToolkitTests.bundle");
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
    [APSketch createScreenSizesDoc:context];
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

function previewInBrowser(context) {
    loadBundleIfRequired();
    [APSketch previewInBrowser];
}

function downloadWebCode(context) {
    loadBundleIfRequired();
    [APSketch downloadWebCode];
}

function shareHandoff(context) {
    loadBundleIfRequired();
    [APSketch shareHandoff];
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

function editFontsFallbacks(context) {
    loadBundleIfRequired();
    [APSketch editFontsFallbacks];
}

function editMataTags(context) {
    loadBundleIfRequired();
    [APSketch editMataTags];
}

function prepareForExport(context) {
    loadBundleIfRequired();
    [APSketch prepareForExportIfNeeded:context];
}

function exportToZeplin(context) {
    loadBundleIfRequired();
    [APSketch runZeplinExport:context];
}

function clearExportCache(context) {
    loadBundleIfRequired();
    [APSketch clearExportCache];
}


function removeAutolayoutData(context) {
    loadBundleIfRequired();
    [APSketch removeAutolayoutData];
}

function arrangeArtboards(context) {
    loadBundleIfRequired();
    [APSketch arrangeArtboards];
}
