


var is_group = function(layer) {
  return [layer isMemberOfClass:[MSLayerGroup class]] || [layer isMemberOfClass:[MSArtboardGroup class]] || [layer isMemberOfClass:[MSSymbolMaster class]]
}

var is_mask_group = function(layer) {
  if (is_group(layer) && layer.layers().count() > 0) {
    var clip = layer.layers().objectAtIndex(0)
    if (clip.hasClippingMask()) {
      return true
    }
  }
  return false
}

var is_bitmap_with_no_alpha = function(layer) {
  if (!layer.is_bitmap) {
    return false;
  }
  return layer.image().image().representations()[0].alpha == false
}

var is_symbol_instance = function(layer) {
  return [layer isMemberOfClass:[MSSymbolInstance class]]
}

var is_text = function(layer) {
  return [layer isMemberOfClass:[MSTextLayer class]]
}

var is_slice = function(layer) {
  return [layer isMemberOfClass:[MSSliceLayer class]]
}

var is_artboard = function(layer) {
  return [layer isMemberOfClass:[MSArtboardGroup class]];
}

var is_bitmap = function(layer) {
  return [layer isMemberOfClass:[MSBitmapLayer class]];
}

var is_table = function(layer) {
  var anima_class = anima_model_class(layer);  
  return (anima_class == "ADModelTableView");
}

var has_simple_anima_model_class = function(layer) {
  var anima_class = anima_model_class(layer);  
  return (anima_class == "ADModelWebView" ||
          anima_class == "ADModelMapView" ||
          anima_class == "ADModelSwitchView" ||
          anima_class == "ADModelBlurView" ||
          anima_class == "ADModelProgressView" ||
          anima_class == "ADModelSliderView" ||
          anima_class == "ADModelVideoView"
          );
}

var is_native_view_to_ignore = function(layer) {
  return ([layer name].lastIndexOf("Keyboard/", 0) === 0 || 
          [layer name].lastIndexOf("Modal/", 0) === 0 ||    
          [layer name].lastIndexOf("Alert/", 0) === 0);
}

var is_status_bar = function(layer) {
  return [layer name].lastIndexOf("Status Bar/", 0) === 0;
}

var is_white_status_bar = function(layer) {
  return [layer name].lastIndexOf("Status Bar/W", 0) === 0;
}

var should_ignore_layer = function(layer) {
  return !![layer name].match(/\-anima$/) || ignore_layer_flag(layer)
}

var should_flatten_layer = function(layer) {
  var anima_class = anima_model_class(layer);
  if (anima_class == "ADModelImageView") {
//      log("should_flatten_layer:true - ADModelImageView")
    return true;
  }
  if (!![layer name].match(/\+anima$/)) {
//      log("should_flatten_layer:true - +anima")
    return true;
  }
  if ([layer isFlippedHorizontal] || [layer isFlippedVertical]) {
//      log("should_flatten_layer:true - isFlipped")
    return true;
  }  
  if (flattenExportables == false) {
    return false;
  }
  try {
    var isSlice = [[[layer exportOptionsGeneric] exportFormatsGeneric] count];
    if (isSlice) {
//        log("should_flatten_layer:true - isSlice")
      return true;
    }
  }
  catch (e) {
    //log(e)
  }
  try {
    var isSlice = [[[layer exportOptionsGeneric] exportFormats] count];
    if (isSlice) {
//        log("should_flatten_layer:true - isSlice")
      return true;
    }
  }
  catch (e) {
    //log(e)
  } 
  return false
}

var hasNestedSingleSublayer = function(layer) {
  if (layer == undefined) {
    return false
  }
  var sublayers = [layer layers];
  if (sublayers == undefined) {
    return false
  }
  if ([sublayers count] == 0) {
    return true
  }
  if ([sublayers count] == 1) {
    return hasNestedSingleSublayer([sublayers objectAtIndex:0])
  }
  return false
}
