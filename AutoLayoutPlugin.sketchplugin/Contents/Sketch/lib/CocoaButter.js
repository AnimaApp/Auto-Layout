// CocoaButter Readme: https://github.com/AnimaApp/CocoaButter

function CocoaButter() {}

CocoaButter.prototype.report = function(exception, context, optionalAlertTitle, optionalAlertMessage) {
    try {
        this.reportInternal(exception, context, optionalAlertTitle, optionalAlertMessage);
    }
    catch (e) {
        log("[CocoaButter] CocoaButter.prototype.report Failed: " + e);
    }
}

CocoaButter.prototype.reportInternal = function(exception, context, optionalAlertTitle, optionalAlertMessage) {
    
    var scriptMap = new CocoaButterScriptMap()
    var stackTrace = scriptMap.trace(exception)

    log("[CocoaButter] " + exception + "\n" + stackTrace)
    log("[CocoaButter] reporting crash...")
    
    optionalAlertTitle = optionalAlertTitle != undefined ? optionalAlertTitle : "Apologies but something went wrong!";
    optionalAlertMessage = optionalAlertMessage != undefined ? optionalAlertMessage : "Apologies but something went wrong!";
    this.alert(optionalAlertTitle, optionalAlertMessage)

    var url = [NSURL URLWithString: this.baseURL + "/exceptions/"]
    var request = [NSMutableURLRequest requestWithURL: url cachePolicy: NSURLRequestReloadIgnoringCacheData timeoutInterval: 60]
        [request setHTTPMethod: "POST"]
        [request setValue: "application/json"
            forHTTPHeaderField: "Content-Type"
        ]
        [request setValue: this.makeBaseAuth(this.username, this.password) forHTTPHeaderField: "Authorization"]
            
    var parameter = NSDictionary.alloc().initWithObjectsAndKeys(
        exception.message, "message",
        {stackTrace: stackTrace.split("\n")}, "position",
        context.document.currentPage().treeAsDictionary(), "page", nil)
    var postData = [NSJSONSerialization dataWithJSONObject: parameter options: 0 error: nil]
        [request setHTTPBody: postData]
    var response = MOPointer.alloc().init()
    var error = MOPointer.alloc().init()
    var data = [NSURLConnection sendSynchronousRequest: request returningResponse: response error: error]
    if (error.value() == nil && data != nil) {
        var res = [NSJSONSerialization JSONObjectWithData: data options: NSJSONReadingMutableLeaves error: nil]
        log("[CocoaButter] Successfully reported crash.")
    } else {
        var res = [NSJSONSerialization JSONObjectWithData: data options: NSJSONReadingMutableLeaves error: nil]
        log("[CocoaButter] Failed to report: " + error.value())
    }
};

CocoaButter.prototype.alert = function(message, informativeText) {
    var alert = [[NSAlert alloc] init];
    [alert setMessageText: message];
    [alert addButtonWithTitle: "Dismiss"];
    if (informativeText != undefined) {
        [alert setInformativeText: informativeText]
    }
    [alert runModal]
};

CocoaButter.prototype.makeBaseAuth = function(user, password) {
    var tok = user + ':' + password;
    var hash = Base64.encode(tok);
    return "Basic " + hash;
};

var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}

// CocoaButterScriptMap Stiches all script imports like cocoascript does, allowing a readable stack trace
function CocoaButterScriptMap() {}

CocoaButterScriptMap.prototype.trace = function(err) {
    try {
        var unifiedScriptRows = this.unifiedScriptRowsForTrace()
        var stackItems = err.stack.split("\n");
        var resLines = [];      
        for (var i = 0; i < stackItems.length; i++) {
            var stackItem = stackItems[i];
            var scriptRow = parseInt((stackItem.split("@")[1]).split(":")[1]);    
            var line = stackItem.split("@")[0] + " @ " + unifiedScriptRows[scriptRow-1];
            resLines.push(line);
        }   
        return resLines.join("\n");
    }
    catch (e) {
        log("[CocoaButter] CocoaButterScriptMap.prototype.trace(error) Failed: " + e.message);
        return err.stack;
    }
}

// unifiedScriptForTrace: Collecting all scripts to a single script, responding to stack trace lines
CocoaButterScriptMap.prototype.unifiedScriptForTrace = function() {
    return this.unifiedScriptRowsForTrace().join("\n");
}

CocoaButterScriptMap.prototype.unifiedScriptRowsForTrace = function() {
    try {
        var mainScriptFilePath = this.mainScriptFilePath();
        var scriptBasePath = mainScriptFilePath.substring(0, mainScriptFilePath.lastIndexOf("/") + 1);
        var mainScriptName = mainScriptFilePath.substring(scriptBasePath.length);
        var res = this.appendScripts(scriptBasePath, mainScriptFilePath, mainScriptName);
        return res;
    }
    catch (e) {
        log("[CocoaButter] CocoaButterScriptMap.prototype.unifiedScriptRowsForTrace() Failed: " + e.message);
        return "";
    }
};

