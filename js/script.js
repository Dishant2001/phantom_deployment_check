import {
  HMSReactiveStore,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectPeers,
  selectLocalPeerRole
} from "https://cdn.skypack.dev/@100mslive/hms-video-store";

// Initialize HMS Store
const hmsManager = new HMSReactiveStore();
hmsManager.triggerOnSubscribe();
const hmsStore = hmsManager.getStore();
const hmsActions = hmsManager.getHMSActions();


// HTML elements
const form = document.getElementById("join");
const joinBtn = document.getElementById("join-btn");
const joinBtnGuest = document.getElementById('join-btn-guest');
// const conference = document.getElementById("conference");
const peersContainer = document.getElementById("hostContainer");
const guestContainer = document.getElementById("guestContainer");
const queueContainer = document.getElementById("queue");
const startRoomBtn = document.getElementById('header-right-btn');
const leaveBtn = document.getElementById("leave-btn");
const coffeeCont = document.getElementById("coffee");
const confCont = document.getElementById('confirm-cont');

const announcementScreen = document.getElementById('announce-mssg');
const announcementReview = document.getElementById('announce-next');
const queueClosedMssg = document.getElementById('queue-closed');
const cameraScreenStart = document.getElementById('camera-start');
const recVideo = document.getElementById('recorded-video');

const mssgCont = document.getElementById("announcement-mssg");

const reviewPage1 = document.getElementById('candidate-review-1');
const reviewPage2 = document.getElementById('candidate-review-2')

// const muteAud = document.getElementById("mute-aud");
// const muteVid = document.getElementById("mute-vid");
// const controls = document.getElementById("controls");

var media_recorder = null;
var camera_stream = null;
var isHostHere = false, isGuesthere = false;

var someoneInQueue = false,checkTurn = 1;

var queueOpen = true;
var screenOverlay = false;



// const webSocketClient = new WebSocket("wss://3.137.162.168:5000");
const webSocketClient = new WebSocket("ws://localhost:5000");

webSocketClient.onclose = function () {
  console.log("Connection closed!");
}

