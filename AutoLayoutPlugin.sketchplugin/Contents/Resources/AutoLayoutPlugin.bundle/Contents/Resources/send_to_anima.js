@import 'lib/runtime.js'
@import 'lib/CocoaButter.js'
//@import 'lib/CocoaPowder.js'
@import 'lib/MochaJSDelegate.js'
@import 'lib/ScreenTemplate.js'
@import 'export/predicates.js'
@import 'export/dialog.js'
@import 'export/utils.js'
@import 'export/ui.js'
@import 'export/export.js'
@import 'export/color.js'
@import 'export/text.js'
@import 'export/fonts.js'


//Assuming no simultanuous exports
var doc, context;
var scriptVersion = "1.09.09";
var exportDirectory, modelFilePath, assetsDirectory;
var export_scale_factor = 1.0;
var export_offset = 999999;
var taken_image_names;
var iOSUnsupportedFontsAsImages = true;
var flattenExportables = true;
var flattenMissingFonts = true;
var sketchToCode = false;

var updatePaths = function(sketchToCodeFormat) {
  exportDirectory = tempFolder();
  if (sketchToCodeFormat) {
    exportDirectory = tempFolder() + "/" + doc.displayName().replace(/\.sketch$/, '') + '.sketchtocode';
  }

  var filename = 'app.animaSketchExport';
  if (!sketchToCodeFormat) {
    filename = doc.displayName().replace(/\.sketch$/, '') + '.animaSketchExport';
  }
  modelFilePath = (exportDirectory + "/" + filename);
  log("modelFilePath " + modelFilePath)

  assetsDirectory = modelFilePath + ".assets"
}

var writeJson = function(exportDirectory, doc, artboardsMetadata, scriptVersion, context, animaFontObjects, sketchToCodeFormat) {
  log("writeJson " + doc + artboardsMetadata + scriptVersion)
  var json = {
    name: doc.displayName().replace(/\.sketch$/, ''),
    model_class: 'ADModelApp',
    sketchPageID: animaPageID(context),
    screens: artboardsMetadata,
    sketch_plugin_version: scriptVersion,
    model_version: 0.1,
    theme : {
      model_class: 'ADModelTheme',
      fonts: animaFontObjects
    }
  };

  var metadataJSON = [NSJSONSerialization dataWithJSONObject:json options:NSJSONWritingPrettyPrinted error:nil];
  metadataJSON = [[NSString alloc] initWithData:metadataJSON encoding:NSUTF8StringEncoding];
  [metadataJSON writeToFile:modelFilePath atomically:true encoding:NSUTF8StringEncoding error:null];

  return modelFilePath
};

var current_screen_has_status = false;
var current_screen_has_white_status = false;

