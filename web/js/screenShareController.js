!function(globals) {
  'use strict';

  var debug;
  var _chromeExtId;
  var _isSharing;
  var _userName;
  var NAME_SUFFIX = '\'s screen';
  var DEFAULT_NAME = 'Unknown';

  var screenPublisherOptions = {
    name: 'screen',
    showControls: false,
    style: {
      nameDisplayMode: 'off'
    },
    publishAudio: false,
    videoSource: 'screen',
    insertMode: 'append'
  };

  var streamHandlers = {
    'destroyed': function(evt) {
      _isSharing = false;
      Utils.sendEvent('screenShareController:destroyed');
    }
  };

  var roomViewEvents = {
    'shareScreen': function(evt) {
      if (_isSharing) {
        OTHelper.stopShareScreen();
        _isSharing = false;
        // We don't need to send this because desktop stream is sending a destroyed event.
      } else {
        OTHelper.shareScreen(ScreenShareView.desktopId, screenPublisherOptions, streamHandlers).
          then(function() {
            _isSharing = true;
            Utils.sendEvent('screenShareController:changeScreenShareStatus',
                            { isSharing: _isSharing });

          }).
          catch(function(error) {
            Utils.sendEvent('screenShareController:shareScreenError',
                            { code: error.code, message: error.message });
          });
      }
    }
  };

  var screenShareViewEvents = {
    'installExtension': function(evt) {
      try {
        chrome.webstore.install('https://chrome.google.com/webstore/detail/' + _chromeExtId,
          function() {
            Utils.sendEvent('screenShareController:extInstallationResult',
                            { error: false });
          }, function(err) {
            Utils.sendEvent('screenShareController:extInstallationResult',
                            { error: true, message: err });
          });
      } catch(e) {
        // WARNING!! This shouldn't happen
        // If this message is displayed it could be because the extensionId is not
        // registred and, in this case, we have a bug because this was already controlled
        debug.error('Error installing extension:', e);
      }
    }
  };

  function init(aUserName, aChromeExtId) {
    return LazyLoader.dependencyLoad([
      '/js/screenShareView.js'
    ]).then(function() {
      debug = new Utils.MultiLevelLogger('screenShareController.js',
                                         Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

      Utils.addEventsHandlers('roomView:', roomViewEvents, globals);
      Utils.addEventsHandlers('screenShareView:', screenShareViewEvents, globals);
      _isSharing = false;
      _userName = aUserName;
      screenPublisherOptions.name = (aUserName ? aUserName : DEFAULT_NAME) + NAME_SUFFIX;
      _chromeExtId = aChromeExtId;
      aChromeExtId && aChromeExtId !== 'undefined' &&
        OTHelper.registerScreenShareExtension({ chrome: aChromeExtId });
      ScreenShareView.init();
    });
  };

  var ScreenShareController = {
    init: init,
    get chromeExtId() {
      return _chromeExtId;
    }
  };

  globals.ScreenShareController = ScreenShareController;
}(this);


