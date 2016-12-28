
var export_layer = function(layer, artboard, containerMetaData) {

  var layerData = nil;
  var should_flatten = should_flatten_layer(layer);

  if ([layer class] == MSTextLayer && !should_flatten) {
    layerData = textLayerData(layer, artboard, containerMetaData);
  }
  else if (!should_flatten) {
    layerData = simpleViewLayerData(layer, artboard, containerMetaData)
  }

  if (layerData != nil) {
    return layerData
  }

  var image_name = validImageName(artboard.name() + "_" + [layer name], 0);
  var pathToFile = assetsDirectory + "/" + image_name;

  return duplicate_and_process_layer(layer, function(layer_copy) {
    
    var layer_data = metadataFor(layer, layer_copy, artboard, containerMetaData);
    layer_data.model_class = "ADModelImageView";
    layer_data.color = clear_color_data;
    layer_data["imageName"] = image_name
    layer_data["imageMode"] = 3
    layer_data["userChangedViewName"] = 1
    layer_data["sketch_original_class"] = [layer className]
    var useJPG = is_bitmap_with_no_alpha(layer)
    exportAsSlice(layer_copy, pathToFile, useJPG)

    return layer_data;
  });

  // Making round coordinates if exporting as a slice
  //   var clone = [layer duplicate];
  // var newGroup = [[MSLayerGroup alloc] initWithFrame:NSMakeRect(0, 0, layer.frame().width(), layer.frame().height())];
  // newGroup.name = clone.name();
  // [clone removeFromParent];
  // [[layer parentGroup] addLayers:[newGroup]];
  // [newGroup addLayers:[clone]]; 
  // [newGroup resizeToFitChildrenWithOption:0];
  // [[newGroup parentGroup] resizeToFitChildrenWithOption:0];

  // layerData = metadataFor(newGroup, newGroup, artboard);
  // layerData.model_class = "ADModelImageView";
  // layerData.color = clear_color_data;
  // layerData["imageName"] = image_name
  // layerData["imageMode"] = 2
  // layerData["userChangedViewName"] = 1
  // layerData["sketch_original_class"] = [layer className]
  // var useJPG = is_bitmap_with_no_alpha(layer)
  // exportAsSlice(newGroup, pathToFile, useJPG)

  // [newGroup removeFromParent];

}

//Original x,y or less, height & width extended if required
var export_rect = function(layer) {
  var res = [[layer absoluteRect] rect];
  var trimmed = [MSSliceTrimming trimmedRectForLayerAncestry:[MSImmutableLayerAncestry ancestryWithMSLayer:layer]];  
  var width = res.size.width;
  var height = res.size.height;
  if (trimmed.size.width + trimmed.origin.x > res.size.width + res.origin.x) {
    width = trimmed.size.width + MAX(0, trimmed.origin.x - res.origin.x);
  }
  if (trimmed.size.height + trimmed.origin.y > res.size.height + res.origin.y) {
    height = trimmed.size.height + MAX(0, trimmed.origin.y - res.origin.y);
  }
  return CGRectMake(MIN(res.origin.x, trimmed.origin.x), MIN(res.origin.y, trimmed.origin.y), width, height);
}

var exportAsSlice = function(layer, path, useJPG) {
    var ext = ".png";
    if (useJPG == true) {
        ext = ".jpg"
    }
    
    if (useJPG) {
        //Only @1x for bitmaps
        var slice = [MSExportRequest new];//[MSExportRequest requestWithRect:export_rect(layer) scale:export_scale_factor];
        slice.rect = export_rect(layer);
        slice.scale = export_scale_factor;
        slice.shouldTrim = false;
        slice.saveForWeb = true;
        [doc saveArtboardOrSlice:slice toFile:path + ext];
        return
    }
    
    var slice = [MSExportRequest new];//[var slice = [MSExportRequest requestWithRect:export_rect(layer) scale:export_scale_factor*2];
    slice.rect = export_rect(layer);
    slice.scale = export_scale_factor * 2;
    slice.shouldTrim = false;
    slice.saveForWeb = true;
    [doc saveArtboardOrSlice:slice toFile:path+ "@2x" + ext];
    
    //slice = [MSExportRequest requestWithRect:export_rect(layer) scale:export_scale_factor*3];
    //[doc saveArtboardOrSlice:slice toFile:path+ "@3x" + ext];
}

