var doc;

var tempFolder = function() {
  var globallyUniqueString = [[NSProcessInfo processInfo] globallyUniqueString];
  var tempDirectoryPath = NSTemporaryDirectory()
  tempDirectoryPath = [tempDirectoryPath stringByAppendingPathComponent:"com.animaapp.AnimaSketchPlugin"];
  tempDirectoryPath = [tempDirectoryPath stringByAppendingPathComponent:globallyUniqueString];  
  tempDirectoryURL = [NSURL fileURLWithPath:tempDirectoryPath isDirectory:true];
  [[NSFileManager defaultManager] createDirectoryAtURL:tempDirectoryURL withIntermediateDirectories:true attributes:nil error:nil];
  return tempDirectoryPath;
}

var MAX = function(a,b) {
  if (a > b) {
    return a;
  }
  return b;
}

var MIN = function(a,b) {
  if (a < b) {
    return a;
  }
  return b;
}

var openFile = function(filePath) {
  workspace = [[NSWorkspace alloc] init];
  [workspace openFile:filePath];
}

var alert = function(message, informativeText) {
  var alert = [[NSAlert alloc] init];
  [alert setMessageText:message];
  [alert addButtonWithTitle:"Dismiss"];
  if (informativeText != undefined) {
    [alert setInformativeText:informativeText]
  }
  [alert runModal]
}

Array.fromNSArray = function(nsa) {
  var ret = []
  for (i = 0; i < nsa.count(); ++i) {
    ret.push(nsa.objectAtIndex(i))
  }
  return ret;
}

var validImageName = function(wanted_image_name, tryCount) {
  wanted_image_name = wanted_image_name.replace(/[^a-z0-9\s]/gi,'').toLowerCase(); //Alpha numeric and spaces
  //log ("trying:" + wanted_image_name + " for:" + tryCount)
  if (tryCount == 0) {    
    if (![taken_image_names containsObject:wanted_image_name]) {
      [taken_image_names addObject:wanted_image_name];
      return wanted_image_name;
    }
  }
  //log ("trying harder:" + wanted_image_name + " for:" + tryCount)
  var suggested_name = wanted_image_name + "  " + (tryCount + 1);
  if (![taken_image_names containsObject:suggested_name]) {
    [taken_image_names addObject:suggested_name];
    return suggested_name;
  }
  else if (tryCount < 100) {
  //log ("recursive:" + wanted_image_name + " for:" + tryCount)
    return validImageName(wanted_image_name, tryCount+1);
  }
  return wanted_image_name;
}

const ANIMA_PAGE_ID_KEY = "com.animaapp.animaPageID"

var animaPageID = function(context) {
  var page = context.document.currentPage()
  var pageID = context.command.valueForKey_onLayer(ANIMA_PAGE_ID_KEY, page)
  if (pageID == null || pageID == undefined) {
    pageID = [[NSUUID UUID] UUIDString]
    context.command.setValue_forKey_onLayer(pageID, ANIMA_PAGE_ID_KEY, page)
    log("Updated pageID")
  }
  log("pageID: " + pageID)
  return pageID
}

const kViewTypeKey = "kViewTypeKey"
const kShouldIgnoreLayer = "kShouldIgnoreLayer"
const kTextIsPasswordField = "isPassword"
const kTextNativeBgField = "nativeBackground"
const kModelPropertiesKey = "kModelPropertiesKey"

var anima_model_class = function(layer) {
  var anima_class = context.command.valueForKey_onLayer(kViewTypeKey, layer)
  return anima_class;
}

var anima_model_class_properties = function(layer) {
  var class_properties = context.command.valueForKey_onLayer(kModelPropertiesKey, layer)
  return class_properties;
}

var anima_model_class_set_properties = function(layer, properties) {
    if (properties != nil && properties != undefined) {
        context.command.setValue_forKey_onLayer(properties, kModelPropertiesKey, layer)
    }
}

var anima_model_property = function(layer, property) {
  var val = context.command.valueForKey_onLayer(property, layer)
  return val;
}

var ignore_layer_flag = function(layer) {
    var flag = context.command.valueForKey_onLayer(kShouldIgnoreLayer, layer)
    return flag != null && flag != false;
}

var global_clones = [];

var add_global_clone = function(clone) {
    if (clone.removeFromParent) {
        global_clones.push(clone);
    }
}

var remove_global_clone = function(clone) {
  var index = global_clones.indexOf(clone);
  if (index > -1) {
      global_clones.splice(index, 1);
  }
}

var evict_global_clones = function() {
  for (var clone in global_clones) {
      if (clone.removeFromParent) {
          [clone removeFromParent];
      }
      else {
          // Released already
      }
  }
}
