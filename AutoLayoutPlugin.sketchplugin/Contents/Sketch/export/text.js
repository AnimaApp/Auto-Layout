// Anima Label

var MSAttributedStringTextTransformAttributeUppercase = 1;
var MSAttributedStringTextTransformAttributeLowercase = 2;

var ADAlignmentCenter = 0;
var ADAlignmentRight = 1;
var ADAlignmentLeft = 2;

var alignmentMapping = function(alignment) {
    if (alignment == 1) {
        return ADAlignmentRight;
    }
    else if (alignment == 2) {
        return ADAlignmentCenter;
    }
    else { //Left or both
        return ADAlignmentLeft;
    }
}

var isAlignmentRight = function(alignment) {
    return alignment == 1;
}

var isAlignmentCenter = function(alignment) {
    return alignment == 2;
}

var textLayerData = function(layer, artboard, containerMetaData) {
    var anima_class = anima_model_class(layer);
    if ([layer class] != MSTextLayer) {
        return nil;
    }
    
    var layerData = metadataFor(layer, layer, artboard, containerMetaData)
    var fontSize = layer.fontSize();
    var fontPostscriptName = layer.fontPostscriptName() + ""
    fontPostscriptName = fixSFUIFontName(fontPostscriptName);
    
    var isSupportedFont = iOSNativeFonts.indexOf(fontPostscriptName) != -1;
    var font = nsfontForName(fontPostscriptName, fontSize);
    if (font == nil) {
        log("[textLayerData] Missing font '" + fontPostscriptName + "', using system");
        fontPostscriptName = "System";
    }
    //if (!isSupportedFont && flattenMissingFonts) {
    //log("[textLayerData] Flatting unsupported Font: '" + fontPostscriptName + "'");
    //return nil;
    //}
    
//     log("[textLayerData] layer:" + [layer name]);
    // log("[textLayerData] treeAsDictionary:" + layer.treeAsDictionary());
    // log("[textLayerData] lineHeight:" + [layer lineHeight]);
    // log("[textLayerData] kerning:" + [layer kerning]);
    // log("[textLayerData] minimumLineHeight " + [[layer paragraphStyle] minimumLineHeight]);
    // log("[textLayerData] maximumLineHeight " + [[layer paragraphStyle] maximumLineHeight]);
    // log("[textLayerData] paragraphSpacing " + [[layer paragraphStyle] paragraphSpacing]);
    // log("[textLayerData] baseLineHeight:" + [layer defaultLineHeightValue:nil]);
    
    var defaultLineHeightForFont = defaultLineHeight(fontPostscriptName, fontSize)
    // log("[textLayerData] defaultLineHeightForFont:" + [font defaultLineHeightForFont]);
    
    layerData.model_class = "ADModelLabel"
    if (anima_class == "ADModelTextView") {
        layerData.model_class = "ADModelTextView"
        layerData[kTextIsPasswordField] = anima_model_property(layer, kTextIsPasswordField)
        layerData[kTextNativeBgField] = false
        
        // Min height for input
        var heightBefore = layerData.height
        layerData.height = Math.max(Math.ceil(30 / export_scale_factor), layerData.height)
        if (heightBefore < layerData.height) {
            layerData.y -= Math.ceil((layerData.height - heightBefore)/2.0)
        }
    }
    
    layerData.font = fontPostscriptName
    layerData.textSize = Math.ceil(fontSize * export_scale_factor);
    layerData.textColor = color_data(layer.textColor())
    layerData.kern = [layer kerning] * export_scale_factor
    
    var lineHeight = Math.max(defaultLineHeightForFont, [layer lineHeight]) + [[layer paragraphStyle] paragraphSpacing]
    layerData.lineHeight = lineHeight * export_scale_factor;
    
    layerData.text = layer.stringValue()
    if (layer.styleAttributes().MSAttributedStringTextTransformAttribute == MSAttributedStringTextTransformAttributeUppercase) {
        layerData.text = layerData.text.toUpperCase();
    }
    else if (layer.styleAttributes().MSAttributedStringTextTransformAttribute == MSAttributedStringTextTransformAttributeLowercase) {
        layerData.text.toLowerCase();
    }
    
    
    // layerData.pSpacing = [[layer paragraphStyle] paragraphSpacing] * export_scale_factor
    layerData.alignment = alignmentMapping(layer.textAlignment())
    layerData.color = clear_color_data
    //if (defaultLineHeightForFont > 0) {
    //var yCorrection = (-1 + (lineHeight - defaultLineHeightForFont)/2.0);
    //var hCorrection = (lineHeight - defaultLineHeightForFont);
    //layerData.y -= yCorrection * export_scale_factor;
    //layerData.height += hCorrection * export_scale_factor;
    //}
    
    if (layerData.height < layerData.textSize) {
        var labelHeightCorrection = layerData.textSize - layerData.height;
        layerData.y -= labelHeightCorrection;
        layerData.height = layerData.textSize;
    }
    
    layerData.width = layer.frame().width() * export_scale_factor;
    
    layerData.width += 2; // otherwise the text is trimmed
    if (layerData.alignment == ADAlignmentRight) {
        layerData.x -= 2;
    }
    if (layerData.alignment == ADAlignmentCenter) {
        layerData.x -= 1;
    }
    
    
    //layerData.isAutoWidth = (layer.textBehaviour() == 0);
    
    if (layer.textBehaviour() == 0) { // Auto Width
        if (layerData.kern) {
            layerData.width += layerData.kern;
        }
    }
    else if (layer.textBehaviour() == 1) { // Fixed Width
        
        var clone = [layer duplicate];
        log(layer.logProperties())
        var fixedWidth  = layer.frame().width() * export_scale_factor;
        var fixedHeight = layer.frame().height() * export_scale_factor;
        clone.textBehaviour = 0;
        [clone setStringValue:clone.stringValue()];
        var autoWidth = clone.frame().width() * export_scale_factor;
        var autoHeight = clone.frame().height() * export_scale_factor;
        var letterSpacing = layerData.kern ? layerData.kern : 0;
//        log("[textLayerData] fixedWidth " + fixedWidth +" autoWidth " + autoWidth)
        var finalWidth = fixedWidth + letterSpacing;
        if (autoWidth < fixedWidth + (2 * letterSpacing)) {
            finalWidth = Math.max(autoWidth, finalWidth)
        }
        layerData.width = finalWidth;
        
        if (layerData.alignment == 0) { // center
            var diff = layerData.width - fixedWidth;
            layerData.x -= (diff/2);
            layerData.x += 1;
        }
        
        [clone removeFromParent];
    }
    
    if (layerData.lineHeight == 0) {
        if (1 <= layerData.textSize && layerData.textSize <= 2) {
            layerData.lineHeight = layerData.textSize + 1;
        }
        else if (3 <= layerData.textSize && layerData.textSize <=14) {
            layerData.lineHeight = layerData.textSize + 2;
        }
        else if (15 <= layerData.textSize && layerData.textSize <= 18) {
            layerData.lineHeight = layerData.textSize + 3;
        }
        else if (19 <= layerData.textSize && layerData.textSize <= 23) {
            layerData.lineHeight = layerData.textSize + 4;
        }
    }
    
    //log(layerData.text + " - " + layerData.width)

    
    return layerData
}