//
// Export rectangle
//
var simpleViewLayerData = function(layer, artboard, containerMetaData) {
    
    var style = layer.style ? layer.style() : [[MSStyle alloc] init];
    
    var layerData = metadataFor(layer, layer, artboard, containerMetaData)
    layerData.color = clear_color_data
    
    var enabledBorders = enabled_style([style borders]);
    var enabledFills = enabled_style([style fills]);
    var enabledShadows = enabled_style([style shadows])
    
    if (layer.hasClippingMask()) {
        //      log("simpleViewLayerData:nil - hasClippingMask")
        return nil
    }
    
    // multiple borders, or shadows
    if (enabledBorders.length > 1 || enabledShadows.length > 0) {
        //      log("simpleViewLayerData:nil - enabledBorders | enabledShadows")
        return nil;
    }
    
    // Unsupported border options
    if ([style startDecorationType] != 0 || [style endDecorationType] != 0 || [[style borderOptions] hasDashPattern]) {
        //      log("simpleViewLayerData:nil - Unsupported border options")
        return nil;
    }
    
    if ([[style blur] isEnabled]) {
        return nil
    }
    
    // Multiple fills, or inneshadow
    if (enabledFills.length > 1 || (enabled_style([style innerShadows]).length > 0)) {
        //      log("simpleViewLayerData:nil - Multiple fills, or inneshadow")
        return nil;
    }
    
    if ([layer isMemberOfClass:[MSShapeGroup class]]) {
        var paths = [layer layers];
        if ([paths count] != 1) {
            //        log("simpleViewLayerData:nil - MSShapeGroup")
            return nil;
        }
        
        var shape = [paths firstObject];
        
        if ([shape edited]) {
            //        log("simpleViewLayerData:nil - edited")
            return nil;
        }
        
        if ([shape isMemberOfClass:[MSRectangleShape class]]) {
            // Multiple corner radius
            if ([[shape cornerRadiusString] containsString:"/"]) {
                //          log("simpleViewLayerData:nil - Multiple corner radius")
                return nil;
            }
            else {
                layerData.cornersRadius = [shape cornerRadiusFloat] * export_scale_factor;
                layerData.cornersRadius = Math.min(layerData.cornersRadius, Math.min(layerData.width, layerData.height)/2)
            }
        }
        else if ([shape isMemberOfClass:[MSOvalShape class]]) {
            var frame = [shape frame]
            if (enabledBorders.length > 0) {
                //          log("simpleViewLayerData:nil - MSOvalShape & enabledBorders")
                return nil
            }
            else if (Math.abs([frame width] - [frame height] < 1)) {
                layerData.cornersRadius = layerData.width/2;
            }
            else {
                //          log("simpleViewLayerData:nil - MSOvalShape & not circle")
                return nil
            }
        }
        else if ([shape isMemberOfClass:[MSShapePathLayer class]]) {
            //       log("simpleViewLayerData:nil - is path");
            //      line come here like other paths...
            return nil;
        }
        else {
            //        log("simpleViewLayerData:nil - vector shape/s");
            return nil;
        }
        
        if (enabledFills.length == 1) {
            var firstFill = enabledFills[0];
            if ([firstFill fillType] == 0) {
                layerData.color = color_data([firstFill colorGeneric])
            }
            else {
                //          log("simpleViewLayerData:nil - multiple/complex fills");
                return nil
            }
        }
    }
    else {
        //      log("simpleViewLayerData:nil - Not a shape");
        return nil;
    }
    
    if (enabledBorders.length == 1) {
        var border = enabledBorders[0]
        if ([border fillType] == 0) {
            layerData.borderColor = color_data([border colorGeneric])
            layerData.borderWidth = [border thickness] * export_scale_factor
        }
    }
    
    layerData.model_class = "ADModelView"
    return layerData
    
}

var artboardBackground = function(artboard)  {
    
    if ([artboard hasBackgroundColor] && [artboard includeBackgroundColorInExport]) {
        var ar = [artboard absoluteRect];
        return {
        x: 0,
        y: 0,
        width: ar.width()  * export_scale_factor,
        height: ar.height() * export_scale_factor,
            "sketch_id": artboard.objectID() + "-BG",
            viewName : "Background",
        color:color_data([artboard backgroundColorGeneric]),
        locked: 1,
        model_class: "ADModelView"
        };
    }
    else {
        return nil
    }
}

