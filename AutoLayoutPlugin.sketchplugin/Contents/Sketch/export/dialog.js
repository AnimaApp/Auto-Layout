

var createLabel = function(text, rect, alignment) {
  var label = [[NSTextField alloc] initWithFrame:rect]
  label.stringValue = text
  label.editable = false
  label.borderd = false
  label.bezeled = false
  if (alignment) {
    label.setAlignment(alignment)
  }
  else {
    label.setAlignment(1)
  }
  label.useSingleLineMode = true
  label.drawsBackground = false
  [label setFont:[NSFont systemFontOfSize:[NSFont smallSystemFontSize]]]
  return label
}

var showAlert = function(message, informativeText, progressView) {

  var alert = [[NSAlert alloc] init];
  [alert setMessageText:message];
  [alert addButtonWithTitle:"Dismiss"];
  if (informativeText != undefined) {
    [alert setInformativeText:informativeText]
  }
  if (progressView) {
    [alert setAccessoryView:progressView]
  }
  [alert runModal]
};

var Dialog = function() {}

Dialog.prototype.runModal = function(msg, artboard, selectedCount, iOSUnsupportedFonts) {

  this.artboard = artboard

  var suggestedScaleFactor = 2.0
  this.isLandscape = false

  var r = this.artboard.absoluteRect()
  this.initialSize = {width:r.width(), height:r.height()}

  var resolutionLabel = createLabel("Scale", NSMakeRect(16, 122, 94, 17))
  var combobox = [[NSComboBox alloc] initWithFrame:NSMakeRect(118, 116, 165, 26)];

  this.combobox = combobox
  var dialog = this

  var delegate = new MochaJSDelegate({
    "controlTextDidChange:":(function(note) {
      dialog.updateSizeTextField()
    }),
      "comboBoxSelectionIsChanging:": (function(note){
      dialog.updateSizeTextField()
      })
  });

  var obj = this;
  var menuItemCallback = function(item) {
    var tmpl = item.representedObject()
    var w = tmpl["width"]
    var h = tmpl["height"]
    if (w != 0 && h != 0) {
      var scale = parseFloat([combobox stringValue].replace(/[^0-9]/g,"")) / 100;
      obj.initialSize.width = w / scale
      obj.initialSize.height = h / scale
      obj.isLandscape = w > h ? true : false
      obj.updateSizeTextField()
    }
  }

  [combobox setDelegate:delegate.getClassInstance()];
  [combobox addItemsWithObjectValues:["50%", "100%", "150%", "200%", "300%"]];

  var setInitialSize = false
  var pixelDensity = 1.0

  var deviceLabel = createLabel("Artboards Screen Size", NSMakeRect(0, 35, 125, 17))
  [deviceLabel setAlignment:0]
  var dropdown = [[NSPopUpButton alloc] initWithFrame:NSMakeRect(130, 30, 167, 26)]
  for (index in screenTemplate) {
    var category = screenTemplate[index]
    [[dropdown menu] addItemWithTitle:category["category"] action: "" keyEquivalent: ""]

    for (var i in category["templates"]) {
      var tmpl = category["templates"][i]
      var item = [[NSMenuItem alloc] initWithTitle:tmpl["name"] action: "didChooseTempalte" keyEquivalent: ""]
      item.indentationLevel = 1
      item.representedObject = tmpl
      [item setCOSJSTargetFunction:menuItemCallback]
      [[dropdown menu] addItem:item];

      if (setInitialSize == false) {
        var width = tmpl["width"]
        var height = tmpl["height"]

        if (r.width() == width || r.width() * 2 == width || r.width() * 3 == width ) {
          [dropdown selectItem:item]
          suggestedScaleFactor = width / r.width()
          pixelDensity = tmpl["scale"] / suggestedScaleFactor
          this.initialSize = {width:(width / suggestedScaleFactor), height:(height / suggestedScaleFactor)}
          setInitialSize = true
        }
        if (r.width() == height || r.width() * 2 == height || r.width() * 3 == height)  {
          this.isLandscape = true
          [dropdown selectItem:item]
          suggestedScaleFactor = height / r.width()
          this.initialSize = {width:(width / suggestedScaleFactor), height:(height / suggestedScaleFactor)}
          pixelDensity = tmpl["scale"] / suggestedScaleFactor
          setInitialSize = true
        }
      }
    }
  }

  // When size isn't standart
  if (setInitialSize == false) {
    [dropdown selectItemAtIndex:1];
    pixelDensity = MAX(1, Math.floor(r.width()/375));
  }

  var artboardsCheckBox = [[NSButton alloc] initWithFrame:CGRectMake(0, 50, 250, 18)]
  [artboardsCheckBox setButtonType:NSSwitchButton];
  [artboardsCheckBox setState:false];
  [artboardsCheckBox setTitle:"Selected Artboards Only"];
  if (selectedCount == 0) {
    [artboardsCheckBox setEnabled:false];
  }
  else {
    [artboardsCheckBox setState:true];
  }

  var flattenCheckBox = [[NSButton alloc] initWithFrame:CGRectMake(0, 25, 250, 18)]
  [flattenCheckBox setButtonType:NSSwitchButton];
  [flattenCheckBox setState:true];
  [flattenCheckBox setTitle:"Flatten 'Exportable' Groups & Layers"];  
  [flattenCheckBox setEnabled:true];

//  var flattenMissingFontsCheckBox = [[NSButton alloc] initWithFrame:CGRectMake(0, 0, 450, 18)]
//  [flattenMissingFontsCheckBox setButtonType:NSSwitchButton];
//  [flattenMissingFontsCheckBox setState:true];
//  var fontsList = iOSUnsupportedFonts.join();
//  if (fontsList.length > 40) {
//    fontsList = fontsList.substring(0, 40) + "...";
//  }
//  [flattenMissingFontsCheckBox setTitle:"Non-iOS Fonts as Images (" + fontsList + ")"];
//  [flattenMissingFontsCheckBox setEnabled:true];
//  if (iOSUnsupportedFonts.length > 0) {
//    [view addSubview:flattenMissingFontsCheckBox]
//  }

  var scaleFactorIndex = 1;
  if (suggestedScaleFactor > 1) {
    var index = parseInt(suggestedScaleFactor);
    var scaleFactorIndexs = [1, 1, 3, 4];
    if (index < 4) {
      scaleFactorIndex = scaleFactorIndexs[index];
    }
  }
  [combobox selectItemAtIndex:scaleFactorIndex];
  this.scaleFactor = parseFloat([combobox stringValue].replace(/[^0-9]/g,"")) / 100;

  this.widthField = [[NSTextField alloc] initWithFrame:CGRectMake(118, 39, 75, 22)]
  this.heightField = [[NSTextField alloc] initWithFrame:CGRectMake(205, 39, 75, 22)]
  this.updateSizeTextField()

  var view = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, 450, 70)]

  // TODO: Show if couldn't recognize device resolution
  // [view addSubview:deviceLabel]
  // [view addSubview:dropdown]

  [view addSubview:artboardsCheckBox]
  [view addSubview:flattenCheckBox]
  

  var alert = [[NSAlert alloc] init];
  [alert setMessageText:msg];
  [alert addButtonWithTitle:'Send'];
  [alert addButtonWithTitle:'Cancel'];
  [alert setAccessoryView:view];

  var responseCode = [alert runModal];

  var scale = parseFloat([combobox stringValue].replace(/[^0-9]/g,"")) / 100;
  var deviceType = [dropdown indexOfSelectedItem]
  var selectedOnly = [artboardsCheckBox state];

  resolution = {"width":this.widthField.doubleValue(), "height":this.heightField.doubleValue()}  
  
  var res = {
          responseCode:responseCode, 
          scale:scale,
          resolution:resolution,
          pixelDensity:pixelDensity,
          selectedOnly:selectedOnly,
          flattenExportables:[flattenCheckBox state],
          //flattenMissingFonts:[flattenMissingFontsCheckBox state],
          standardSize:setInitialSize
        };

  log("Dialog selections: " + JSON.stringify(res));

  return res;

}

Dialog.prototype.updateSizeTextField = function() {}