var nsfontForName = function(fontPostscriptName, fontSize) {
    var fontOSXName = (fontPostscriptName.indexOf(".") == 0 ?
                       fontPostscriptName.substring(1) :
                       fontPostscriptName);
    fontOSXName = fontOSXName == "SFUIText" ? "SFUIText-Regular" : fontOSXName;
    var font = [NSFont fontWithName:fontOSXName size:fontSize];
    return font;
}

var defaultLineHeight = function(fontPostscriptName, fontSize) {
    var font = nsfontForName(fontPostscriptName, fontSize)
    if (font != nil) {
        return [font defaultLineHeightForFont];
    }
    log("[textLayerData] nil NSFont:" + fontPostscriptName)
    return 0;
}

var nonNativeFonts = function(artboards) {
    var res = [];
    for (var artboardIndex = 0; artboardIndex < artboards.length; artboardIndex++) {
        var artboard = artboards[artboardIndex];
        var layers = [artboard layers];
        for (var layerIndex = 0; layerIndex < [layers count]; layerIndex++) {
            var layer = [layers objectAtIndex:layerIndex];
            nonNativeFontsRecursiveScan(layer, res);
        }
    }
    return res;
}

var nonNativeFontsRecursiveScan = function(layer, accumulator) {
    // log("nonNativeFontsRecursiveScan: " + layer.name());
    // Append unsupported
    if ([layer class] == MSTextLayer) {
        var fontPostscriptName = fixSFUIFontName(layer.fontPostscriptName() + "");
        var isSupportedFont = iOSNativeFonts.indexOf(fontPostscriptName) != -1;
        var shouldAdd = !isSupportedFont && fontPostscriptName != 'null' && accumulator.indexOf(fontPostscriptName) == -1;
        if (shouldAdd) {
            // log("accumulator.push Font: '" + fontPostscriptName + "'");
            accumulator.push(fontPostscriptName + "");
        }
    }
    
    // Recurse scan groups
    if (is_group(layer) && should_flatten_layer(layer) == false) {
        var sublayers = [layer layers];
        for (var layerIndex = 0; layerIndex < [sublayers count]; layerIndex++) {
            var sublayer = [sublayers objectAtIndex:layerIndex];
            nonNativeFontsRecursiveScan(sublayer, accumulator);
        }
    }
}

