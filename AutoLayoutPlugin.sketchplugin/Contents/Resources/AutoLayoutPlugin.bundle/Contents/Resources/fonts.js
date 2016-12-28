// Credit to: https://github.com/bigxixi/Font-Packer

function discoverCustomFonts(doc, optionalArtboards) {
    log(doc);
    
    var rootLayers = Array.fromNSArray(doc.pages());
    if (optionalArtboards != undefined) {
        rootLayers = optionalArtboards;
    }
    var fontCheck = {};
    var hasTextlayer = 0;
    var hasMissedFonts = 0;
    var fonts = [];
    var missFontCheck = {};
    var missFont = [];
    for(var i=0; i<rootLayers.length; i++){
        var page = rootLayers[i];
        var tempLayers = page.children();
        for (var n=0; n<[tempLayers count];n++){
            var layer = tempLayers[n];
            if (layer.className() == "MSTextLayer"){
                hasTextlayer++;
                //in case there are multiple fonts in one text layer
                //then check for missing fonts
                var tempFontName = layer.attributedString().fontNames().toString().replace('{(','').replace(')}','').replace(/\n/g,'').replace(/\u0022/g,'').split(',');
                var missFontName = layer.attributedString().unavailableFontNames();
                if(missFontName != "{(\n)}"){
                    hasMissedFonts = 1;
                    missFontName = missFontName.toString().replace('{(','').replace(')}','').replace(/\n/g,'').replace(/\u0022/g,'').split(',');
                    for(var v=0;v<missFontName.length;v++){
                        var missFontTemp = missFontName[v];
                        //remove duplicated missed font names
                        if (!missFontCheck[missFontTemp]){
                            missFontCheck[missFontTemp] = true;
                            missFont.push(missFontTemp);
                        }
                    }
                }
                for(var z=0;z<tempFontName.length;z++){
                    var fontName = tempFontName[z];
                    //only store available custom fonts
                    if (!fontCheck[fontName] && !missFontCheck[fontName] && ! contains(iOSNativeFonts, fontName.trim())){
                        fontCheck[fontName] = true;
                        fonts.push(fontName);
                    }
                }
            }
        }
    }
    log("[fonts.js] discoverCustomFonts:");
    log(fonts);
    return fonts;
}
                                                                             
var contains = function(array, obj) {
    for(var e in array){
        var f = array[e];
        if (f == obj) {
            return true;
        }
    }
    return false;
}

var createFolderAtPath = function(pathString) {
    var fileManager = [NSFileManager defaultManager];
    if([fileManager fileExistsAtPath:pathString]) return true;
    return [fileManager createDirectoryAtPath:pathString withIntermediateDirectories:true attributes:nil error:nil];
}
//read file function
var readTextFromFile = function(filePath) {
    var fileManager = [NSFileManager defaultManager];
    if([fileManager fileExistsAtPath:filePath]) {
        return [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:nil];
    }
    return nil;
}