var enabled_style = function(styleCollection) {
    var arr = Array.fromNSArray(styleCollection)
    return arr.filter(function(style) { return style.isEnabled()})
}



var metadataFor = function(layer, layerCopy, artboard, containerMeta) {
    
    // We'll remove rotation
    var clone = [layer duplicate];
    add_global_clone(clone);
    
    var anima_class = anima_model_class(layer);
    var should_use_sketch_frame = (anima_class != nil && anima_class != undefined && anima_class != "ADModelImageView")
    
    try {
        
        clone.setRotation(0)
        remove_group_effects(clone)
        
        var frame_in_container   = clone.frame();
        var absolute_frame       = [MSRect rectWithRect:[clone convertRectToAbsoluteCoordinates:clone.bounds()]];
        
        [clone removeFromParent];
        [[doc currentPage] addLayers: [clone]];
        clone.setFrame(absolute_frame);
        var absolute_export_rect = [MSRect rectWithRect:export_rect(clone)];
        
        // Original frame in container ignores out of bounds
        var used_abs_rect = should_use_sketch_frame ? absolute_frame : absolute_export_rect;
        var final_frame_in_container = [MSRect rectWithRect:CGRectMake(used_abs_rect.x() - containerMeta.absolute_export_x,
                                                                       used_abs_rect.y() - containerMeta.absolute_export_y,
                                                                       used_abs_rect.width(),
                                                                       used_abs_rect.height()
                                                                       )];
        [clone removeFromParent];
        
        // log("[layerData] name: " + [layer name])
        //   log("[layerData] treeAsDictionary: " + [layer treeAsDictionary])
        //  log("[layerData] absolute_frame: " + absolute_frame)
        //  log("[layerData] absolute_export_rect: " + absolute_export_rect)
        //  log("[layerData] frame_in_container: " + frame_in_container)
        //  log("[layerData] absTopLeftBeforePadding: " + JSON.stringify(absTopLeftBeforePadding))
        
        var rotation = layer.rotation();
        if ([layer isMemberOfClass:[MSShapeGroup class]] && [[layer layers] count] == 1) {
            rotation = -rotation;
        }
        
        var topLeft = {
        x: final_frame_in_container.x(),
        y: final_frame_in_container.y(),
        }
        var size = {
        width: final_frame_in_container.width(),
        height: final_frame_in_container.height()
        }
        
        var res = {
        x: (topLeft.x * export_scale_factor),
        y: (topLeft.y * export_scale_factor),
        width: size.width  * export_scale_factor,
        height: size.height * export_scale_factor,
        rotation: rotation,
        alpha: layer.style ? layer.style().contextSettings().opacity() : 1,
        sketch_id: layer.objectID(),
        viewName : [layer name],
        locked: [layer isLocked],
            // Data for nested views
        absolute_export_x: absolute_export_rect.x(),
        absolute_export_y: absolute_export_rect.y()
        };
        
        var anima_class = anima_model_class(layer);
        res = add_model_class_properties(res, layer);
        
        // animaBreakPoint(function (x) { return eval(x); });
        // log("[layerMeta] name: " + [layer name])  ;
        //  log("[layerMeta] res: " + JSON.stringify(res));
        //   log("[layerMeta] containerMeta: " + JSON.stringify(containerMeta));
        return res
        
    }
    catch (e) {
        // Make sure to remove cloned layer
        try { [clone removeFromParent]; } catch (e) {}
        remove_global_clone(clone);
        alert("Something went wrong in anima plugin - layer metadata", e.message)
        throw e
    }
}

var remove_group_effects = function(layer) {
    if (!is_group(layer)) {
        return
    }
    
    var style = layer.style ? layer.style() : [[MSStyle alloc] init];
    var enabledShadows = enabled_style([style shadows])
    for (var shadow in enabledShadows) {
        // log([layer name] + " - Has shadow")
        layer.setStyle([[MSStyle alloc] init])
    }
}