webSocketClient.onopen = function () {
  console.log("Connected to server!");
  // const data={'mssg':'hello!'};
  // webSocketClient.send(JSON.stringify(data));

  var data;
  var username = '<none>';
  var queue;
  var count = 1, nextcount = 1, inQueue = true;
  webSocketClient.onmessage = function (message) {
    var mssg_response=JSON.parse(message.data);
    if((mssg_response['front']!=null||mssg_response['front']!=undefined)&&checkTurn==1){
      console.log("Someone is giving interview or had his interview done");
      someoneInQueue = true;
      checkTurn = 2;
    }

    if(mssg_response['closed']&&!mssg_response['queue'].includes(username)&&!isHostHere){
      console.log("Queue has been closed! Sorry!");
      queueClosedMssg.style.display="block";
      peersContainer.style.display="none";
    }

    else{

      queueClosedMssg.style.display="none";
      if(!screenOverlay)
        peersContainer.style.display="block";

      if (mssg_response['break']) {
        var peerContent = h(
          "img",
          {
            style: "width:100%;aspect-ratio:16/9;z-index:200;",
            src: "img/coffee.png"
          },
        );
        // peersContainer.innerHTML="";
        coffeeCont.append(peerContent);
      }
      else if (mssg_response['mssg']!='' && !isGuesthere && !isHostHere) {
        console.log(JSON.parse(message.data)['mssg']);
        var mssg = JSON.parse(message.data)['mssg'];
        var mssgCont = h(
          "div",
          {
            id: "announcement-mssg",
          },
          h(
            "div",
            {
              id: "mssg-img"
            },
            h(
              "img",
              {
                src: "img/hand.png"
              },
              ""
            ),
          ),
          h(
            "div",
            {
              id: "mssg-mssg"
            },
            mssg
          )
        );
        peersContainer.append(mssgCont);
        // mssgCont.style.display="flex";
  
      }
      else if (mssg_response['blobData']!='') {
        var recData = mssg_response['blobData']
        console.log(recData);
        if (!isHostHere && !isGuesthere && username != "<none>") {
          peersContainer.innerHTML = "";
          var video_rec = h(
            "video",
            {
              style: "width:100%;aspect-ratio:16/9;border-radius:24px;",
              src: recData,
              autoplay: true,
              muted: true,
              playsinline: true,
            }
          );
          // recVideo.src=recData['blobData'];
          peersContainer.append(video_rec);
        }
      }
  
      else {
  
        
          data = mssg_response;
          var conf = false;
          console.log("Received: ", data);
          console.log(`Username:${username}  Queue Front:${data.front}`);
          if (data && data.front == username) {
            console.log('Its your turn');
            if (count == 1)
              // conf = confirm('Host is inviting you inside. Are you ready?');
              confCont.style.display = "flex";
            const confBtn = document.getElementById('confirm-btn');
            confBtn.addEventListener('click', () => {
              --count;
              confCont.style.display = "none";
              hmsStore.subscribe(renderPeers, selectPeers);
            });
          }
          if (data && data.next == username) {
            console.log('You are next');
            if (nextcount == 1)
              alert('You are next!');
            --nextcount;
          }
    
          queueContainer.innerHTML = "";
    
          if (data && inQueue) {
            queue = data.queue;
            var colors = ['#36F599', '#ff3b4e', '#4c67f4', '#ffad0e', '#8f3eb5', '#faf25d'];
            for (var i = 0; i < queue.length; ++i) {
              let x = Math.floor(Math.random() * colors.length);
              console.log(colors[x]);
              var ith_guest = queue[i];
              console.log(ith_guest);
              const queueEle = h(
                "div",
                {
                  class: "queue-ele",
                  style: "background-color:" + colors[x] + ";"
                },
                h(
                  "span",
                  {
    
                  },
                  ith_guest[0].toUpperCase()
                )
              );
    
              queueContainer.append(queueEle);
            }
          }
  
      }
    }



  };




  var guests = {};
  var isHost = false;
  var host_key = '', guest_key = '', token = '', room_id = '6316e1c3b1e780e78c3d1dcf';

  // startRoomBtn.addEventListener("click",async() => {
  //   const response = await fetch('https://mytestsite.net.in/room',{method:'POST'});
  //   const data = await response.json();
  //   console.log(data);
  //   host_key=data['host_key'];
  //   guest_key=data['guest_key'];
  //   room_id=data.room_details.id;
  //   token=data['token'];
  // });

  // Joining the room



  joinBtn.addEventListener("click", () => {
    hmsActions.join({
      userName: document.getElementById("name").value,
      // authToken: host_key,
      authToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTEiLCJyb2xlIjoiaG9zdCIsImp0aSI6ImU5MDg0ZmI3LWFlNWMtNDNiZi1hYTQ5LTk4M2U5Yzk5N2JlOSIsImV4cCI6MTY2NTUwMjU3MiwiaWF0IjoxNjY1NDE2MTcyLCJuYmYiOjE2NjU0MTYxNzJ9.pksT83d2NOl97lqumtzcdwwL_MQ1g6e7wjo4KziydlU",
      settings: {
        isAudioMuted: false,
        isVideoMuted: false
      },
      rememberDeviceSelection: true,
    });
    const role = hmsStore.getState(selectLocalPeerRole);
    console.log(role)
    isHostHere = true;
    peersContainer.style.display="none";
    cameraScreenStart.style.display="flex";
    // cameraScreenStart.append(hostControls);
    setTimeout(()=>{
      cameraScreenStart.style.display="none";
      peersContainer.style.display="block";
      hmsStore.subscribe(renderPeers, selectPeers);
      webSocketClient.send('/startRecording');
    },5000);
    

    //   async function start(){
    //     console.log('entered inside');
    //     const params = {
    //         meetingURL: `https://dishanttrial1.app.100ms.live/preview/${room_id}/host?skip_preview=true`,
    //         record: true
    //     };
    //     try {
    //         await hmsActions.startRTMPOrRecording(params);
    //     } catch(err) {
    //         console.error("failed to start RTMP/recording", err);
    //     }
    // }
    // start();


    (async function recordLoop() {
      var blobs_recorded = [];
      camera_stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1920, height: 1080 } });
      media_recorder = new MediaRecorder(camera_stream, { mimeType: 'video/webm' });
      media_recorder.addEventListener('dataavailable', async function (e) {
        console.log("Recording: ", new Blob([e.data], { type: 'video/webm' }));
        blobs_recorded.push(e.data);
      });
      media_recorder.addEventListener('stop', async function () {
        let video_local = URL.createObjectURL(new Blob(blobs_recorded, { type: 'video/webm' }));
        console.log("video url: ", video_local);
        // recVideo.src=video_local;
        webSocketClient.send(JSON.stringify({ 'blobData': video_local }));

      });
      media_recorder.start();
      setTimeout(() => {
        media_recorder.stop();
        recordLoop();
      }, 5000);
    })();



  });

  // joinBtnGuest.addEventListener("click", async () => {
  //   // const response = await fetch('http://localhost:5000/guestkey',{method:'POST'});
  //   // const data = await response.json();
  //   hmsActions.join({
  //     userName: document.getElementById("name").value,
  //     // authToken: guest_key,
  //     authToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTIiLCJyb2xlIjoiZ3Vlc3QiLCJqdGkiOiI5ODA5Njg4ZS1jZDM4LTQwZjctYWFjMy04NGM3ODdjZGQwMmMiLCJleHAiOjE2NjQxMzU2NjAsImlhdCI6MTY2NDA0OTI2MCwibmJmIjoxNjY0MDQ5MjYwfQ.ZJjHrSDkiA4JT-FAAbNYvT8PzOgP5xZG2gs_6uM1Rjo',
  //     settings: {
  //       isAudioMuted: true,
  //       isVideoMuted: true
  //     },
  //     rememberDeviceSelection: true,
  //   });
  //   const role = hmsStore.getState(selectLocalPeerRole);
  //   console.log(role)
  // });


  var q = new Array();
  var q_top = '', q_next = '';
  joinBtnGuest.addEventListener('click', async () => {
    username = document.getElementById("name").value;
    // const response = await fetch('http://127.0.0.1:5000/enqueue',{
    //   mode:'cors',
    //   method:'POST',
    //   headers: { "Content-Type": "application/json"},
    //   body: JSON.stringify({'user':username})
    // });
    webSocketClient.send(username);

    // console.log(resp_data);
  });

  function queueCall() {
    console.log(username);
    if (q.length > 0)
      console.log(q[0]);
    if (q && username == q[0].user) {
      console.log(`username: ${username} queuefront: ${q[0].user}`);
      console.log('You are in');
    }
  }
  if (q_top != '') {
    queueCall();
  }

  var leave_count = 1;

  // Leaving the room
  function leaveRoom() {
    if (leave_count > 0) {
      hmsActions.leave();
      if (data && username == data.front) {
        username = '<none>';
        inQueue = false;
        // if(mssg_response['next']==null)
        //   webSocketClient.send('pop');
      }
      else {
        webSocketClient.send('/stopRecording');
        try {
          media_recorder.stop();
        } catch (error) {
          console.log(error);
        }
      }

      //   async function stop() {
      //     try {
      //         await hmsActions.stopRTMPAndRecording();
      //     } catch (err) {
      //         console.error("failed to stop RTMP/recording", err);
      //     }
      // }
      // stop();

    }
    // webSocketClient.close();
  }

  // Cleanup if user refreshes the tab or navigates away
  window.onunload = window.onbeforeunload = () => {
    if (leave_count > 0)
      leaveRoom;
  };
  leaveBtn.addEventListener("click", leaveRoom);

  // helper function to create html elements
  function h(tag, attrs = {}, ...children) {
    const newElement = document.createElement(tag);

    Object.keys(attrs).forEach((key) => {
      newElement.setAttribute(key, attrs[key]);
    });

    children.forEach((child) => {
      newElement.append(child);
    });

    return newElement;
  }

  // display a tile for each peer in the peer list
  var audioOn = false;

  function buttonControl() {
    const mic = document.getElementById('mic');
    const call = document.getElementById('call');
    const cam = document.getElementById('video');
    const chat = document.getElementById('chat');

    if (mic.getAttribute('listener') !== 'true') {
      mic.addEventListener('click', () => {
        const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
        hmsActions.setLocalAudioEnabled(audioEnabled);
        console.log('Audio: ', audioEnabled);
        mic.style.backgroundColor = audioEnabled ? "#fafafb" : "#ff3459";
        mic.setAttribute('listener', 'true');
      });
    }

    if (cam.getAttribute('listener') !== 'true') {
      cam.addEventListener('click', () => {
        const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
        hmsActions.setLocalVideoEnabled(videoEnabled);
        cam.style.backgroundColor = videoEnabled ? "#fafafb" : "#ff3459";
        cam.setAttribute('listener', 'true');
        renderPeers();
      });
    }

    if (call.getAttribute('listener') !== 'true') {
      call.addEventListener('click', () => {
        call.setAttribute('listener', 'true');
        leaveRoom();
      });
    }

    if (chat.getAttribute('listener') !== 'true') {
      chat.addEventListener('click', () => {
        screenOverlay = true;
        console.log("Chat key pressed!");
        cam.click()
        mic.click();
        peersContainer.style.display = "none";
        announcementScreen.style.display = "flex";

        document.getElementById('announce').addEventListener('click', () => {
          var mssg = document.getElementById('announcement');
          console.log(mssg.value);
          webSocketClient.send('broadcast/' + mssg.value);
          peersContainer.style.display = "none";
          announcementScreen.style.display = "none";
          announcementReview.style.display = "flex";
          document.getElementById('mssg-text').innerHTML=mssg.value;
          // peersContainer.style.display = "none";
          document.getElementById('announce-ok').addEventListener('click',()=>{
            announcementReview.style.display = "none";
            peersContainer.style.display = "block";
            screenOverlay = false;
            cam.click()
            mic.click();

          });
          // mssg.value="";
        });
      });
    }

  }

  var coffeeBreak = false;



  var temp = 0
  var guests = 0;
  var readyToGoIn = false;
  var enterInCall = false;
  var ele = undefined;

  async function renderPeers(peers) {

    // const response = await fetch('http://127.0.0.1:5000/getQueue',{
    //   mode:'cors',
    //   headers:{'Content-Type':'application/json'}
    // });
    // const resp_data=await response.json();

    // q=resp_data.queue;
    // q_top=resp_data.top;
    // q_next=resp_data.next;
    // console.log('Current Queue: ',q);
    if (data != undefined && username == data.front) {
      hmsActions.join({
        userName: username,
        // authToken: guest_key,
        authToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTIiLCJyb2xlIjoiZ3Vlc3QiLCJqdGkiOiIxYzA4YjU1NS05NzY4LTQzZGUtYWE3My0yNTZjZTAxMTRkZjkiLCJleHAiOjE2NjU1MDI1NzIsImlhdCI6MTY2NTQxNjE3MiwibmJmIjoxNjY1NDE2MTcyfQ.-PisbcMggBqYWO-hpRLlF-N9BnpmeJwSaM3pcQY1T0E',
        settings: {
          isAudioMuted: true,
          isVideoMuted: true
        },
        rememberDeviceSelection: false,
      });
      isGuesthere = true;
      console.log('joined in as Guest also!!!');
    }

    peersContainer.innerHTML = "";
    // queueContainer.innerHTML = "";


    if (!peers) {
      // this allows us to make peer list an optional argument
      peers = hmsStore.getState(selectPeers);
    }


    // var video='';

    // const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
    // console.log('Video is: ',videoEnabled);
    // hmsActions.setLocalVideoEnabled(videoEnabled);


    const guestContainer = h(
      "div",
      {
        class: "guestContainer",
      }
    );

    const controlContainer = h(
      "div",
      {
        class: "controls",
        style: "position: absolute;top:86%;display: flex;flex-direction: row;justify-content: center;background:none;width: 70%;height: 10%;z-index: 0;"
      },
      h(
        "div",
        {
          id: "setting",
          listener: 'false',
          style: "margin:auto;display: flex;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
        },
        h(
          "img",
          {
            src: "img/setting.png",
            style: "margin:auto;width:50%;"
          }
        )
      ),
      h(
        "div",
        {
          id: "mic",
          listener: 'false',
          style: "margin:auto;display: flex;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
        },
        h(
          "img",
          {
            src: "img/mic.png",
            style: "margin:auto;width:50%;"
          }
        )
      ),
      h(
        "div",
        {
          id: "call",
          listener: 'false',
          style: "margin:auto;display: flex;background-color: #4C67F4;height: 100%;aspect-ratio:1;z-index: 0;border-radius:23px;"
        },
        h(
          "img",
          {
            src: "img/receiver.png",
            style: "margin:auto;width:50%;"
          }
        )
      ),
      h(
        "div",
        {
          id: "video",
          listener: 'false',
          style: "margin:auto;display: flex;background-color:" + (true ? "#FAFAFB;" : "#ff3459;") + "height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
        },
        h(
          "img",
          {
            src: "img/cam.png",
            style: "margin:auto;width:50%;"
          }
        )
      ),
      h(
        "div",
        {
          id: "chat",
          listener: 'false',
          style: "margin:auto;display: flex;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
        },
        h(
          "img",
          {
            src: "img/chat-1.png",
            style: "margin:auto;width:50%;"
          }
        )
      )
    );

    const hostControls = h(
      "div",
      {
        class: "hostControls"
      },
      h(
        "div",
        {
          id: "remove-person",
        },
        h(
          "img",
          {
            src: "img/out.png",
            style: "margin:auto;width:50%;"
          }
        )
      ),
      h(
        "div",
        {
          id: "add-person"
        },
        h(
          "img",
          {
            src: "img/person.png",
            style: "margin:auto;width:50%;"
          }
        )
      ),
      h(
        "div",
        {
          id: "q-close"
        },
        h(
          "img",
          {
            src: "img/Q.png",
            style: "margin:auto;width:50%;"
          }
        )
      ),
      h(
        "div",
        {
          id: "coffee-break"
        },
        h(
          "img",
          {
            src: "img/coffee.png",
            style: "margin:auto;width:50%;"
          }
        )
      ),
      h(
        "div",
        {
          id: "chat"
        },
        h(
          "img",
          {
            src: "img/chat.png",
            style: "margin:auto;width:50%;"
          }
        )
      )
    );

    var hosts = [], guests = [];
    var countHost = 0;
    var countGuest = 0;
    var checkIfHost = false;

    peers.forEach((peer) => {
      if (peer.roleName == 'host') {
        ++countHost;
        hosts.push(peer);
      }
      else if (peer.roleName == 'guest') {
        ++countGuest;
        if (peer.isLocal)
          guests.push(peer);
        ele = peer;
      }
    });

    if (countHost > 0) {

      var peer = hosts[0];
      console.log(peer);
      // ele=guests[0];
      console.log(ele);
      var video;
      if (peer.videoTrack) {
        video = h("video", {
          class: "peer-video" + (peer.isLocal ? " local" : ""),
          autoplay: true, // if video doesn't play we'll see a blank tile
          muted: true,
          playsinline: true,
          style: "display:inline-flex;position:absolute;top:0;margin:auto;" + (peer.isLocal ? "transform: scale(-1, 1);filter:FlipH;" : "") + "width:" + 100 / countHost + "%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
        });

        // this method takes a track ID and attaches that video track to a given
        // <video> element
        hmsActions.attachVideo(peer.videoTrack, video);
        if (peer.isLocal) {
          checkIfHost = true;
        }
      }

      if (ele != undefined && ele.videoTrack && video != undefined) {

        var video_guest;
        if (ele.isLocal) {
          video_guest = h("video", {
            class: "peer-video" + (ele.isLocal ? " local" : ""),
            autoplay: true, // if video doesn't play we'll see a blank tile
            muted: true,
            playsinline: true,
            style: "position:absolute;top:0;margin:auto;transform: scale(-1, 1);width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
          });
        }
        else {
          video_guest = h("video", {
            class: "peer-video" + (ele.isLocal ? " local" : ""),
            autoplay: true, // if video doesn't play we'll see a blank tile
            muted: true,
            playsinline: true,
            style: "position:absolute;top:0;margin:auto;width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
          });
        }


        hmsActions.attachVideo(ele.videoTrack, video_guest);
        var temp_arr = [];
        if (ele.isLocal) {
          temp_arr = [video, video_guest];
        }
        else {
          temp_arr = [video_guest, video];
        }
        var peerContainer;
        if (checkIfHost) {

          peerContainer = h(
            "div",
            {
              class: "peer-container",
              style: "margin-bottom:min(8vh,8vw);position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
            },
            temp_arr[0],
            h(
              "div",
              {
                class: "peer-name"
              },
              ele.name + (ele.isLocal ? " (You)" : "")
            ),
            h(
              "div",
              {
                class: "guestContainer",
              },
              temp_arr[1]
            ),
            controlContainer,
            hostControls
          );

          peersContainer.innerHTML = "";
          // if(top_guest.isLocal&&confirm("Host is inviting you inside"))
          peersContainer.append(peerContainer);

          buttonControl();

          document.getElementById('remove-person').addEventListener('click', async () => {
            var remPer = document.getElementById('remove-person');
            remPer.setAttribute("disabled",false);
            await hmsActions.removePeer(ele.id, '');
            // webSocketClient.send(`remove/${ele.name}`);
            // webSocketClient.send('pop');
          });

          document.getElementById('q-close').addEventListener('click', () => {
            if(queueOpen){
              webSocketClient.send('/closeQueue');
              queueOpen=false;
            }
            else{
              webSocketClient.send('/openQueue');
              queueOpen=true;
            }

          });

          document.getElementById('add-person').addEventListener('click',()=>{
            var addPer = document.getElementById('add-person');
            addPer.setAttribute('disabled',true);
            // webSocketClient.send('pop');
          });

          document.getElementById('coffee-break').addEventListener('click', () => {
            if (!coffeeBreak) {
              coffeeBreak = true;
              webSocketClient.send('/coffeeBreak');
              coffeeCont.style.display = "block";
            }
            else {
              coffeeBreak = false;
              webSocketClient.send('/breakOver');
              coffeeCont.style.display = "none";
            }
          });

        }
        else {
          peerContainer = h(
            "div",
            {
              class: "peer-container",
              style: "position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
            },
            temp_arr[0],
            h(
              "div",
              {
                class: "peer-name"
              },
              ele.name + (ele.isLocal ? " (You)" : "")
            ),
            h(
              "div",
              {
                class: "guestContainer",
              },
              temp_arr[1]
            ),
            controlContainer
          );
          peersContainer.innerHTML = "";
          // if(top_guest.isLocal&&confirm("Host is inviting you inside"))
          peersContainer.append(peerContainer);

          buttonControl();
        }
      }

      else if(isHostHere&&!screenOverlay){
        const peerContainer = h(
          "div",
          {
            class: "peer-container",
            style: "margin-bottom:min(5vh,10vw);display:flex;flex-direction:row;flex-wrap:wrap;position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
          },
          video,
          h(
            "div",
            {
              class: "peer-name"
            },
            peer.name + (peer.isLocal ? " (You)" : "")
          ),
          h(
            "div",
            {
              class: "guestContainer",
            },
            video
          ),
          controlContainer,
          hostControls
        );







        peersContainer.append(peerContainer);
        // peersContainer.append(hostControls);
        // peersContainer.append(controlContainer);
        // peersContainer.append(guestContainer);

        // document.getElementById('remove-person').addEventListener('click',()=>{
        //   var currrently_in = Object.values(queue.peek())[0];
        //   console.log("Currently interviewd: ",currrently_in);
        // });

        buttonControl();

        document.getElementById('remove-person').addEventListener('click', async () => {
          var remPer = document.getElementById('remove-person');
          remPer.setAttribute("disabled",true);
          // await hmsActions.removePeer(ele.id, '');
          // // webSocketClient.send('pop');
          // webSocketClient.send(`remove/${ele.name}`);

        });

        document.getElementById('q-close').addEventListener('click', () => {
          if(queueOpen){
            webSocketClient.send('/closeQueue');
            queueOpen=false;
          }
          else{
            webSocketClient.send('/openQueue');
            queueOpen=true;
          }

        });

        document.getElementById('add-person').addEventListener('click',()=>{
          var addPer = document.getElementById('add-person');
            screenOverlay = true
              addPer.setAttribute('disabled',false);
            peersContainer.style.display="none";
            reviewPage1.style.display="flex";
            var nextButton = document.getElementById('review-next');
            nextButton.addEventListener('click',()=>{
              reviewPage1.style.display="none";
              reviewPage2.style.display="flex";
              var submitFeed = document.getElementById('review-submit');
              submitFeed.addEventListener('click',()=>{
                reviewPage2.style.display="none";
                peersContainer.style.display="block";
                screenOverlay = false;
                webSocketClient.send('pop');
              });
            });
        });

        document.getElementById('coffee-break').addEventListener('click', () => {
          if (!coffeeBreak) {
            coffeeBreak = true;
            webSocketClient.send('/coffeeBreak');
            coffeeCont.style.display = "block";
          }
          else {
            coffeeBreak = false;
            webSocketClient.send('/breakOver');
            coffeeCont.style.display = "none";
          }
        });
      }
    }


    // peers.forEach((peer) => {

    //   if (peer.roleName == 'host') {

    //     console.log('No. of hosts: ',Object.keys(hosts).length);
    //     console.log('Host arrived');
    //     if (peer.videoTrack) {
    //       video = h("video", {
    //         class: "peer-video" + (peer.isLocal ? " local" : ""),
    //         autoplay: true, // if video doesn't play we'll see a blank tile
    //         muted: true,
    //         playsinline: true,
    //         style: "display:inline-flex;position:absolute;top:0;margin:auto;transform: scale(-1, 1); filter: FlipH;width:"+100/countHost+"%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
    //       });

    //       // this method takes a track ID and attaches that video track to a given
    //       // <video> element
    //       hmsActions.attachVideo(peer.videoTrack, video);

    //       if(peer.isLocal){
    //         checkIfHost=true;
    //       }




    //       const peerContainer = h(
    //         "div",
    //         {
    //           class: "peer-container",
    //           style:"display:flex;flex-direction:row;flex-wrap:wrap;position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
    //         },
    //         video,
    //         h(
    //           "div",
    //           {
    //             class: "peer-name"
    //           },
    //           peer.name + (peer.isLocal ? " (You)" : "")
    //         ),
    //         h(
    //           "div",
    //           {
    //             class:"guestContainer",
    //           },
    //           video
    //         ),
    //           controlContainer,
    //           hostControls
    //       );







    //       peersContainer.append(peerContainer);
    //       // peersContainer.append(hostControls);
    //       // peersContainer.append(controlContainer);
    //       // peersContainer.append(guestContainer);

    //       // document.getElementById('remove-person').addEventListener('click',()=>{
    //       //   var currrently_in = Object.values(queue.peek())[0];
    //       //   console.log("Currently interviewd: ",currrently_in);
    //       // });

    //       buttonControl();

    //       document.getElementById('remove-person').addEventListener('click',async()=>{
    //         var currrently_in = Object.values(queue.peek())[0];
    //         console.log("Currently interviewd: ",currrently_in);
    //         await hmsActions.removePeer(currrently_in.id, '');
    //       });


    //     }
    //   }
    //   else {
    //     ele = peer;


    //     if(peer.isLocal){
    //       if (peer.videoTrack) {
    //         const video_temp = h("video", {
    //           class: "peer-video" + (peer.isLocal ? " local" : ""),
    //           autoplay: true, // if video doesn't play we'll see a blank tile
    //           muted: true,
    //           playsinline: true,
    //           style: "display:inline-flex;position:absolute;top:0;margin:auto;transform: scale(-1, 1); filter: FlipH;width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
    //         });

    //         // this method takes a track ID and attaches that video track to a given
    //         // <video> element
    //         hmsActions.attachVideo(peer.videoTrack, video_temp);

    //         // if(peer.isLocal){
    //         //   checkIfHost=true;
    //         // }




    //         const peerContainer = h(
    //           "div",
    //           {
    //             class: "peer-container",
    //             style:"display:flex;flex-direction:row;flex-wrap:wrap;position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
    //           },
    //           video_temp,
    //           h(
    //             "div",
    //             {
    //               class: "peer-name"
    //             },
    //             peer.name + (peer.isLocal ? " (You)" : "")
    //           ),
    //           h(
    //             "div",
    //             {
    //               class:"guestContainer",
    //             },
    //             video_temp
    //           ),
    //             controlContainer,
    //         );







    //         peersContainer.append(peerContainer);

    //         buttonControl();

    //     }

    //   }
    // }
    // });

    // if(ele&&countHost>0){

    //   var video_guest;
    //       if(ele.isLocal){
    //         video_guest = h("video", {
    //           class: "peer-video" + (ele.isLocal ? " local" : ""),
    //           autoplay: true, // if video doesn't play we'll see a blank tile
    //           muted: true,
    //           playsinline: true,
    //           style: "position:absolute;top:0;margin:auto;transform: scale(-1, 1);filter: FlipH;width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
    //         });
    //       }
    //       else{
    //         video_guest = h("video", {
    //           class: "peer-video" + (ele.isLocal ? " local" : ""),
    //           autoplay: true, // if video doesn't play we'll see a blank tile
    //           muted: true,
    //           playsinline: true,
    //           style: "position:absolute;top:0;margin:auto;transform: scale(-1, 1);width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
    //         });
    //       }


    //       hmsActions.attachVideo(ele.videoTrack, video_guest);
    //       var temp_arr=[];
    //       if(ele.isLocal){
    //         temp_arr=[video,video_guest];
    //       }
    //       else{
    //         temp_arr=[video_guest,video];
    //       }
    //       var peerContainer;
    //       if(checkIfHost){

    //         peerContainer = h(
    //           "div",
    //           {
    //             class: "peer-container",
    //             style:"position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
    //           },
    //           temp_arr[0],
    //           h(
    //             "div",
    //             {
    //               class: "peer-name"
    //             },
    //             ele.name + (ele.isLocal ? " (You)" : "")
    //           ),
    //           h(
    //             "div",
    //             {
    //               class:"guestContainer",
    //             },
    //             temp_arr[1]
    //           ),
    //             controlContainer,
    //             hostControls
    //         );

    //         peersContainer.innerHTML="";
    //             // if(top_guest.isLocal&&confirm("Host is inviting you inside"))
    //               peersContainer.append(peerContainer);

    //               buttonControl();

    //         document.getElementById('remove-person').addEventListener('click',async()=>{
    //           var currrently_in = Object.values(queue.peek())[0];
    //           console.log("Currently interviewd: ",currrently_in);
    //           await hmsActions.removePeer(currrently_in.id, '');
    //         });

    //       }
    //       else{
    //         peerContainer = h(
    //           "div",
    //           {
    //             class: "peer-container",
    //             style:"position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
    //           },
    //           temp_arr[0],
    //           h(
    //             "div",
    //             {
    //               class: "peer-name"
    //             },
    //             ele.name + (ele.isLocal ? " (You)" : "")
    //           ),
    //           h(
    //             "div",
    //             {
    //               class:"guestContainer",
    //             },
    //             temp_arr[1]
    //           ),
    //             controlContainer
    //             );
    //             peersContainer.innerHTML="";
    //             // if(top_guest.isLocal&&confirm("Host is inviting you inside"))
    //               peersContainer.append(peerContainer);

    //               buttonControl();
    //       }




    // if (peers.length != 0 && queue.size() != 0 && countHost>0) {
    //   console.log(queue.peek());
    //   var top_guest = Object.values(queue.peek())[0];
    //   console.log(top_guest);
    //   if(top_guest.isLocal){


    //     if(!readyToGoIn){
    //       enterInCall = confirm("Host is inviting you inside! Are you ready?");
    //       readyToGoIn=true;
    //     }
    //   }

    //     if (top_guest.videoTrack&&enterInCall) {
    //       var video_guest;
    //       if(top_guest.isLocal){
    //         video_guest = h("video", {
    //           class: "peer-video" + (top_guest.isLocal ? " local" : ""),
    //           autoplay: true, // if video doesn't play we'll see a blank tile
    //           muted: true,
    //           playsinline: true,
    //           style: "position:absolute;top:0;margin:auto;transform: scale(-1, 1);filter: FlipH;width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
    //         });
    //       }
    //       else{
    //         video_guest = h("video", {
    //           class: "peer-video" + (top_guest.isLocal ? " local" : ""),
    //           autoplay: true, // if video doesn't play we'll see a blank tile
    //           muted: true,
    //           playsinline: true,
    //           style: "position:absolute;top:0;margin:auto;transform: scale(-1, 1);width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
    //         });
    //       }


    //       hmsActions.attachVideo(top_guest.videoTrack, video_guest);
    //       var temp_arr=[];
    //       if(top_guest.isLocal){
    //         temp_arr=[video,video_guest];
    //       }
    //       else{
    //         temp_arr=[video_guest,video];
    //       }
    //       var peerContainer;
    //       if(checkIfHost){

    //         peerContainer = h(
    //           "div",
    //           {
    //             class: "peer-container",
    //             style:"position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
    //           },
    //           temp_arr[0],
    //           h(
    //             "div",
    //             {
    //               class: "peer-name"
    //             },
    //             top_guest.name + (top_guest.isLocal ? " (You)" : "")
    //           ),
    //           h(
    //             "div",
    //             {
    //               class:"guestContainer",
    //             },
    //             temp_arr[1]
    //           ),
    //             controlContainer,
    //             hostControls
    //         );

    //         peersContainer.innerHTML="";
    //             // if(top_guest.isLocal&&confirm("Host is inviting you inside"))
    //               peersContainer.append(peerContainer);

    //               buttonControl();

    //         document.getElementById('remove-person').addEventListener('click',async()=>{
    //           var currrently_in = Object.values(queue.peek())[0];
    //           console.log("Currently interviewd: ",currrently_in);
    //           await hmsActions.removePeer(currrently_in.id, '');
    //         });

    //       }
    //       else{
    //         peerContainer = h(
    //           "div",
    //           {
    //             class: "peer-container",
    //             style:"position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
    //           },
    //           temp_arr[0],
    //           h(
    //             "div",
    //             {
    //               class: "peer-name"
    //             },
    //             top_guest.name + (top_guest.isLocal ? " (You)" : "")
    //           ),
    //           h(
    //             "div",
    //             {
    //               class:"guestContainer",
    //             },
    //             temp_arr[1]
    //           ),
    //             controlContainer
    //             );
    //             peersContainer.innerHTML="";
    //             // if(top_guest.isLocal&&confirm("Host is inviting you inside"))
    //               peersContainer.append(peerContainer);

    //               buttonControl();
    //       }

    //   }
    // }


    // const mic=document.getElementById('mic');
    // const call=document.getElementById('call');
    // const cam=document.getElementById('video');
    // mic.addEventListener('click',()=>{
    //   const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
    //   hmsActions.setLocalAudioEnabled(audioEnabled);
    //   mic.style.backgroundColor="#fafafb"?"#ff3459":"#fafafb";
    // });

  }

  // subscribe to the peers, so render is called whenever there is a change like peer join and leave




};