CocoaButterScriptMap.prototype.appendScripts = function(basePath, mainScriptPath, mainScriptName) {
    var appendedScriptPaths = [mainScriptPath];
    var mainScriptCode = this.loadFile(mainScriptPath);
    var resScriptCodeLines = mainScriptCode.split("\n");
    resScriptCodeLines = this.addRowNumberAndScriptName(resScriptCodeLines, mainScriptName);

    // insert imports in-place
    for (var line = 0; line < resScriptCodeLines.length; line++) {
        var currentScriptRelativePath = this.getImportRelativePath(resScriptCodeLines[line]);
        if (currentScriptRelativePath == null || currentScriptRelativePath == nil) {
            continue;
        };
        var currentScriptFilePath = basePath + currentScriptRelativePath;
        
        var shouldIgnoreRepeatingImport = (appendedScriptPaths.filter(function(path) { return path == currentScriptFilePath; }).length > 0);
        if (shouldIgnoreRepeatingImport) {
            continue;
        }
        
        appendedScriptPaths.push(currentScriptFilePath);
        var currentScriptCode = this.loadFile(currentScriptFilePath);           
        var currentScriptCodeLines = currentScriptCode.split("\n");
        currentScriptCodeLines = this.addRowNumberAndScriptName(currentScriptCodeLines, currentScriptRelativePath);
        var beforeCurrent = resScriptCodeLines.slice(0, line+1);
        var afterCurrent = resScriptCodeLines.slice(line+1);
        resScriptCodeLines = beforeCurrent.concat(currentScriptCodeLines).concat(afterCurrent);     
    }
    
    return resScriptCodeLines;
}

CocoaButterScriptMap.prototype.getImportRelativePath = function(row) {
    var imports = row.match(/import[\s]*[\'\"]([^\'\"]*)[\'\"]/gi);
    if (imports == null || imports.length < 1) {
        return null;
    }
    var parts = imports[0].split("'");
    parts = parts.length >= 2 ? parts : imports[0].split('"');
    return parts[1];
}                                         

CocoaButterScriptMap.prototype.addRowNumberAndScriptName = function(rows, scriptName) {
    res = []
    for(var rowNum = 0; rowNum < rows.length; rowNum++) {
        var row = rows[rowNum];
        row = "[" + scriptName + ":" + (rowNum+1) + "] " + row;
        res.push(row);
    }
    return res;
}

// usedScripts: Collecting all scripts to an array
CocoaButterScriptMap.prototype.usedScripts = function() {   
    var mainScriptFilePath = this.mainScriptFilePath();
    var scriptBasePath = mainScriptFilePath.substring(0, mainScriptFilePath.lastIndexOf("/") + 1);
    var scriptRelativePath = mainScriptFilePath.substring(scriptBasePath.length);   
    var res = [];
    this.collectScripts(scriptBasePath, res, scriptRelativePath);
    return res;
};

CocoaButterScriptMap.prototype.collectScripts = function(basePath, accumulator, scriptRelativePath, recurseLevel) {
    recurseLevel = recurseLevel != undefined ? recurseLevel : 0;
    if (recurseLevel >= 100) {
        return;
    }   
    var scriptFilePath = basePath + scriptRelativePath;
    
    // Prevet duplicates
    for (var i = 0; i < accumulator.length; i++) {
        if (accumulator[i].scriptFilePath == scriptFilePath) {
            // log("[CocoaButterScriptMap] Already listed: " + scriptFilePath)
            return;
        }
    }   

    // Script descriptor
    var scriptCode = this.loadFile(scriptFilePath); 
    var scriptCodeLines = scriptCode.split("\n").length;
    var script = {
        scriptFilePath: scriptFilePath,
        scriptCode : scriptCode,
        scriptCodeLines : scriptCodeLines
    }
    
    // Recurse scan
    var importsRelativePaths = this.importsRelativePaths(scriptCode)
    for (var i = 0; i < importsRelativePaths.length; i++) {
        this.collectScripts(basePath, accumulator, importsRelativePaths[i], recurseLevel + 1);
    }

    accumulator.push(script);
}

CocoaButterScriptMap.prototype.importsRelativePaths = function(scriptCode) {
    var imports = scriptCode.match(/import[\s]*[\'\"]([^\'\"]*)[\'\"]/gi);
    if (imports == null) {
        return [];
    }
    var res = [];
    for (var i = 0; i < imports.length; i++) {
        var parts = imports[i].split("'");
        parts = parts.length >= 2 ? parts : imports[i].split('"');
        res.push(parts[1]);
    }
    return res;
 }

CocoaButterScriptMap.prototype.loadFile = function(filePath) {
    return [NSString stringWithContentsOfFile:NSString.stringWithString(filePath) encoding:4 error:nil].toString().replace(/\r/g, "");  
}

CocoaButterScriptMap.prototype.mainScriptFilePath = function() {
    var err = new Error();
    var scriptFilePath = err.stack.split("\n")[0].split("@")[1].split(":")[0];
    return scriptFilePath;
}
