
var createAlert = function(message, informativeText, customize) {
  var alert = [[NSAlert alloc] init]
  [alert setMessageText:message]
  if (informativeText) {
    [alert setInformativeText:informativeText]
  }
  return alert
};