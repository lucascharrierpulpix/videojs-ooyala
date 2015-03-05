/**
 * @fileoverview Ooyala Media Controller - Wrapper for Ooyala Media API
 * Ported from https://github.com/eXon/videojs-youtube/
 */

 var OoyalaState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3
};

/**
 * Ooyala Media Controller - Wrapper for YouTube Media API
 * @param {videojs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
videojs.Ooyala = videojs.MediaTechController.extend({
  /** @constructor */
  init: function(player, options, ready){
    videojs.MediaTechController.call(this, player, options, ready);

    this.player_ = player;
    this.player_el_ = document.getElementById(this.player_.id());
    this.player_el_.className += ' vjs-ooyala';

    var self = this;
    this.id_ = this.player_.id() + '_ooyala_api';

    if (typeof this.player_.options().ooControls != 'undefined') {
        var dmC = this.player_.options().ooControls;

        if (dmC && this.player_.controls()){
            this.player_.controls(false);
        }
    }

     this.player_.controls(true);

    // Copy the Javascript options if they exist
    if (typeof options.source !== 'undefined') {
      for (var key in options.source) {
        if (options['source'].hasOwnProperty(key)) {
          this.player_.options()[key] = options.source[key];
        }
      }
    }
    this.player_.options().poster = undefined;

    this.el_ = videojs.Component.prototype.createEl('iframe', {
      id: this.id_,
      className: 'vjs-tech',
      scrolling: 'no',
      autoplay: (this.player_.options().autoplay) ? 1 : 0,
      chromeless: (this.player_.options().ooControls) ? 0 : 1,
      marginWidth: 0,
      marginHeight: 0,
      frameBorder: 0,
      // controls: 'html',
      webkitAllowFullScreen: 'true',
      mozallowfullscreen: 'true',
      allowFullScreen: 'true',
    });

    this.player_el_.insertBefore(this.el_, this.player_el_.firstChild);

    // this.player_.bigPlayButton.hide();

    this.ooyala = undefined;
    this.ooyalaInfo = {};

    this.player_.options().poster = undefined;

    var self = this;
    this.el_.onload = function() { self.onLoad(); };

    this.contentId = player.options()['src'];
    this.playerId = player.options()['playerId'];
    this.isReady_ = false;


    if (false) {
        videojs.Ooyala.loadOoyala(this);
    } else {
      // Add to the queue because the Ooyala API is not ready
      videojs.Ooyala.loadingQueue.push(this);

      // Load the Dailymotion API if it is the first Dailymotion video
      if (!videojs.Ooyala.apiLoading) {
        console.log('! videojs.Ooyala.apiLoading');
        var tag = document.createElement('script');
        var src = '//player.ooyala.com/v3/' + this.playerId + '';
        //var src = 'http://player.ooyala.com/iframe.js&pbid=' + this.playerId + '?platform=html5-priority';

        // If we are not on a server, don't specify the origin (it will crash)
        if (window.location.protocol == 'file:'){
          src = 'http:' + src;
        }

        tag.src = src;
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        videojs.Ooyala.apiLoading = true;

        var content = "#" + this.player_.id() + ">div{position:absolute !important; z-index: 500;} #" + this.player_.id() +">div.ng-scope{pointer-events: none;} "
          +  "#" + this.player_.id() + " .innerWrapper {background: #000; z-index: 0;} " + " .vjs-default-skin .vjs-big-play-button{ height:78px !important; width:78px !important}";
        loadjscssfile(content, 'css');
      }

      if(typeof this.player_.bigPlayButton !== 'undefined') {
        this.player_.bigPlayButton.hide();
      }
            // this.player_.bigPlayButton.hide();
      // this.player_.posterImage.hide();

      //videojs.MediaTechController.prototype.dispose.call(this);


      function waitForScript(test, callback) {
        var callbackTimer = setInterval(function() {
          var call = false;

          try {
            call = test.call();
          } catch (e) {}

          if (call) {
            clearInterval(callbackTimer);
            callback.call();
          }
        }, 100);
      }

      waitForScript(function() {
        return OO;
      }, function() {
        var oo;

        while ((oo = videojs.Ooyala.loadingQueue.shift())) {
            videojs.Ooyala.loadOoyala(oo);
        }

        videojs.Ooyala.loadingQueue = [];
        videojs.Ooyala.apiReady = true;
        this.onReady();
      }.bind(this));
    }
  }
});

videojs.Ooyala.prototype.dispose = function(){
  console.log('videojs.Ooyala.prototype.dispose');
  if (this.ooyala) {
    this.ooyala.destroy();
    delete this.ooyala;
  }

  videojs.MediaTechController.prototype.dispose.call(this);
};

videojs.Ooyala.prototype.src = function(src){
  // if (this.ooyala) {
  //   this.ooyala.destroy();
  //   delete this.ooyala;
  // }
  console.log('videojs.Ooyala.prototype.src');
  this.contentId = src;
  videojs.Ooyala.loadOoyala(this);
};

videojs.Ooyala.prototype.load = function(){};
videojs.Ooyala.prototype.play = function(){
  this.ooyala.play();
//   this.player_.posterImage.hide();
// //  this.player_.bigPlayButton.hide();
};
videojs.Ooyala.prototype.pause = function(){this.ooyala.pause();};
videojs.Ooyala.prototype.paused = function(){ return (this.ooyalaInfo.state == OoyalaState.PAUSED); };
videojs.Ooyala.prototype.currentTime = function(){ return this.ooyalaInfo.time;};
videojs.Ooyala.prototype.setCurrentTime = function(seconds){
  this.ooyala.seek(seconds);
  return true;
};
videojs.Ooyala.prototype.duration = function(){return this.ooyalaInfo.duration*1000;};
videojs.Ooyala.prototype.volume = function(){ return 0; };
videojs.Ooyala.prototype.setVolume = function(percentAsDecimal){};
videojs.Ooyala.prototype.muted = function(){};
videojs.Ooyala.prototype.setMuted = function(muted){};
videojs.Ooyala.prototype.buffered = function(){ return videojs.createTimeRange(0, this.ooyalaInfo.buffered || 0); };
videojs.Ooyala.prototype.supportsFullScreen = function(){ return true; };