var fixSFUIFontName = function(fontName) {
    // SF Display isn't an iOS font
    //fontName = fontName.replace("SFNSDisplay", "SFUIText");
    //fontName = fontName.replace("SFUIDisplay", "SFUIText");
    fontName = fontName.replace(".HelveticaNeueDeskInterface", "HelveticaNeue");
    // OSX to iOS SF UI font names
    if (fontName == "SFUIText-Regular" || fontName == ".SFUIText-Regular") {
        fontName = ".SFUIText";
    }
    else if (fontName.indexOf("HelveticaNeue-Regular") == 0) {
        fontName = "HelveticaNeue";
    }
    else if (fontName.indexOf("SFUIText") == 0) {
        fontName = "." + fontName;
    }
    return fontName;
}

var updateExportFrameForText = function(layer, topLeft, size) {
    var extraPadding = 8 + [layer kerning];
    if (layer.textBehaviour() == 0) { //Auto-width
        extraPadding += 8
    }
    
    if (isAlignmentRight(layer.textAlignment())) {
        topLeft.x -= extraPadding - 1
        size.width += extraPadding
    }
    else if (isAlignmentCenter(layer.textAlignment())) {
        topLeft.x -= (extraPadding/2)
        size.width += extraPadding
    }
    else {
        topLeft.x -= 1;
        size.width += extraPadding
    }
}