var export_mask_layer = function(layer, mask_index, artboard, containerMetaData) {
    
    return duplicate_and_process_layer(layer, function(layerCopy) {
                                       
                                       var sublayers = [layerCopy layers]
                                       var mask_layer = [sublayers objectAtIndex:mask_index];
                                       
                                       // Hide layers below mask layer
                                       var toBeHidden = []
                                       for (var i = 0; i < mask_index; ++i) {
                                       var l = [sublayers objectAtIndex:i];
                                       if ([l isVisible] != 0) {
                                       toBeHidden.push(l);
                                       }
                                       }
                                       for (var i = 0; i < toBeHidden.length; ++i) {
                                       toBeHidden[i].setIsVisible(0);
                                       }
                                       
                                       layerData = metadataFor(layer, layerCopy, artboard, containerMetaData);
                                       layerData.model_class = "ADModelImageView";
                                       layerData.color = clear_color_data;
                                       layerData["sketch_id"] = layer.objectID();
                                       
                                       var image_name = validImageName(artboard.name() + " " + [layer name], 0);
                                       var pathToFile = assetsDirectory + "/" + image_name;
                                       
                                       var useJPG = false;
                                       exportAsSlice(layerCopy, pathToFile, useJPG)
                                       
                                       for (var i = 0; i < toBeHidden.length; ++i) {
                                       toBeHidden[i].setIsVisible(1);
                                       }
                                       
                                       layerData["imageName"] = image_name
                                       layerData["imageMode"] = 3
                                       layerData["userChangedViewName"] = 1
                                       layerData["sketch_original_class"] = [layer className]
                                       return layerData
                                       
                                       })
    
}

//
// process layer
//
var process_layer = function(layer, artboard, containerMetaData) {
    var layerData;
    
    // Ignore hidden layers, slices, native alerts
    if (is_native_view_to_ignore(layer) || [layer isVisible] == 0 || should_ignore_layer(layer) || is_slice(layer)) {
        return nil
    }
    
    if (is_status_bar(layer)) {
        current_screen_has_status = true;
        current_screen_has_white_status = is_white_status_bar(layer);
        return nil;
    }
    
    var processing_symbol = false
    if (is_symbol_instance(layer)) {
        var properties = anima_model_class_properties(layer);
        layer = [[layer duplicate] detachByReplacingWithGroup];
        if (properties != nil && properties != undefined) {
            anima_model_class_set_properties(layer, properties);
        }
        add_global_clone(layer);
        [layer resizeToFitChildrenWithOption:0];
        processing_symbol = true
    }
    
    layerData = metadataFor(layer, layer, artboard, containerMetaData);
    
    if (has_simple_anima_model_class(layer)) {
        layerData = process_simple_anima_model_class(layer, layerData);
    }
    else if (is_table(layer)) {
        layerData = process_table(layer, layerData, containerMetaData, artboard);
    }
    else if (is_group(layer) &&
             should_flatten_layer(layer) == false &&
             layer.rotation() == 0) {
        [layer resizeToFitChildrenWithOption:0];
        
        var clone = [layer duplicate];
        add_global_clone(clone);
        remove_group_effects(clone)
        
        var sublayers = [clone layers]; //clone sublayers has no additional effects
        var layers_holder = []
        
        // Sketch returns sublayers in reverse, so we'll iterate backwards
        for (var sub= 0; sub < [sublayers count] ; sub++) {
            var current = [sublayers objectAtIndex:sub];
            
            var clipping = current.hasClippingMask()
            
            if (is_mask_group(current) || clipping) {
                if ([current isVisible] == 0) {
                    continue
                }
                
                if (clipping) {
                    // Export all masked layers - here and below as a signle image, full size of the group, origin zero
                    var d = export_mask_layer(clone, sub, artboard, layerData)
                }
                else {
                    var d = export_mask_layer(current, 0, artboard, layerData)
                }
                
                if (d != undefined) {
                    layers_holder.push(d)
                }
                if (clipping) {
                    break
                }
            }
            else {
                var d = process_layer(current, artboard, layerData)
                if (d != undefined) {
                    layers_holder.push(d);
                }
            }
        }
        
        [clone removeFromParent];
        remove_global_clone(clone);
        
        layerData.model_class = "ADModelView"
        layerData.color = clear_color_data
        layerData["sketch_id"] = layer.objectID()
        layerData.subviews = layers_holder;
        
    }
    else {
        var e = export_layer(layer, artboard, containerMetaData);
        if (e != undefined) {
            layerData = e;
        }
    }
    
    if (processing_symbol) {
        [layer removeFromParent]
        remove_global_clone(layer);
    }
    
    return layerData;
}