// Ooyala is supported on all platforms
videojs.Ooyala.isSupported = function(){ return true; };

// You can use video/ooyala as a media in your HTML5 video to specify the source
videojs.Ooyala.canPlaySource = function(srcObj){
  return (srcObj.type == 'video/ooyala');
};

// All videos created before Ooyala API is loaded
videojs.Ooyala.loadingQueue = [];

// Always can control the volume
videojs.Ooyala.canControlVolume = function(){ return true; };

////////////////////////////// Ooyala specific functions //////////////////////////////

videojs.Ooyala.loadOoyala = function(player){
  var domId = player.player_el_.id;
  var contentId = player.contentId;
  var playerId = player.playerId;
  var messageBus = 'vjs-ooyala-' + domId + '-' + player.playerId + '-' + contentId;

  if (!contentId) {
    return;
  }

  OO.ready(function() {
    console.log('videojs.Ooyala.loadOoyala : 00.ready');
    var ooPlayer = OO.Player.create(domId, contentId, {
      // 'flashParams': {
      //   height: '100%',
      //   width: '100%',
      //   //hide: 'all'
      // },
      onCreate: function(ooPlayer) {
        console.log('videojs.Ooyala.loadOoyala : onCreated');
        ooPlayer.subscribe('*', messageBus, function(eventName) {
          // Player embedded parameters go here
        });

        ooPlayer.subscribe('error', messageBus, function(eventName, payload) {
          // console.error(eventName + ": " + payload);
          player.onError(eventName + ": " + payload);
        });

        ooPlayer.subscribe('playheadTimeChanged', messageBus, function() {
          if (player.ooyalaInfo.duration) {
            var buffered = (ooPlayer.getBufferLength() / player.ooyalaInfo.duration);

            if (buffered > 1) {
              player.ooyalaInfo.buffered = 1;
            } else {
              player.ooyalaInfo.buffered = buffered;
            }
          }

          var playheadTime = ooPlayer.getPlayheadTime();
          player.onPlayProgress(playheadTime);
        });

        // ooPlayer.subscribe('bitrateInfoAvailable', 'vjs-ooyala', function(eventName) {
        //   var rates = ooPlayer.getBitratesAvailable();
        //   if (rates.length > 0) {
        //     for (var i=0; i < rates.length; i++) {
        //       console.log("Rate: " + rates[i]);
        //     }
        //   }
        // });

        ooPlayer.subscribe('playbackReady', messageBus, function() {
          // console.log("Title is: " + ooPlayer.getTitle());
          // console.log("Description is: " + ooPlayer.getDescription());

          player.ooyala = ooPlayer;

          player.ooyalaInfo = {
            state: OoyalaState.UNSTARTED,
            volume: 1,
            muted: false,
            muteVolume: 1,
            time: 0,
            duration: (ooPlayer.getDuration() / 1000),
            buffered: 0,
            error: null
          };

          player.onReady();
        });

        ooPlayer.subscribe('paused', messageBus, function() {
          player.onPause();
        });

        ooPlayer.subscribe('play', messageBus, function() {
          player.onPlay();
        });

        ooPlayer.subscribe('seekStream', messageBus, function() {
          var playheadTime = ooPlayer.getPlayheadTime();
          player.onSeek(playheadTime);
        });

        ooPlayer.subscribe('played', messageBus, function() {
          player.onEnded();
        });
      },
      autoplay: player.player_.options()['autoplay'] || false,
      wmode: 'opaque',
    });
  });
}

videojs.Ooyala.prototype.onReady = function(){
  console.log('videojs.Ooyala.prototype.onReady');
  this.isReady_ = true;
  if (this.player_.options().ooControls){
    this.player_.bigPlayButton.hide();
    this.player_.posterImage.hide();
  } else {
    this.player_.bigPlayButton.show();
  }
  this.triggerReady();
};

videojs.Ooyala.prototype.onError = function(error){
  this.player_.error = error;
  this.player_.trigger('error');
};

videojs.Ooyala.prototype.onPause = function(){
  this.ooyalaInfo.state = OoyalaState.PAUSED;
  this.player_.trigger('pause');
};

videojs.Ooyala.prototype.onPlay = function(){
  this.ooyalaInfo.state = OoyalaState.PLAYING;
  this.player_.trigger('play');
};

videojs.Ooyala.prototype.onPlayProgress = function(seconds){
  this.ooyalaInfo.time = seconds;
  this.player_.trigger('timeupdate');
};

videojs.Ooyala.prototype.onEnded = function(){
  this.ooyalaInfo.state = OoyalaState.ENDED;
  this.player_.trigger('ended');
};

videojs.Ooyala.prototype.onSeek = function(seconds){
  this.ooyalaInfo.time = seconds;
  this.player_.trigger('timeupdate');
  this.player_.trigger('seeked');
};

function loadjscssfile(content, filetype){
    console.log('loadjscssfile');
    if (filetype === "js"){ //if filename is a external JavaScript file
        var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", filename)
    }
    else if (filetype === "css"){ //if filename is an external CSS file
        var fileref=document.createElement("style");
        // fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css");
        fileref.innerHTML = content;
    }
    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}
