// Breakpoints for Sketch plugins
// MIT License, Copyright 2016 Anima App.

// Usage:
// Call once: cocoapowderSetup();
// Call to break: cocoapowderBreakpoint(function (x) { return eval(x); });
// Call to disable: disableCocoaPowder(function (x) { return eval(x); });

animaBreakPointOffset = 0;
animaBreakPointEnabled = true;

function disableCocoaPowder() {
	animaBreakPointEnabled = false;
}

function cocoapowderSetup() {
	if (!animaBreakPointEnabled) {
		return;
	}
	var err = new Error();
	var trace = err.stack.split("\n")[1];	
	var traceComponents = trace.split(":");	
	var row = parseInt(traceComponents[1]);
	var file_code = animaGetCodeForTrace(trace);
	var setupCallIndex = file_code.indexOf("cocoapowderSetup()");
	var rowInSource = file_code.substring(0,setupCallIndex).split("\n").length;
	animaBreakPointOffset = row - rowInSource;
}

function cocoapowderBreakpoint(evalWithScope, optionalExpression, recurseCount) {
	if (!animaBreakPointEnabled) {
		return;
	}
	recurseCount  = recurseCount != undefined ? recurseCount : 1;
	evalWithScope = evalWithScope != undefined ? evalWithScope : function (x) { return eval(x); };

	// Parse Stacktrace
	var err = new Error();
	var trace = err.stack.split("\n")[recurseCount];
	var traceComponents = trace.split(":");
	var traceFileComponents = traceComponents[0].split("/");
	var sourceFileName = traceFileComponents[traceFileComponents.length - 1];
	var row = parseInt(traceComponents[1]) - animaBreakPointOffset;
	var msg = animaGetCodeForTrace(trace);
	var title = "Breakpoint:\n" + sourceFileName + " @ Line " + row;
	
	var stackTraceLabel = animaCreateCodeScrollingLabel(msg, NSMakeRect(0, 222, 600, 200), row);	

	// Expression Input
	var expressionValue = "";
	if (optionalExpression != undefined) {
		expressionValue = optionalExpression;
	}
	var expressionInput = animaCreateInput("Expression to evaluate (i.e myVarName)", expressionValue, NSMakeRect(0, 0, 600, 20));
	var expressionInputTitle = animaCreateLabel("Expresion to evaluate:", NSMakeRect(0, 22, 600, 20));

	// Evaluate
	var evalText = animaBreakPointEvalText(optionalExpression, evalWithScope);	
	var expressionOutput = animaCreateScrollingLabel(evalText, NSMakeRect(0, 55, 600, 135));
	var expressionOutputTitle = animaCreateLabel(optionalExpression == undefined ? "Scope variables:" : "Expression value:", NSMakeRect(0, 190, 600, 20));

	// Alert View
	var view = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, 600, 422)];	
	[view addSubview:expressionOutput];		
	[view addSubview:expressionOutputTitle];
	[view addSubview:stackTraceLabel];
	[view addSubview:expressionInput];
	[view addSubview:expressionInputTitle];

	var alert = [[NSAlert alloc] init];	
	[alert addButtonWithTitle:'Evaluate'];
	[alert addButtonWithTitle:'Continue'];	
	[alert addButtonWithTitle:'Stop'];	
  	[alert setMessageText:title];
	[alert setAccessoryView:view];

	// User Choice
	var responseCode = [alert runModal];
	if (responseCode == 1000) { // Evaluate
		animaBreakPoint(evalWithScope, expressionInput.stringValue() + "", recurseCount + 1);
	}
	if (responseCode == 1002) { // Stop
		err.message = "Stopped by user"
		throw err
	}
}

function animaBreakPointEvalText(optionalExpression, evalWithScope) {
	var res = "";
	if (optionalExpression != undefined) {		
		try {
			res = optionalExpression + "\n---\n" + evalWithScope(optionalExpression);
		}
		catch (e) {
			res = "Error: " + e.message;
		}		
	}
	else {
		var scope = evalWithScope("this");
		for (name in scope) {
    		res += name + " : " + (scope[name] + "").split("{\n")[0].split("\n")[0] + "\n";	
    	}
	}
	return res;
}

function animaGetCodeForTrace(stackTrace) {
	var filePath = stackTrace.split("@")[1].split(":")[0];
	code = [NSString stringWithContentsOfFile:NSString.stringWithString(filePath) encoding:4 error:nil].toString();
	var codeWithLineNumber = "";
	var rows = code.split("\n");
	for (row = 0; row < rows.length; row++) {
		codeWithLineNumber += animaNumberPadding(row + 1, 3) + "| " + rows[row] + "\n";
	}
	return codeWithLineNumber;
}

function animaNumberPadding(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

var animaCreateScrollingLabel = function(text, rect) {
	var scrollView = [[NSScrollView alloc] initWithFrame:rect];

	scrollView.hasVerticalScroller = true;
	scrollView.hasHorizontalScroller = false;

	var contentSize = scrollView.contentSize;	
	var textView = [[NSTextView alloc] initWithFrame:NSMakeRect(0, 0, rect.size.width, rect.size.height])];
	textView.minSize = NSMakeSize(0.0, contentSize.height);
	textView.maxSize = NSMakeSize(1000000, 1000000);
	textView.verticallyResizable = true;
	textView.horizontallyResizable = false;

	textView.textContainer.containerSize = NSMakeSize(contentSize.width, 10000000);
	textView.textContainer.widthTracksTextView = true;
	textView.string = text;

	scrollView.documentView = textView;
	return scrollView;
}

var animaCreateCodeScrollingLabel = function(text, rect, breakpointRow) {
	var scrollView = animaCreateScrollingLabel(text, NSMakeRect(0, 222, 600, 200));
	[scrollView documentView].font = [NSFont fontWithName:"CourierNewPSMT" size:12];

 	var rowPrefix = "\n" + animaNumberPadding(breakpointRow , 3) + "|"
 	var nextRowPrefix = "\n" + animaNumberPadding(breakpointRow + 1 , 3) + "|"
 	var rowStartIndex = text.indexOf(rowPrefix);
 	var rowEndIndex = text.indexOf(nextRowPrefix);
 	rowEndIndex = rowEndIndex != -1 ? rowEndIndex : text.length;
 	var boldFont = [NSFont fontWithName:"CourierNewPS-BoldMT" size:12];

 	// Scroll to breakpoint and make it bold
	[[scrollView documentView] setFont:boldFont range:NSMakeRange(rowStartIndex, rowEndIndex-rowStartIndex)];
 	[[scrollView documentView] scrollRangeToVisible:NSMakeRange(rowStartIndex, 1)];
	return scrollView;
}

var animaCreateLabel = function(text, rect) {
	var label = [[NSTextView alloc] initWithFrame:rect]
	label.string = text;	
	label.editable = true;
	label.selecable = true;
	label.drawsBackground = false;
	label.setAlignment(0);
	label.font = [NSFont boldSystemFontOfSize:12];
	return label;
}

var animaCreateInput = function(placeholder, text, rect) {
  var input = [[NSTextField alloc] initWithFrame:rect];
  input.editable = true;
  input.borderd = true;
  input.bezeled = false;
  input.setAlignment(0);
  input.useSingleLineMode = true;
  input.drawsBackground = true;
  input.placeholderString = placeholder;
  input.stringValue = text;
  return input;
}