var duplicate_and_process_layer = function(layer, callback) {
    
    // Copy off-screen, out of artboard so it is not masked by artboard
    var clone = [layer duplicate];
    add_global_clone(clone);
    
    try {
        
        var originalOpacity = layer.style ? layer.style().contextSettings().opacity() : 1;
        if (originalOpacity != 1 && clone.style) {
            clone.style().contextSettings().setOpacity(1)
        }
        clone.setRotation(0)
        [clone removeFromParent];
        [[doc currentPage] addLayers: [clone]];
        var frame = [clone frame];
        [frame setX: export_offset];
        [frame setY: export_offset];
        
        var result = callback(clone)
        
        if (clone.style && originalOpacity != clone.style().contextSettings().opacity()) {
            clone.style().contextSettings().setOpacity(originalOpacity)
        }
        
        [clone removeFromParent];
        
        return result
    }
    catch (e) {
        // Make sure to remove cloned layer
        try { [clone removeFromParent]; } catch (e) {}
        remove_global_clone(clone);
        alert("Something went wrong in anima plugin", e.message)
        throw e
    }
}

var processArtboard = function(artboard) {
    var absolute_rect = artboard.absoluteRect()
    
    export_scale_factor = [APExport scaleFactorForArtboard:artboard allowCustom:true];
    log("export_scale_factor for " + artboard.name + " is: " + export_scale_factor);
    
    generate_artboard_thumb(artboard);

    var layerData = {
        'sketch_id':artboard.objectID(),
        'modelID':artboard.objectID(),
        'name':artboard.name(),
        'x':(absolute_rect.x()) * export_scale_factor,
        'y':(absolute_rect.y()) * export_scale_factor,
        'width':(absolute_rect.width()) * export_scale_factor,
        'height':(absolute_rect.height()) * export_scale_factor,
        'model_class':'ADModelScreen',
        'viewName' : artboard.name(),
    absolute_export_x: absolute_rect.x(),
    absolute_export_y: absolute_rect.y()
    }
    
    current_screen_has_status = false
    current_screen_has_white_status = false
    
    var layers_metadata = Array.fromNSArray([artboard layers])
    .map(function(layer)   { return process_layer(layer, artboard, layerData)    })
    .filter(function(elem) { return elem != undefined && elem != nil  })
    layerData.subviews = layers_metadata;
    
    layerData.color = white_color_data
    if ([artboard hasBackgroundColor] && [artboard includeBackgroundColorInExport]) {
        layerData.color = color_data([artboard backgroundColorGeneric]);
    }
    
    layerData.statusBarType = 1; //None
    if (current_screen_has_white_status) {
        layerData.statusBarType = 3; //White
    }
    else if (current_screen_has_status) {
        layerData.statusBarType = 0; //Black
    }  
    
    return layerData;
};

var process_simple_anima_model_class = function(layer, layerData) {
    var anima_class = anima_model_class(layer);
    layerData["model_class"] = anima_class;
    
    //Special cases
    if (anima_class == "ADModelSwitchView") {
        layerData.width = 51;
        layerData.height = 31;
    }
    else if (anima_class == "ADModelSliderView") {
        layerData.height = 31; 
        layerData.width = Math.max(50, layerData.width);
    }
    else if (anima_class == "ADModelProgressView") {
        layerData.height = 2; 
        layerData.width = Math.max(2, layerData.width);
    }
    
    return layerData;
};

// Table

var calc_cell_bottom_spacing = function(current, next) {
    if (next == null) {
        return 0;
    }
    var space = next.frame().y() - current.frame().y() - current.frame().height();
    space *= export_scale_factor;
    space = space < 0 ? 0 : space;
    return space;
}

