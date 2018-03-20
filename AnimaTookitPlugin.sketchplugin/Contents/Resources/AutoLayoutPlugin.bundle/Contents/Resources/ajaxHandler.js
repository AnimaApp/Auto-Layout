
$( document ).ajaxSend(function( event, request, settings )  {
                       callNativeApp ("Send");
                       });

$( document ).ajaxComplete(function( event, request, settings )  {
                       callNativeApp ("Complete");
                       });

function callNativeApp (data) {
    try {
        webkit.messageHandlers.callbackHandler.postMessage(data);
    }
    
    catch(err) {
        console.log('The native context does not exist yet');
    }
}
