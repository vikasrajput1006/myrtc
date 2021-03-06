import React, {useState, useEffect, useCallback} from 'react';

import RTCMultiConnection from 'rtcmulticonnection-react-js';

import {getHTMLMediaElement} from './helper';

import RecordRTC from 'recordrtc';
// import { queryHelpers } from '@testing-library/dom';

const hasGetUserMedia = !!(
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );
  

const connection = new RTCMultiConnection();
connection.socketURL = 'http://13.127.148.136:3002/';


const VideoChat = () => {

    const [state, setState] = useState({urls:''});


    useEffect(() =>{ 
            
  if (!hasGetUserMedia) {
    alert(
      'Your browser cannot stream from your webcam. Please switch to Chrome or Firefox.'
    );
    return;
  }
        fetchConection();
    });


  
    
    // const hasGetUserMedia = !!(
    //     navigator.getUserMedia ||
    //     navigator.webkitGetUserMedia ||
    //     navigator.mozGetUserMedia ||
    //     navigator.msGetUserMedia
    //   );
      

    //   if (!hasGetUserMedia) {
    //     alert(
    //       'Your browser cannot stream from your webcam. Please switch to Chrome or Firefox.'
    //     );
    //     return;
    //   }
      
    const connection = new RTCMultiConnection();
    connection.socketURL = 'http://localhost:3002/';


    const fetchConection = useCallback(() => { 
        connection.socketMessageEvent = 'video-conference-demo';
    
        connection.session = {
            audio: true,
            video: true
        };
        
        connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        };
    
    // STAR_FIX_VIDEO_AUTO_PAUSE_ISSUES
    // via: https://github.com/muaz-khan/RTCMultiConnection/issues/778#issuecomment-524853468
        var bitrates = 512;
        var resolutions = 'Ultra-HD';
        var videoConstraints = {};
        
        if (resolutions == 'HD') {
            videoConstraints = {
                width: {
                    ideal: 1280
                },
                height: {
                    ideal: 720
                },
                frameRate: 30
            };
        }
        
        if (resolutions == 'Ultra-HD') {
            videoConstraints = {
                width: {
                    ideal: 1920
                },
                height: {
                    ideal: 1080
                },
                frameRate: 30
            };
        }
        
        connection.mediaConstraints = {
            video: videoConstraints,
            audio: true
        };    
        
        var CodecsHandler = connection.CodecsHandler;

        connection.processSdp = function(sdp) {
            var codecs = 'vp8';
            
            if (codecs.length) {
                sdp = CodecsHandler.preferCodec(sdp, codecs.toLowerCase());
            }
        
            if (resolutions == 'HD') {
                sdp = CodecsHandler.setApplicationSpecificBandwidth(sdp, {
                    audio: 128,
                    video: bitrates,
                    screen: bitrates
                });
        
                sdp = CodecsHandler.setVideoBitrates(sdp, {
                    min: bitrates * 8 * 1024,
                    max: bitrates * 8 * 1024,
                });
            }
        
            if (resolutions == 'Ultra-HD') {
                sdp = CodecsHandler.setApplicationSpecificBandwidth(sdp, {
                    audio: 128,
                    video: bitrates,
                    screen: bitrates
                });
        
                sdp = CodecsHandler.setVideoBitrates(sdp, {
                    min: bitrates * 8 * 1024,
                    max: bitrates * 8 * 1024,
                });
            }    
            return sdp;
        };
        // END_FIX_VIDEO_AUTO_PAUSE_ISSUES
        
        // https://www.rtcmulticonnection.org/docs/iceServers/
        // use your own TURN-server here!
        connection.iceServers = [{
            'urls': [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun.l.google.com:19302?transport=udp',
            ]
        }];
        
        connection.videosContainer = document.getElementById('videos-container');

        connection.onstream = function(event) {       
            var existing = document.getElementById(event.streamid);
            if(existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }
        
            event.mediaElement.removeAttribute('src');
            event.mediaElement.removeAttribute('srcObject');
            event.mediaElement.muted = true;
            event.mediaElement.volume = 0;
        
            var video = document.createElement('video');
        
            try {
                video.setAttributeNode(document.createAttribute('autoplay'));
                video.setAttributeNode(document.createAttribute('playsinline')); 
                video.style.width = '250px';
                video.classNameName = "video-section";
          //      video.style.paddingTop = '2px';
            } catch (e) {
                video.setAttribute('autoplay', true);
                video.setAttribute('playsinline', true);
            }
        
            if(event.type === 'local') {
            video.volume = 0;
            try {
                video.setAttributeNode(document.createAttribute('muted'));
            } catch (e) {
                video.setAttribute('muted', true);
            }
            }
            video.srcObject = event.stream;   
        
            
            var width = parseInt(connection.videosContainer.clientWidth / 3) - 20;
        
            var mediaElement = getHTMLMediaElement(video, {
                title: "ankur",
                buttons: ['full-screen'],
                width: width,
                showOnMouseEnter: false
            });
        
            console.log('mediaElement ',mediaElement);
            connection.videosContainer.appendChild(mediaElement);
        
            setTimeout(function() {
                mediaElement.media.play();
            }, 5000);
        
            mediaElement.id = event.streamid;
        
            // to keep room-id in cache
            localStorage.setItem(connection.socketMessageEvent, connection.sessionid);   
            
            var chkRecordConference = document.getElementById('record-entire-conference');    
        
        //  chkRecordConference.parentNode.style.display = 'none';
        
            if(chkRecordConference.checked === true) {
            //  btnStopRecording.style.display = 'inline-block';
        //      recordingStatus.style.display = 'inline-block';
        
            var recorder = connection.recorder;
            if(!recorder) {
                recorder = RecordRTC([event.stream], {
                type: 'video'
                });
                recorder.startRecording();
                connection.recorder = recorder;
            }
            else {
                recorder.getInternalRecorder().addStreams([event.stream]);
            }
        
            if(!connection.recorder.streams) {
                connection.recorder.streams = [];
            }
        
            connection.recorder.streams.push(event.stream);
        //     recordingStatus.innerHTML = 'Recording ' + this.connection.recorder.streams.length + ' streams';
            }
        
            if(event.type === 'local') {
            connection.socket.on('disconnect', function() {
                if(!connection.getAllParticipants().length) {
            //    location.reload();
                }
            });
            }
        };
    })


    const openRoom = () => {     
        connection.open("abcdef", function(isRoomOpened, roomid, error) {
          if(isRoomOpened === true) {
            showRoomURL();
          }
          else {
         //   disableInputButtons(true);
            if(error === 'Room not available') {
              alert('Someone already created this room. Please either join or create a separate room.');
              return;
            }
            alert(error);
          }
      });    
    }

    const  showRoomURL = () => {
        console.log('test showRoolURL');    
        var roomHashURL = '#' + "abcdef";
        var roomQueryStringURL = '?roomid=' + "abcdef";
        var html = '<h2>Unique URL for your room:</h2><br>';
    
        html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
        html += '<br>';
        html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';
        var roomURLsDiv = document.getElementById('room-urls');
        roomURLsDiv.innerHTML = html;
       
        roomURLsDiv.style.display = 'block';
        setState({...state,urls:html});
    }

    const joinRoom = () => {
        // this.newButton();
         connection.join(document.getElementById('room-id').value, function(isJoinedRoom, roomid, error) {
           if (error) {
               //  disableInputButtons(true);
                 if(error === 'Room not available') {
                   alert('This room does not exist. Please either create it or wait for moderator to enter in the room.');
                   return;
                }
                 alert(error);
            }
        });
    }


   return (
        <>
            {/* <div id="room-urls" value={state.urls}></div>
            <input type="text" id="room-id" value="abcdef" autocorrect="off" autocapitalize="off"/>
            <button onClick={openRoom}>Open Room</button>
            <button onClick={joinRoom}>Join Room</button>
            <div id="videos-container"></div> */}

<input type="text" id="room-id" value="abcdef" autocorrect="off" autocapitalize="off"/>

<div id="room-urls" value={state.urls}></div>

{/* <div id="videos-container" style={{"margin": "20px 0"}} className="video-section"></div>   */}  



<div className="wrapper">
  <div className="container-fluid">
    <div className="row">
        <div className="col-lg-3 col-md-3 col-sm-12 pr-0">
                <div className="video-main">
                <div id="videos-container">
                    <div >
                        <img src="images/team-1.jpg"/>
                    </div>
                    <div className="user-info">
                        <div className="user-mute">
                           <a href="#" className="mute">  <i className="fa fa-microphone" aria-hidden="true"></i></a>
                           
                        </div>
                        <div className="user-name">
                            Bill Gates
                        </div>
                    </div>
                </div>  </div> 
        </div>
        <div className="col-lg-3 col-md-3 col-sm-12 p-0">
            <div className="video-section">
                <div className="video-main">
                    <img src="images/team-2.jpg"/>
                </div>
                <div className="user-info">
                    <div className="user-mute">
                       <a href="#" className="mute">  <i className="fa fa-microphone" aria-hidden="true"></i></a>

                    </div>
                    <div className="user-name">
                        User Name
                    </div>
                </div>
            </div>
    </div>
    <div className="col-lg-3 col-md-3 col-sm-12 p-0">
        <div className="video-section">
            <div className="video-main">
                <img src="images/team-3.jpg"/>
            </div>
            <div className="user-info">
                <div className="user-mute">
                   <a href="#" className="mute">  <i className="fa fa-microphone" aria-hidden="true"></i></a>

                </div>
                <div className="user-name">
                    User Name
                </div>
            </div>
        </div>
</div>
<div className="col-lg-3 col-md-3 col-sm-12 pl-0">
    <div className="video-section">
        <div className="video-main">
            <img src="images/team-4.jpg"/>
        </div>
        <div className="user-info">
            <div className="user-mute">
               <a href="#" className="mute">  <i className="fa fa-microphone" aria-hidden="true"></i></a>

            </div>
            <div className="user-name">
                User Name
            </div>
        </div>
    </div>
</div>
                  
             
<div className="col-lg-3 col-md-3 col-sm-12 pr-0">
    <div className="video-section">
        <div className="video-main">
            <img src="images/team-4.jpg"/>
        </div>
        <div className="user-info">
            <div className="user-mute">
               <a href="#" className="mute">  <i className="fa fa-microphone" aria-hidden="true"></i></a>

            </div>
            <div className="user-name">
                Bill Gates
            </div>
        </div>
    </div>  
</div>
<div className="col-lg-3 col-md-3 col-sm-12 p-0">
<div className="video-section">
    <div className="video-main">
        <img src="images/user-5.jpg"/>
    </div>
    <div className="user-info">
        <div className="user-mute">
           <a href="#" className="mute"> <i className="fa fa-microphone-slash" aria-hidden="true"></i></a>

        </div>
        <div className="user-name">
            User Name
        </div>
    </div>
</div>
</div>
<div className="col-lg-3 col-md-3 col-sm-12 p-0">
<div className="video-section">
<div className="video-main">
    <img src="images/team-3.jpg"/>
</div>
<div className="user-info">
    <div className="user-mute">
       <a href="#" className="mute">  <i className="fa fa-microphone" aria-hidden="true"></i></a>

    </div>
    <div className="user-name">
        User Name
    </div>
</div>
</div>
</div>
<div className="col-lg-3 col-md-3 col-sm-12 pl-0">
<div className="video-section">
<div className="video-main">
<img src="images/team-1.jpg"/>
</div>
<div className="user-info">
<div className="user-mute">
   <a href="#" className="mute">  <i className="fa fa-microphone" aria-hidden="true"></i></a>

</div>
<div className="user-name">
    User Name
</div>
</div>
</div>
</div>    
          
    </div>
  </div> 
  <div className="video-control pt-3 pb-3">
      <div className="container">
        <div className="form-inline video-form-section">
            <label for="email">Metting Id :</label>
            <input type="text" value="abcdef" className="form-control" placeholder="Enter Metting Id" id="metting"/>
            <button onClick={openRoom}>Open Room</button>
            <button onClick={joinRoom}>Join Room</button>
          </div>
          <div className="">

          </div>
      </div>
</div>        
</div>

        </>
   )
}

export default VideoChat;