var process_table = function(layer, layerData, containerMetaData, artboard) {  
    [layer resizeToFitChildrenWithOption:0];
    var clone = [layer duplicate];
    add_global_clone(clone);
    
    remove_group_effects(clone)
    
    var sublayers = [clone layers]; //clone sublayers has no additional effects
    var cells = []
    
    sublayers.sort(function(a, b) { return a.frame().y()-b.frame().y() });
    
    var top_spacing = 0;
    for (var sub = 0; sub < [sublayers count] ; sub++) {
        var current = [sublayers objectAtIndex:sub];
        var next    = (sub+1 < [sublayers count] ? [sublayers objectAtIndex:sub+1] : null);
        var bottom_spacing = calc_cell_bottom_spacing(current, next) / 2.0;
        var cell_content   = process_layer(current, artboard, layerData)
        
        if (cell_content == undefined) {
            top_spacing = 0;
            continue;
        }
        cell_content.y = top_spacing;
        cell_content.height += bottom_spacing;
        
        var cell = {
        x:0,
        y:0,
        subviews:[cell_content],
        height:cell_content.height + top_spacing,
        width:layerData.width,        
            "sketch_id": cell_content.sketch_id + "-Cell",
            viewName : cell_content.viewName + (cell_content.viewName.toLowerCase().includes("cell") ? "" : " Cell"),
            userChangedViewName : 1,
        locked: cell_content.locked,
        model_class: "ADModelCellView",      
        color: clear_color_data,
        absolute_export_x: cell_content.absolute_export_x,
        absolute_export_y: cell_content.absolute_export_y,      
        }
        cells.push(cell);
        top_spacing = bottom_spacing; //For next cell    
    }
    
    [clone removeFromParent];
    remove_global_clone(clone);
    
    //Don't exceed container
    layerData.height = Math.min(layerData.height, containerMetaData.height - layerData.y)
    layerData.height = Math.max(layerData.height, 20)
    
    layerData.model_class = "ADModelTableView"
    layerData.hasSeperator = false
    layerData.color = clear_color_data  
    layerData.cells = cells;
    
    return layerData;
}

var export_thumb = function(layer, maxSize, pathToFile) {
  var slice = [MSExportRequest new];//[var slice = [MSExportRequest requestWithRect:export_rect(layer) scale:export_scale_factor*2];
  var rect = export_rect(layer);
  slice.rect = rect;  
  slice.scale = maxSize / Math.max(rect.size.width, rect.size.height);
  slice.shouldTrim = false;
  slice.saveForWeb = true;
  [doc saveArtboardOrSlice:slice toFile:pathToFile];
}

var generate_page_thumb = function() {  
  var page = doc.currentPage();
  var pathToFile = exportDirectory + "/" + "thumbs/page.png";
  export_thumb(page, 1000, pathToFile)
}

var generate_artboard_thumb = function(artboard) {
  var pathToFile = exportDirectory + "/" + "thumbs/" + [artboard name] + ".jpg";
  export_thumb(artboard, 667, pathToFile)
}

var generate_thumb = function(layer) {
  var pathToFile = exportDirectory + "/" + "thumb.jpg";
  export_thumb(layer, 400, pathToFile)
}

var fidelityArtboardScreenshotCount = 0;

var createFidelityArtboard = function(artboard, processedArtboard) {
  var imageName = "fidelity " + fidelityArtboardScreenshotCount + " " + [artboard name];
  var pathToFile = assetsDirectory + "/" + imageName  + ".jpg";
  export_thumb(artboard, Math.max(artboard.frame.width, artboard.frame.height), pathToFile);

  var layerData = {
    'sketch_id':artboard.objectID() + "fidelity",
    'name':artboard.name() + " fidelity",
    'x':processedArtboard.x,
    'y':processedArtboard.y,
    'width':processedArtboard.width,
    'height':processedArtboard.height,
    'model_class':'ADModelScreen',
    'viewName' : artboard.name() + " fidelity",
    'statusBarType': 1,
    'subviews' : [
                  {
                    model_class : "ADModelImageView",
                    imageName : imageName,
                    imageMode: 3,
                    x: 0,
                    y: 0,
                    width:processedArtboard.width,
                    height:processedArtboard.height,
                    viewName : artboard.name() + " fidelity"
                  } ]
  }  
  return layerData;
}

var add_model_class_properties = function(metaData, layer) {
  var properties = anima_model_class_properties(layer);
  if (properties == nil || properties == undefined) {
    return metaData;
  }
//  log("anima_model_class_properties:" + properties)
  for (var key in properties) {
//    log("assign property:" + key)
    metaData[key] = properties[key];
  }
  return metaData;
}