// function renderPeers(peers) {
//   peersContainer.innerHTML = "";

//   if (!peers) {
//     // this allows us to make peer list an optional argument
//     peers = hmsStore.getState(selectPeers);
//   }
//   peers.forEach((peer) => {
//       if(peer['roleName']=='host' && temp==0){
//           hosts[peer['id']]=peer;
//           temp=1;

//           if (peer.videoTrack) {
//             // console.log('Yahan aaya');
//               const video = h("video", {
//                 class: "peer-video" + (peer.isLocal ? " local" : ""),
//                 autoplay: true, // if video doesn't play we'll see a blank tile
//                 muted: true,
//                 playsinline: true,
//                 style:"transform: scale(-1, 1); filter: FlipH;max-width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;margin-top:100px"
//               });


//               // this method takes a track ID and attaches that video track to a given
//               // <video> element
//               hmsActions.attachVideo(peer.videoTrack, video);

//               const peerContainer = h(
//                 "div",
//                 {
//                   class: "peer-container"
//                 },
//                 video,
//                 h(
//                   "div",
//                   {
//                     class: "peer-name"
//                   },
//                   peer.name + (peer.isLocal ? " (You)" : "")
//                 )
//               );

//               peersContainer.append(peerContainer);
//             }

//       }
//       else if(peer['roleName']=='guest'){
//           guests[peer['id']]=peer;
//           const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
//           hmsActions.setLocalVideoEnabled(videoEnabled);
//       }