var sendToAnima = function(theContext, sketchToCodeFormat) {  
  log("sendToAnima")
  sketchToCode = sketchToCodeFormat

  context = theContext
  doc = context.document
  taken_image_names = [NSMutableArray new]
  updatePaths(sketchToCodeFormat);

  var artboards = Array.fromNSArray(doc.currentPage().artboards()).filter(is_artboard)

  var artboardWithSelectedLayers = [];

  for (var i = 0 ; i < artboards.length ; i++) {
      var artboard = artboards[i];
      var layers = artboard.layers();
      for (var j = 0 ; j < layers.length ; j++) {
          var layer = layers[j];
          if (layer.isSelected()) {
              artboardWithSelectedLayers.push(artboard);
          }
      }
  }

  var selectedArtboards = Array.fromNSArray(context.selection).filter(is_artboard)
  selectedArtboards.push.apply(selectedArtboards, artboardWithSelectedLayers);

  if (artboards.length == 0) {
    showAlert("You need at least one artboard to create an Anima app")
    return
  }

  var dialog = new Dialog()
  var msg = sketchToCodeFormat ? "Sketch to Code" : "Send to Anima"

  var iOSUnsupportedFonts = []; //nonNativeFonts(artboards);
  //log("nonNativeFonts: " + iOSUnsupportedFonts.join());
  var options = dialog.runModal(msg, artboards[0], selectedArtboards.length, iOSUnsupportedFonts)

  if (options.responseCode != NSAlertFirstButtonReturn) { return; }
    
//  resolution = options.resolution
//  export_scale_factor = 1.0 / options.pixelDensity
  selectedOnly = options.selectedOnly
  flattenExportables = options.flattenExportables
  flattenMissingFonts = false

  if (selectedOnly) {
    artboards = selectedArtboards
  }
  var fileManager = [NSFileManager defaultManager];

  var isDir = MOPointer.alloc().init();
  if ([fileManager fileExistsAtPath:exportDirectory isDirectory:isDir]) {
    if (isDir.value() == 0) {
      [fileManager removeItemAtPath:exportDirectory error:0];
    }
  }
    
  var artboardLabel = artboards.length > 1 ? "artboards" : "artboard"
  var completedArtboardsCount = 0
  var processedArtboards = [];
  var progressVal = 0;
  var progressPerArtboard = 1.0/artboards.length;

  var timer_invalidated = false;
  var was_cancelled = false;
  var cancelling_alert = [[NSAlert alloc] init];
  [cancelling_alert setMessageText:"Cancelling..."];
  [cancelling_alert addButtonWithTitle:"Abort"];

  var alert = [[NSAlert alloc] init];
  [alert setMessageText:"Processing..."];
  [alert setInformativeText:""];
    
  var animaFontObjects = exportFonts(doc, assetsDirectory, artboards);

  var progress = [[NSProgressIndicator alloc] initWithFrame:CGRectMake(0, 0, 400, 50)]
  [progress setMaxValue:1]
  [progress setMinValue:0]
  [progress setDoubleValue:0];
  [progress setUsesThreadedAnimation:true];
  [progress startAnimation:nil];
  [progress setIndeterminate:false];
  [alert setAccessoryView:progress]
  var button = [alert addButtonWithTitle:"Cancel"];

  var artboardIndex = artboards.length - 1;;
  var generatedThumb = false;

  var processor = new MochaJSDelegate({
    "processArtboards:":(function(timer) {      
      artboard = artboards[artboardIndex];
      var processedArtboard = processArtboard(artboard)
      processedArtboards.push(processedArtboard);      
      progressVal += progressPerArtboard;
      [progress setDoubleValue:progressVal];      
      var message  =  "Completed " + processedArtboards.length + " out of " + artboards.length + " artboards."
      [alert setInformativeText: message];

      if (!generatedThumb) {
        generatedThumb = true;
        generate_thumb(artboard);
      }

     if ([APExport shouldExportFidelityCheckScreens:doc]) {
       var fidelityArtboard = createFidelityArtboard(artboard,processedArtboard)
       processedArtboards.push(fidelityArtboard);
     }

      artboardIndex--;
      if (artboardIndex < 0 || was_cancelled) {
        timer.invalidate()
        timer_invalidated = true;  
      }
      if (artboardIndex < 0 && !was_cancelled) {
        [NSApp endSheet:alert.window()];
      }
      else if (was_cancelled) {
        [NSApp endSheet:cancelling_alert.window()];
      }
    }),
  });

    // Use this for better crash reports, instead of timer
//    var done = false;
//    while (!done) {
//        artboard = artboards[artboardIndex];
//        var processedArtboard = processArtboard(artboard)
//        processedArtboards.push(processedArtboard);
//        progressVal += progressPerArtboard;
//        [progress setDoubleValue:progressVal];
//        var message  =  "Completed " + processedArtboards.length + " out of " + artboards.length + " artboards."
//        [alert setInformativeText: message];
//        
//        artboardIndex--;
//        if (artboardIndex < 0 || was_cancelled) {
//            done = true;
//        }
//        if (artboardIndex < 0 && !was_cancelled) {
//            [NSApp endSheet:alert.window()];
//        }
//        else if (was_cancelled) {
//            [NSApp endSheet:cancelling_alert.window()];
//        }
//    }
  var timer = [NSTimer scheduledTimerWithTimeInterval: 0.05 target: processor.getClassInstance() selector: "processArtboards:" userInfo: nil repeats: true]
  var runLoop = [NSRunLoop currentRunLoop];
  [runLoop addTimer:timer forMode:NSRunLoopCommonModes];
  var responseCode = [alert runModal];
  if (responseCode == 1000) {
    was_cancelled = true;
    if (!timer_invalidated) {
      [cancelling_alert runModal]; // Keeping objects alive for timer (Prevents crash), Timer will dismiss it
    }
    return
  }

  var filePath = writeJson(exportDirectory, doc, processedArtboards, scriptVersion, context, animaFontObjects, sketchToCodeFormat)
  if (sketchToCodeFormat) {
      log(exportDirectory);
      openFile(exportDirectory); //STC
//      openFile(filePath);      //Anima
  }
  else {
    openFile(filePath);
  }

};

var animaOnRun = function(context) {
  sendToAnimaSafe(context, false)
}

var stcOnRun = function(context) {
  sendToAnimaSafe(context, true)
}

var sendToAnimaSafe = function(context, sketchToCodeFormat) {
    try {
        loadBundle();
        sendToAnima(context, sketchToCodeFormat)
    }
    catch (e) {
        var cocoabutter = new CocoaButter()
        cocoabutter.baseURL = "http://anima-cocoabutter.herokuapp.com"
        cocoabutter.username = "animaapp"
        cocoabutter.password = "ButterPass135135!!"
        
        var scriptMap = new CocoaButterScriptMap()
        var stackTrace = scriptMap.trace(e)
        var message = e.message != undefined ? e.message : e + "";
        [[APLogging shared] logJSError:message stack:stackTrace originalStack:e.stack];
        
        cocoabutter.report(e, context, "Export Failed :\\", "Something went wrong, but we're on it!")
        log("Stack: " + e.stack);
    }
    evict_global_clones();
}

var loadBundle = function() {
    if (NSClassFromString("APSketch") == null) {
        try {
            runtime.loadBundle("STCPlugin.bundle");
            [APSketch setPluginContextDictionary:context];
        } catch (e) {
            try {
                runtime.loadBundle("AnimaPlugin.bundle");
                [APSketch setPluginContextDictionary:context];
            } catch (e) {}
        }
    }
    try {
        [APSketch setPluginContextDictionary:context];
    } catch (e) {}
//    log("APExport:" + NSClassFromString("APExport"));
//    log("APSketch:" + NSClassFromString("APSketch"));
}