function copyFontFiles(fonts, assetsDirectory) {
    
    var collectFontPath = assetsDirectory;
    
    createFolderAtPath(collectFontPath);
    
    //get font list with name and location
    //
    //main idea:
    //I was confused but the previous 'system_profiler SPFontsDataType' methed would miss some font info, so I change the way.
    //there are 4 Font folders in Mac OS -
    //>  /System/Library/Fonts/
    //>  ~/Library/Fonts/
    //>  /Library/Fonts/
    //>  /Network/Library/Fonts/ (may not exist, but never mind)
    //then I use terminal command 'ls' to get their paths and save them in a temp file,
    //and I use another terminal command 'mdls -name com_apple_ats_name_postscript' to get all their "postscriptname"s which
    //Sketch reconized as the font name, and save to another temp file.
    //I realised the order of the paths and postscriptnames in the two files are matched,
    //so it's easy to search for the target postscriptnames and take the index in the path file.
    //
    //create font info temp files
    var fontlist = collectFontPath + "/sysfonts.txt";
    var fontMadataList = collectFontPath + "/fontmadatas.txt";
    var getSysFonts = "(mdls -name com_apple_ats_name_postscript /Library/Fonts/*.* -raw;mdls -name com_apple_ats_name_postscript /System/Library/Fonts/*.* -raw;mdls -name com_apple_ats_name_postscript ~/Library/Fonts/*.* -raw;mdls -name com_apple_ats_name_postscript /Network/Library/Fonts/*.* -raw) > " + '"' + fontMadataList + '";' + "(ls /Library/Fonts/*.*;ls /System/Library/Fonts/*.*;ls ~/Library/Fonts/*.*;ls /Network/Library/Fonts/*.*) > " + '"' + fontlist + '"';
    var getFontsCMD = [[NSTask alloc] init];
    [getFontsCMD setLaunchPath: @"/bin/sh"];
    [getFontsCMD setArguments:["-c", getSysFonts]];
    [getFontsCMD launch];
    // show a tip and wait for completion
    //var app = NSApplication.sharedApplication();
    //var loading = "If there are a lot of fonts on your MAC,\nit will take a moument, be patient...\nhit OK and go on.";
    //var tips = "NOTE:";
    //app.displayDialog_withTitle(loading,tips);
    [getFontsCMD waitUntilExit];
    //read font info temp files and split them into groups
    var fontTemp = readTextFromFile(fontlist);
    var fontMadataTemp = readTextFromFile(fontMadataList);
    var fontMadataGroup = [fontMadataTemp componentsSeparatedByString:@")"];
    var fontTempGroup =[fontTemp componentsSeparatedByString:@"\n"];
    var fontLocations = [];
    
    // Font list for plan B
    var systemFontListFile = collectFontPath + "/sysfontsB.txt";
    var systemFontListStringPlanB = ""
    if(!NSFileManager.defaultManager().fileExistsAtPath(systemFontListFile)){
        var getSysFonts="system_profiler SPFontsDataType | grep -E -v '^$|^[a-zA-Z]|Kind:|Valid:|Enabled:|Typefaces:|Full Name:|Style:|Version:|Vendor:|Unique Name:|Designer:|Copyright:|Outline:|Valid:|Enabled:|Duplicate:|Copy Protected:|Embeddable:|Trademark:|Description:|Copyright' > " + '"' + systemFontListFile + '"';
        var getFontsCMD = [[NSTask alloc] init];
        [getFontsCMD setLaunchPath: @"/bin/sh"];
        [getFontsCMD setArguments:["-c", getSysFonts]];
        [getFontsCMD launch];
        [getFontsCMD waitUntilExit]; // wait for completion
    }
    if (systemFontListStringPlanB.length == 0) {
        systemFontListStringPlanB = readTextFromFile(systemFontListFile);
    }
    // Split into string array by "location:"
    var systemFontsArrayPlanB = [systemFontListStringPlanB componentsSeparatedByString:@"Location: "];
    // Remove temp file
    if(NSFileManager.defaultManager().fileExistsAtPath(systemFontListFile)){
        [[NSFileManager defaultManager] removeItemAtPath:systemFontListFile error:nil];
    }
    
    // Iterate fonts to locate files
    for(var m=0; m < fonts.length; m++){
        var currentFontTitle = fonts[m];
        //log("[fonts.js] targeting font:" + currentFontTitle);
        
        //Plan B: In some situations, we need plan B - the 'system_profiler SPFontsDataType' method.
        //if(!fontLocations[m]){
            //log("[fonts.js] Plan A failed for font:" + currentFontTitle);
            var currentFontTitleForPlanB = fonts[m].toString().replace(/\s/g,"");
            currentFontTitleForPlanB = "  " + currentFontTitleForPlanB + ":"
            for(var n = 0; n < [systemFontsArrayPlanB count]; n++){
                var fontListItemPlanB = systemFontsArrayPlanB[n];
                var currentFontLocationForPlanB = fontListItemPlanB.rangeOfString(currentFontTitleForPlanB.toString());
                var itemMatchesFont = currentFontLocationForPlanB.length != 0;
                if (itemMatchesFont) {
                    currentFontLocationForPlanB = [fontListItemPlanB componentsSeparatedByString:@"\n"];
                    fontLocations[m] = currentFontLocationForPlanB[0];
                    log("[fonts.js] Plan B worked for font:" + currentFontTitle + "," + fontLocations[m]);
                    break;
                }
            }
        //}
        
        if (!fontLocations[m]) {
          for (var n = 0; n < [fontMadataGroup count] - 1; n++) {
            //do some clean up
            fontMadataGroup[n] = fontMadataGroup[n].replace('(','').replace(/\n/g,'').replace(/\u0022/g,'');
            var currentFontTitleItem = fontMadataGroup[n];
            var currentFontRangeInFileLocation = currentFontTitleItem.rangeOfString(currentFontTitle.toString());
            if(currentFontRangeInFileLocation.length != 0) {
                fontLocations[m] = fontTempGroup[n];
            }
          }
          if (fontLocations[m]) {
            log("[fonts.js] Plan A worked for font:" + currentFontTitle + "," + fontLocations[m]);
          }
        }
        
        if (!fontLocations[m]) {
            log("[fonts.js] Failed to find file for font:" + currentFontTitle + "," + fontLocations[m]);
        }

    }
    
    //copy the font files
    var targetFontPath;
    var tempFontFileName;
    var familyName;
    var copyFonts = "";
    var animaFontObjects = [];
    for(var g=0;g<fontLocations.length;g++){
        if (fontLocations[g] == undefined) {
            continue;
        }
        tempFontFileName = fontLocations[g].substring(fontLocations[g].lastIndexOf("/")+1,fontLocations[g].length());
        familyName = fonts[g].toString().replace(/\s/g,"")
        targetFontPath = collectFontPath + "/" + tempFontFileName;
        copyFonts += "cp " + '"' + fontLocations[g] + '" "' + targetFontPath + '";';
        animaFontObjects.push({
          'model_class': 'ADModelFont',
          'familyName' : familyName,
          'fileName': tempFontFileName,
        });
    }
    /*var ofilePath = doc.fileName();
    var fileNameFull = ofilePath.substring(ofilePath.lastIndexOf("/")+1,ofilePath.length());
    var fileName = fileNameFull.substring(0,fileNameFull.lastIndexOf("."));*/
    
    copyFonts += "rm " +  '"' + fontlist + '";' + "rm " +  '"' + fontMadataList + '"';
    //log(copyFonts);
    var copyFontsCMD = [[NSTask alloc] init];
    [copyFontsCMD setLaunchPath: @"/bin/sh"];
    [copyFontsCMD setArguments:["-c", copyFonts]];
    [copyFontsCMD launch];
    var fontPrint = "";
    for(var x=0;x<fonts.length;x++){
        fontPrint += fonts[x]+"\n";
    }
    
    //Open the folder
    //var openFolder = "open " + '"' + collectFontPath + '/"';
    //var openFolderCMD = [[NSTask alloc] init];
    //[openFolderCMD setLaunchPath: @"/bin/sh"];
    //[openFolderCMD setArguments:["-c", openFolder]];
    //[openFolderCMD launch];
    
    return animaFontObjects;

};

var exportFonts = function (doc, assetsDirectory, optionalArtboards) {
    var fonts = discoverCustomFonts(doc, optionalArtboards);
    var animaFontObjects = copyFontFiles(fonts, assetsDirectory);
    return animaFontObjects;
}

var iOSNativeFonts = [
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
                      "HiraginoSans-W3",
                      "HiraginoSans-W6",
                      "HiraMinProN-W3",
                      "HiraMinProN-W6",
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
                      "TamilSangamMN",
                      "TamilSangamMN-Bold",
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