//       // Object.values(hosts).forEach((peer)=>{
//       //   if (peer.videoTrack) {
//       //     const video = h("video", {
//       //       class: "peer-video" + (peer.isLocal ? " local" : ""),
//       //       autoplay: true, // if video doesn't play we'll see a blank tile
//       //       muted: true,
//       //       playsinline: true,
//       //       style:"transform: scale(-1, 1); filter: FlipH;max-width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;margin-top:100px"
//       //     });


//       //     // this method takes a track ID and attaches that video track to a given
//       //     // <video> element
//       //     hmsActions.attachVideo(peer.videoTrack, video);

//       //     const peerContainer = h(
//       //       "div",
//       //       {
//       //         class: "peer-container"
//       //       },
//       //       video,
//       //       h(
//       //         "div",
//       //         {
//       //           class: "peer-name"
//       //         },
//       //         peer.name + (peer.isLocal ? " (You)" : "")
//       //       )
//       //     );

//       //     peersContainer.append(peerContainer);
//       //   }

//       // })

//   });

//   console.log(hosts);
//   console.log(guests);
// }

// function onConnection(isConnected) {
//   if (isConnected) {
//     form.classList.add("hide");
//     conference.classList.remove("hide");
//     leaveBtn.classList.remove("hide");
//     controls.classList.remove("hide");
//   } else {
//     form.classList.remove("hide");
//     conference.classList.add("hide");
//     leaveBtn.classList.add("hide");
//     controls.classList.add("hide");
//   }
// }

// // reactive state - renderPeers is called whenever there is a change in the peer-list
// hmsStore.subscribe(renderPeers, selectPeers);

// // listen to the connection state
// hmsStore.subscribe(onConnection, selectIsConnectedToRoom);

// muteAud.addEventListener("click", () => {
//   const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);

//   hmsActions.setLocalAudioEnabled(audioEnabled);

//   muteAud.textContent = audioEnabled ? "Mute" : "Unmute";
// });

// muteVid.addEventListener("click", () => {
//   const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);

//   hmsActions.setLocalVideoEnabled(videoEnabled);

//   muteVid.textContent = videoEnabled ? "Hide" : "Unhide";

//   // Re-render video tile
//   renderPeers();
// });