var iOSNativeFonts = [
                      ".SFUIText",
                      ".SFUIText-HeavyItalic",
                      ".SFUIText-BoldItalic",
                      ".SFUIText-SemiboldItalic",
                      ".SFUIText-Heavy",
                      ".SFUIText-Bold",
                      ".SFUIText-Semibold",
                      ".SFUIText-LightItalic",
                      ".SFUIText-MediumItalic",
                      ".SFUIText-Italic",
                      ".SFUIText-Light",
                      ".SFUIText-Medium",
                      "AcademyEngravedLetPlain",
                      "AlNile",
                      "AlNile-Bold",
                      "AmericanTypewriter",
                      "AmericanTypewriter-Bold",
                      "AmericanTypewriter-Condensed",
                      "AmericanTypewriter-CondensedBold",
                      "AmericanTypewriter-CondensedLight",
                      "AmericanTypewriter-Light",
                      "AppleColorEmoji",
                      "AppleSDGothicNeo-Bold",
                      "AppleSDGothicNeo-Light",
                      "AppleSDGothicNeo-Medium",
                      "AppleSDGothicNeo-Regular",
                      "AppleSDGothicNeo-SemiBold",
                      "AppleSDGothicNeo-Thin",
                      "AppleSDGothicNeo-UltraLight",
                      "Arial-BoldItalicMT",
                      "Arial-BoldMT",
                      "Arial-ItalicMT",
                      "ArialHebrew",
                      "ArialHebrew-Bold",
                      "ArialHebrew-Light",
                      "ArialMT",
                      "ArialRoundedMTBold",
                      "Avenir-Black",
                      "Avenir-BlackOblique",
                      "Avenir-Book",
                      "Avenir-BookOblique",
                      "Avenir-Heavy",
                      "Avenir-HeavyOblique",
                      "Avenir-Light",
                      "Avenir-LightOblique",
                      "Avenir-Medium",
                      "Avenir-MediumOblique",
                      "Avenir-Oblique",
                      "Avenir-Roman",
                      "AvenirNext-Bold",
                      "AvenirNext-BoldItalic",
                      "AvenirNext-DemiBold",
                      "AvenirNext-DemiBoldItalic",
                      "AvenirNext-Heavy",
                      "AvenirNext-HeavyItalic",
                      "AvenirNext-Italic",
                      "AvenirNext-Medium",
                      "AvenirNext-MediumItalic",
                      "AvenirNext-Regular",
                      "AvenirNext-UltraLight",
                      "AvenirNext-UltraLightItalic",
                      "AvenirNextCondensed-Bold",
                      "AvenirNextCondensed-BoldItalic",
                      "AvenirNextCondensed-DemiBold",
                      "AvenirNextCondensed-DemiBoldItalic",
                      "AvenirNextCondensed-Heavy",
                      "AvenirNextCondensed-HeavyItalic",
                      "AvenirNextCondensed-Italic",
                      "AvenirNextCondensed-Medium",
                      "AvenirNextCondensed-MediumItalic",
                      "AvenirNextCondensed-Regular",
                      "AvenirNextCondensed-UltraLight",
                      "AvenirNextCondensed-UltraLightItalic",
                      "BanglaSangamMN",
                      "Baskerville",
                      "Baskerville-Bold",
                      "Baskerville-BoldItalic",
                      "Baskerville-Italic",
                      "Baskerville-SemiBold",
                      "Baskerville-SemiBoldItalic",
                      "BodoniOrnamentsITCTT",
                      "BodoniSvtyTwoITCTT-Bold",
                      "BodoniSvtyTwoITCTT-Book",
                      "BodoniSvtyTwoITCTT-BookIta",
                      "BodoniSvtyTwoOSITCTT-Bold",
                      "BodoniSvtyTwoOSITCTT-Book",
                      "BodoniSvtyTwoOSITCTT-BookIt",
                      "BodoniSvtyTwoSCITCTT-Book",
                      "BradleyHandITCTT-Bold",
                      "ChalkboardSE-Bold",
                      "ChalkboardSE-Light",
                      "ChalkboardSE-Regular",
                      "Chalkduster",
                      "Cochin",
                      "Cochin-Bold",
                      "Cochin-BoldItalic",
                      "Cochin-Italic",
                      "Copperplate",
                      "Copperplate-Bold",
                      "Copperplate-Light",
                      "Courier",
                      "Courier-Bold",
                      "Courier-BoldOblique",
                      "Courier-Oblique",
                      "CourierNewPS-BoldItalicMT",
                      "CourierNewPS-BoldMT",
                      "CourierNewPS-ItalicMT",
                      "CourierNewPSMT",
                      "Crashlytics",
                      "Damascus",
                      "DamascusBold",
                      "DamascusLight",
                      "DamascusMedium",
                      "DamascusSemiBold",
                      "DevanagariSangamMN",
                      "DevanagariSangamMN-Bold",
                      "Didot",
                      "Didot-Bold",
                      "Didot-Italic",
                      "DiwanMishafi",
                      "EuphemiaUCAS",
                      "EuphemiaUCAS-Bold",
                      "EuphemiaUCAS-Italic",
                      "Farah",
                      "Futura-CondensedExtraBold",
                      "Futura-CondensedMedium",
                      "Futura-Medium",
                      "Futura-MediumItalic",
                      "GeezaPro",
                      "GeezaPro-Bold",
                      "Georgia",
                      "Georgia-Bold",
                      "Georgia-BoldItalic",
                      "Georgia-Italic",
                      "GillSans",
                      "GillSans-Bold",
                      "GillSans-BoldItalic",
                      "GillSans-Italic",
                      "GillSans-Light",
                      "GillSans-LightItalic",
                      "GillSans-SemiBold",
                      "GillSans-SemiBoldItalic",
                      "GillSans-UltraBold",
                      "GujaratiSangamMN",
                      "GujaratiSangamMN-Bold",
                      "GurmukhiMN",
                      "GurmukhiMN-Bold",
                      "HeitiSC",
                      "HeitiTC",
                      "Helvetica",
                      "Helvetica-Bold",
                      "Helvetica-BoldOblique",
                      "Helvetica-Light",
                      "Helvetica-LightOblique",
                      "Helvetica-Oblique",
                      "HelveticaNeue",
                      "HelveticaNeue-Bold",
                      "HelveticaNeue-BoldItalic",
                      "HelveticaNeue-CondensedBlack",
                      "HelveticaNeue-CondensedBold",
                      "HelveticaNeue-Italic",
                      "HelveticaNeue-Light",
                      "HelveticaNeue-LightItalic",
                      "HelveticaNeue-Medium",
                      "HelveticaNeue-MediumItalic",
                      "HelveticaNeue-Thin",
                      "HelveticaNeue-ThinItalic",
                      "HelveticaNeue-UltraLight",
                      "HelveticaNeue-UltraLightItalic",
                      "HiraMinProN-W3",
                      "HiraMinProN-W6",
                      "HiraginoSans-W3",
                      "HiraginoSans-W6",
                      "HoeflerText-Black",
                      "HoeflerText-BlackItalic",
                      "HoeflerText-Italic",
                      "HoeflerText-Regular",
                      "IowanOldStyle-Bold",
                      "IowanOldStyle-BoldItalic",
                      "IowanOldStyle-Italic",
                      "IowanOldStyle-Roman",
                      "Kailasa",
                      "Kailasa-Bold",
                      "KannadaSangamMN",
                      "KannadaSangamMN-Bold",
                      "KhmerSangamMN",
                      "KohinoorBangla-Light",
                      "KohinoorBangla-Regular",
                      "KohinoorBangla-Semibold",
                      "KohinoorDevanagari-Light",
                      "KohinoorDevanagari-Regular",
                      "KohinoorDevanagari-Semibold",
                      "KohinoorTelugu-Light",
                      "KohinoorTelugu-Medium",
                      "KohinoorTelugu-Regular",
                      "LaoSangamMN",
                      "MalayalamSangamMN",
                      "MalayalamSangamMN-Bold",
                      "MarkerFelt-Thin",
                      "MarkerFelt-Wide",
                      "Menlo-Bold",
                      "Menlo-BoldItalic",
                      "Menlo-Italic",
                      "Menlo-Regular",
                      "Noteworthy-Bold",
                      "Noteworthy-Light",
                      "Optima-Bold",
                      "Optima-BoldItalic",
                      "Optima-ExtraBlack",
                      "Optima-Italic",
                      "Optima-Regular",
                      "OriyaSangamMN",
                      "OriyaSangamMN-Bold",
                      "Palatino-Bold",
                      "Palatino-BoldItalic",
                      "Palatino-Italic",
                      "Palatino-Roman",
                      "Papyrus",
                      "Papyrus-Condensed",
                      "PartyLetPlain",
                      "PingFangHK-Light",
                      "PingFangHK-Medium",
                      "PingFangHK-Regular",
                      "PingFangHK-Semibold",
                      "PingFangHK-Thin",
                      "PingFangHK-Ultralight",
                      "PingFangSC-Light",
                      "PingFangSC-Medium",
                      "PingFangSC-Regular",
                      "PingFangSC-Semibold",
                      "PingFangSC-Thin",
                      "PingFangSC-Ultralight",
                      "PingFangTC-Light",
                      "PingFangTC-Medium",
                      "PingFangTC-Regular",
                      "PingFangTC-Semibold",
                      "PingFangTC-Thin",
                      "PingFangTC-Ultralight",
                      "SavoyeLetPlain",
                      "SinhalaSangamMN",
                      "SinhalaSangamMN-Bold",
                      "SnellRoundhand",
                      "SnellRoundhand-Black",
                      "SnellRoundhand-Bold",
                      "Symbol",
                      "System",
                      "TamilSangamMN",
                      "TamilSangamMN-Bold",
                      "TeluguSangamMN",
                      "Thonburi",
                      "Thonburi-Bold",
                      "Thonburi-Light",
                      "TimesNewRomanPS-BoldItalicMT",
                      "TimesNewRomanPS-BoldMT",
                      "TimesNewRomanPS-ItalicMT",
                      "TimesNewRomanPSMT",
                      "Trebuchet-BoldItalic",
                      "TrebuchetMS",
                      "TrebuchetMS-Bold",
                      "TrebuchetMS-Italic",
                      "Verdana",
                      "Verdana-Bold",
                      "Verdana-BoldItalic",
                      "Verdana-Italic",
                      "ZapfDingbatsITC",
                      "Zapfino"
                      ];
