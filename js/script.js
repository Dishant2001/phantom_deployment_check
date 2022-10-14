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
const reviewPage2 = document.getElementById('candidate-review-2');

const queueBtns = document.getElementById('candidate-queue-btn');

const queueBtns2 = document.getElementById('candidate-queue-btn2');

const feedbackCont = document.getElementById('candidate-feedback-1');

const leaveQ = document.getElementById('leaveQ');

const coffee1 = document.getElementById('coffee-1');
const coffee2 = document.getElementById('coffee-2');

const closeAlert1 = document.getElementById('close-alert1');
const closeAlert2 = document.getElementById('close-alert2');

const breakNotice = document.getElementById('break-notice');

// const muteAud = document.getElementById("mute-aud");
// const muteVid = document.getElementById("mute-vid");
// const controls = document.getElementById("controls");

var media_recorder = null;
var camera_stream = null;
var isHostHere = false, isGuesthere = false;

var someoneInQueue = false, checkTurn = 1;

var queueOpen = true;
var screenOverlay = false;

var isBreak = false;

var tooltipActive = false;
var readyToOpenRoom = false;
var recentBreak = false;




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
  var feedback_check_username = "<none>";
  var queue;
  var count = 1, nextcount = 1, inQueue = false;

  var mssg;


  webSocketClient.onmessage = function (message) {
    var mssg_response = JSON.parse(message.data);
    if ((mssg_response['front'] != null || mssg_response['front'] != undefined) && checkTurn == 1) {
      console.log("Someone is giving interview or had his interview done");
      someoneInQueue = true;
      checkTurn = 2;
    }

    if(!isHostHere&&mssg_response['recentCandidate']==feedback_check_username){
      screenOverlay = true;
      feedback_check_username = "<none>";
      username = "<none>";
      peersContainer.style.display = "none";
      feedbackCont.style.display = "flex";
      const submitFeedbackBtn = document.getElementById('submit-feedback');
      submitFeedbackBtn.addEventListener('click',(event)=>{
        event.stopImmediatePropagation();
        var feedbackCont2 = document.getElementById('candidate-feedback-2');
        feedbackCont.style.display = "none";
        feedbackCont2.style.display = "flex";
      });
    }

    // if (mssg_response['closed'] && !mssg_response['queue'].includes(username) && !isHostHere) {
    //   console.log("Queue has been closed! Sorry!");
    //   // queueClosedMssg.style.display = "block";
    //   // peersContainer.style.display = "none";
    //   queueBtns.style.display="none";
    //           queueBtns2.style.display="flex";
    // }

    if(true) {

      queueClosedMssg.style.display = "none";
      if (!screenOverlay)
        peersContainer.style.display = "block";

      if(!mssg_response['break']&&recentBreak){
        // peersContainer.style.display = "block";
        screenOverlay = false;
        breakNotice.style.display = "none";
        recentBreak = false;
      }

      if (mssg_response['break']&&!isHostHere) {
        peersContainer.style.display = "none";
        screenOverlay = true;
        breakNotice.style.display = "flex";
        var duration = mssg_response['breakDuration'];
        recentBreak = true;

        const timeRemaining = document.getElementById('time-remaining');
        var timeInSeconds = duration*60;
              (async function timer(){
                if(timeInSeconds>0){
                  setTimeout(()=>{
                    var minutes = Math.floor(timeInSeconds/60);
                    var seconds = timeInSeconds%60;
                    if(seconds>=10)
                      timeRemaining.innerText = `${minutes}:${seconds}`;
                    else
                      timeRemaining.innerText = `${minutes}:0${seconds}`;
                    timeInSeconds--;
                    timer();
                  },1000);
                }
                else{
                  console.log("Timer over!");
                  // currentVal = 0;
                  // timeInSeconds = 0;
                  // readyToOpenRoom = false;
                  timeRemaining.innerText = "";
                }
              })();

      }

      else if (mssg_response['mssg'] != '' && !isGuesthere && !isHostHere) {
        console.log(JSON.parse(message.data)['mssg']);
        mssg = JSON.parse(message.data)['mssg'];

        // peersContainer.append(mssgCont);
        // mssgCont.style.display="flex";

      }
      // else if (mssg_response['blobData']!='') {
      //   var recData = mssg_response['blobData']
      //   console.log(recData);
      //   if (!isHostHere && !isGuesthere) {
      //     peersContainer.innerHTML = "";

      //     var mssgCont = h(
      //       "div",
      //       {
      //         id: "announcement-mssg",
      //         style:"background-color:#F1F4FB;display: flex;padding: min(15px,1.5vw);z-index: 200;flex-direction: row;justify-content: space-evenly;border-radius: 20px;width: 50%;aspect-ratio: 20/3;margin: auto;margin-top: -20%;font-family: 'Manrope', sans-serif;font-style: normal;font-weight: 500;text-align: center;font-size: min(15px,1.5vw);"
      //       },
      //       h(
      //         "div",
      //         {
      //           id: "mssg-img"
      //         },
      //         h(
      //           "img",
      //           {
      //             src: "img/hand.png"
      //           },
      //           ""
      //         ),
      //       ),
      //       h(
      //         "div",
      //         {
      //           id: "mssg-mssg"
      //         },
      //         mssg
      //       )
      //     );

      //     var video_rec = h(
      //       "video",
      //       {
      //         style: "width:100%;aspect-ratio:16/9;border-radius:24px;",
      //         src: recData,
      //         autoplay: true,
      //         muted: true,
      //         playsinline: true,
      //       }
      //     );
      //     // recVideo.src=recData['blobData'];
      //     peersContainer.append(video_rec);
      //     if(mssg!=undefined)
      //       peersContainer.append(mssgCont);
      //   }
      // }

      else {


        var recData = mssg_response['blobData'];
        if(recData!=''){
          console.log(recData);
          if (!isHostHere && !isGuesthere) {
            peersContainer.innerHTML = "";

            var mssgCont = h(
              "div",
              {
                id: "announcement-mssg",
                style:"background-color:#F1F4FB;display: flex;padding: min(15px,1.5vw);z-index: 200;flex-direction: row;justify-content: space-evenly;border-radius: 20px;width: 50%;aspect-ratio: 20/3;margin: auto;margin-top: -20%;font-family: 'Manrope', sans-serif;font-style: normal;font-weight: 500;text-align: center;font-size: min(15px,1.5vw);"
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
            if(mssg!=undefined)
              peersContainer.append(mssgCont);
          }
        }




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

        if (data) {
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


        if(!isHostHere){
          queueBtns.style.display="flex";
          queueBtns2.style.display="none";
          const leftBtn1 = document.getElementById('left-btn1');
          const leftBtn2 = document.getElementById('left-btn2');
          const rightBtn = document.getElementById('right-btn');
          rightBtn.style.backgroundColor = "#4c67f4";
          rightBtn.style.color = "#ffffff";
          if(inQueue&&!isGuesthere){
            leftBtn2.style.display="none";
            leftBtn1.addEventListener('click',(event)=>{
              event.stopImmediatePropagation();
              screenOverlay = true;
              peersContainer.style.display="none";
              leaveQ.style.display="flex";
              var yesBtn = document.getElementById('leave-yes');
              var noBtn = document.getElementById('leave-no');
              yesBtn.addEventListener('click',(event)=>{
                event.stopImmediatePropagation();
                var index = data.queue.indexOf(username);
                webSocketClient.send(`<leave>/${index}`);
                inQueue = false;
                username = "<none>";
                leaveQ.style.display="none";
                peersContainer.style.display="block";
              });
              noBtn.addEventListener('click',(event)=>{
                event.stopImmediatePropagation();
                leaveQ.style.display="none";
                peersContainer.style.display="block";
              });

            });
            if(username==data.next){
              leftBtn1.style.display="block";
              rightBtn.innerHTML = "You are next. The room will open soon...";
            }
            else if(username==data.queue[2]){
              leftBtn1.style.display="block";
              rightBtn.innerHTML = "You are 2<sup>nd</sup> in the Q now.";
            }
            else{
              leftBtn1.style.display="block";
              rightBtn.innerHTML = "Please wait. You are in the queue";
            }

          }
          else if(isGuesthere){
            leftBtn1.style.display = "none";
            rightBtn.style.display = "none";
          }
          else{
            if(data.closed){
              leftBtn1.style.display="none";
              rightBtn.innerHTML = "Interviewer is not taking any more Walk-In at this moment";
              rightBtn.style.backgroundColor = "#ff3b4e";
              rightBtn.style.color = "#ffffff";
            }
            else if(!isGuesthere){
              queueBtns.style.display="none";
              queueBtns2.style.display="flex";
              const rightBtn2 = document.getElementById('right-btn2');
              rightBtn2.style.cursor = 'pointer';
              rightBtn2.addEventListener('click',(event)=>{
                event.stopImmediatePropagation();
                joinBtnGuest.click();
              });
            }
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



  joinBtn.addEventListener("click", (event) => {
    event.stopImmediatePropagation();
    hmsActions.join({
      userName: document.getElementById("name").value,
      // authToken: host_key,
      authToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTEiLCJyb2xlIjoiaG9zdCIsImp0aSI6IjQ1ZDUxMmQ4LTNjNzItNGYyYy1hY2Y2LTQzMTU2ZWU4Mzg0ZiIsImV4cCI6MTY2NTg0ODU3MiwiaWF0IjoxNjY1NzYyMTcyLCJuYmYiOjE2NjU3NjIxNzJ9.3P6oeA4RavSjKpfh1Y4sPHNGkx0obUr5EhO8Nvw7nIg",
      settings: {
        isAudioMuted: true,
        isVideoMuted: false
      },
      rememberDeviceSelection: true,
    });
    const role = hmsStore.getState(selectLocalPeerRole);
    console.log(role)
    isHostHere = true;
    peersContainer.style.display = "none";
    cameraScreenStart.style.display = "flex";
    // cameraScreenStart.append(hostControls);
    setTimeout(() => {
      cameraScreenStart.style.display = "none";
      peersContainer.style.display = "block";
      hmsStore.subscribe(renderPeers, selectPeers);
      // webSocketClient.send('/startRecording');
    }, 5000);


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
  joinBtnGuest.addEventListener('click', async (event) => {
    event.stopImmediatePropagation();
    username = document.getElementById("name").value;
    feedback_check_username = username;
    // const response = await fetch('http://127.0.0.1:5000/enqueue',{
    //   mode:'cors',
    //   method:'POST',
    //   headers: { "Content-Type": "application/json"},
    //   body: JSON.stringify({'user':username})
    // });
    webSocketClient.send(username);
    inQueue = true;

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


      console.log('Data.front: ', data.front);
      if (data && username == data.front) {
        hmsActions.leave();
        feedback_check_username = username
        username = '<none>';
        inQueue = false;
        // if(mssg_response['next']==null)
        //   webSocketClient.send('pop');
        webSocketClient.send(`<feedback>/${feedback_check_username}`);

      }
      else {

        if(isBreak){
          hmsActions.leave();
          // webSocketClient.send('/stopRecording');
          try {
            media_recorder.stop();
          } catch (error) {
            console.log(error);
          }
        }

        else{
          screenOverlay = true;
          peersContainer.style.display = "none";
          closeAlert1.style.display = "flex";
          const leaveYes = document.getElementById('close-yes');
          const leaveNo = document.getElementById('close-no');
          leaveYes.addEventListener('click',(event)=>{
            event.stopImmediatePropagation();
            hmsActions.leave();
            // webSocketClient.send('/stopRecording');
            try {
              media_recorder.stop();
            } catch (error) {
              console.log(error);
            }
            closeAlert1.style.display = "none";
            closeAlert2.style.display = "flex";
            const roomOpen = document.getElementById('room-open');
            roomOpen.addEventListener('click',(event)=>{
              event.stopImmediatePropagation();
              closeAlert2.style.display = "none";
                  peersContainer.style.display = "none";
                  joinBtn.click();
                  setTimeout(()=>{
                    screenOverlay = false;
                  },1000);
                  // screenOverlay = false;
            });
  
  
          });

          leaveNo.addEventListener('click',(event)=>{
            event.stopImmediatePropagation();
            closeAlert1.style.display = "none";
            screenOverlay = false;
            peersContainer.style.display = "block";
          });


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
      leaveRoom();
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
    // const call = document.getElementById('call');
    const cam = document.getElementById('video');
    const chat = document.getElementById('chat');

    if (mic.getAttribute('listener') !== 'true') {
      mic.addEventListener('click', (event) => {
        event.stopImmediatePropagation();
        const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
        hmsActions.setLocalAudioEnabled(audioEnabled);
        console.log('Audio: ', audioEnabled);
        const mic_img = document.getElementById('mic-img');
        mic_img.src = audioEnabled?"img/mic.png":"img/mic_red.png";
        // mic.style.backgroundColor = audioEnabled ? "#fafafb" : "#ff3459";
        mic.setAttribute('listener', 'true');
      });
    }

    if (cam.getAttribute('listener') !== 'true') {
      cam.addEventListener('click', (event) => {
        event.stopImmediatePropagation();
        const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
        hmsActions.setLocalVideoEnabled(videoEnabled);
        const cam_img = document.getElementById('cam-img');
        cam_img.src = videoEnabled?"img/cam.png":"img/cam_red.png";
        // cam.style.backgroundColor = videoEnabled ? "#fafafb" : "#ff3459";
        // var color = cam.style.backgroundColor;
        // if(color=="#fafafb")
        //   cam.style.backgroundColor="#ff3459";
        // else if(color=="#ff3459")
        //   cam.style.backgroundColor="#fafafb";
        cam.setAttribute('listener', 'true');
        renderPeers();
      });
    }

    // if (call.getAttribute('listener') !== 'true') {
    //   call.addEventListener('click', (event) => {
    //     event.stopImmediatePropagation();
    //     call.setAttribute('listener', 'true');
    //     leaveRoom();
    //   });
    // }

    // if (chat.getAttribute('listener') !== 'true') {
    //   chat.addEventListener('click', () => {
    //     screenOverlay = true;
    //     console.log("Chat key pressed!");
    //     cam.click()
    //     mic.click();
    //     peersContainer.style.display = "none";
    //     announcementScreen.style.display = "flex";

    //     document.getElementById('announce').addEventListener('click', () => {
    //       var mssg = document.getElementById('announcement');
    //       console.log(mssg.value);
    //       webSocketClient.send('broadcast/' + mssg.value);
    //       peersContainer.style.display = "none";
    //       announcementScreen.style.display = "none";
    //       announcementReview.style.display = "flex";
    //       document.getElementById('mssg-text').innerHTML = mssg.value;
    //       // peersContainer.style.display = "none";
    //       document.getElementById('announce-ok').addEventListener('click', () => {
    //         announcementReview.style.display = "none";
    //         peersContainer.style.display = "block";
    //         screenOverlay = false;
    //         cam.click()
    //         mic.click();

    //       });
    //       // mssg.value="";
    //     });
    //   });
    // }

  }

  var coffeeBreak = false;



  var temp = 0
  var guests = 0;
  var readyToGoIn = false;
  var enterInCall = false;
  var ele = undefined;



  const controlContainer = h(
    "div",
    {
      class: "controls",
      style: "border-radius:min(20px,1.5vw);position: absolute;top:86%;left:3%;display: flex;flex-direction: row;justify-content: center;background-color:#ffffff;width: 20%;height: 10%;z-index: 0;"
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
        style: "margin:auto;display: flex;background:none;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
      },
      h(
        "img",
        {
          id:"mic-img",
          src: "img/mic_red.png",
          style: "margin:auto;width:50%;"
        }
      )
    ),
    // h(
    //   "div",
    //   {
    //     id: "call",
    //     listener: 'false',
    //     style: "margin:auto;display: flex;background-color: #4C67F4;height: 100%;aspect-ratio:1;z-index: 0;border-radius:23px;"
    //   },
    //   h(
    //     "img",
    //     {
    //       src: "img/receiver.png",
    //       style: "margin:auto;width:50%;"
    //     }
    //   )
    // ),
    h(
      "div",
      {
        id: "video",
        listener: 'false',
        style: "margin:auto;display: flex;background:none;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
      },
      h(
        "img",
        {
          id:'cam-img',
          src: "img/cam.png",
          style: "margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id: "chat-1",
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
        authToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTIiLCJyb2xlIjoiZ3Vlc3QiLCJqdGkiOiI2NmQ2NzQ1Yi03MjU5LTQwNWMtOTdlMy1iNjkyMTU1ODc2N2EiLCJleHAiOjE2NjU4NDg1NzIsImlhdCI6MTY2NTc2MjE3MiwibmJmIjoxNjY1NzYyMTcyfQ.9HZ1T13WCosMIDQdF6IFjtJcW-GuKJqIn2oG89S4svs',
        settings: {
          isAudioMuted: true,
          isVideoMuted: false
        },
        rememberDeviceSelection: false,
      });
      isGuesthere = true;
      mssg = undefined;
      console.log('joined in as Guest also!!!');
    }

    peersContainer.innerHTML = "";
    // queueContainer.innerHTML = "";


    if (!peers) {
      // this allows us to make peer list an optional argument
      peers = hmsStore.getState(selectPeers);
    }


    // var video='';



    const guestContainer = h(
      "div",
      {
        class: "guestContainer",
      }
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
          "p",
          {
            style:"margin:auto;"
          },
          "Evict"
        ),
        h(
          "div",
          {
            id:"remove-person-hover",
            style:"position:absolute;top:5%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ff3459;color:#ffffff;width:110%;aspect-ratio:5;"
          },
          "Remove from the room"
        )
        // h(
        //   "img",
        //   {
        //     src: "img/out.png",
        //     style: "margin:auto;width:50%;"
        //   }
        // )
      ),
      h(
        "div",
        {
          id: "add-person",
          // style:"background-color: #4C67F4;"
        },
        h(
          "p",
          {
            style:"margin:auto;"
          },
          "Next"
        ),
        h(
          "div",
          {
            id:"add-person-hover",
            style:"position:absolute;top:20%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
          },
          "Ask next to enter"
        )
        // h(
        //   "img",
        //   {
        //     src: "img/person.png",
        //     style: "margin:auto;width:50%;"
        //   }
        // )
      ),
      h(
        "div",
        {
          id: "q-close",
          // style:"background-color:"+( queueOpen?"#4C67F4;":"#ff3459;")
        },
        h(
          "p",
          {
            id:"q-close-para",
            style:"margin:auto;"
          },
          queueOpen?"Halt":"Allow"
        ),
        h(
          "div",
          {
            id:"pause-person-hover",
            style:"position:absolute;top:35%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
          },
          "Stop more candidates to join"
        )
        // h(
        //   "img",
        //   {
        //     src: "img/Q.png",
        //     style: "margin:auto;width:50%;"
        //   }
        // )
      ),
      h(
        "div",
        {
          id: "chat",
          // style:"background-color: #4C67F4;"
        },
        h(
          "img",
          {
            src: "img/chat.png",
            style: "margin:auto;width:50%;"
          }
        ),
        h(
          "div",
          {
            id:"announce-person-hover",
            style:"position:absolute;top:50%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
          },
          "Announce a message to everyone"
        )
      ),
      h(
        "div",
        {
          id: "coffee-break",
          // style:"background-color: #4C67F4;"
        },
        h(
          "img",
          {
            src: "img/coffee.png",
            style: "margin:auto;width:50%;"
          }
        ),
        h(
          "div",
          {
            id:"break-person-hover",
            style:"position:absolute;top:65%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
          },
          "Go for a break"
        )
      ),
      h(
        "div",
        {
          id: "call",
          // style:"background-color: #4C67F4;"
        },
        h(
          "p",
          {
            style:"margin:auto;"
          },
          "Stop"
        ),
        h(
          "div",
          {
            id:"call-person-hover",
            style:"position:absolute;top:80%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
          },
          "Close the room"
        )
        // h(
        //   "img",
        //   {
        //     src: "img/chat.png",
        //     style: "margin:auto;width:50%;"
        //   }
        // )
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

          var removePersonBtn = document.getElementById('remove-person')
          removePersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('remove-person-hover').style.display = "block";
          });
          removePersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('remove-person-hover').style.display = "none";
          });

          var addPersonBtn = document.getElementById('add-person')
          addPersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('add-person-hover').style.display = "block";
          });
          addPersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('add-person-hover').style.display = "none";
          });

          var pausePersonBtn = document.getElementById('q-close')
          pausePersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('pause-person-hover').style.display = "block";
          });
          pausePersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('pause-person-hover').style.display = "none";
          });

          var announcePersonBtn = document.getElementById('chat')
          announcePersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('announce-person-hover').style.display = "block";
          });
          announcePersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('announce-person-hover').style.display = "none";
          });

          var breakPersonBtn = document.getElementById('coffee-break')
          breakPersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('break-person-hover').style.display = "block";
          });
          breakPersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('break-person-hover').style.display = "none";
          });

          var closePersonBtn = document.getElementById('call')
          closePersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('call-person-hover').style.display = "block";
          });
          closePersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('call-person-hover').style.display = "none";
          });

          document.getElementById('remove-person').addEventListener('click', (event) => {
            event.stopImmediatePropagation();

            console.log('Evict btn clicked again');
            
            if(!tooltipActive){
              console.log("Yahan bhi aa gaya!");
              tooltipActive = true;
              var remPer = document.getElementById('remove-person');
              remPer.setAttribute("disabled", false);
              var removetooltip = h(
                "div",
                {
                  class:"tooltip",
                  id:"removetooltip",
                  style:"width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                },
                h(
                  "div",
                  {
                    id:"close-tip",
                    style:"position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:500;cursor:pointer;"
                  },
                  "x"
                ),
                h(
                  "div",
                  {
                    id:"remove-tip",
                  },
                  h(
                    "p",
                    {
                      style:"font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                    },
                    "Are you sure you want to evict the candidate from the room?"
                  ),
                  h(
                    "p",
                    {
                      style:"font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:500;padding:min(10px,1vw);"
                    },
                    h(
                      "span",
                      {
                        id:"remove-yes"
                      },
                      "Yes"
                    ),
                    h(
                      "span",
                      {
                        style:"font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:500;padding:min(10px,1vw);"
                      },
                      " | "
                    ),
                    h(
                      "span",
                      {
                        id:"remove-no"
                      },
                      "No"
                    )
                  )
                )
              );
              peerContainer.append(removetooltip);
    
              const closeTip = document.getElementById('close-tip');
              closeTip.addEventListener('click',(event)=>{
                event.stopImmediatePropagation();
                const currentTip = document.getElementById('removetooltip');
                peerContainer.removeChild(currentTip);
                tooltipActive = false;
              });
  
              const removeYes = document.getElementById('remove-yes');
              removeYes.addEventListener('click',async (event)=>{
                event.stopImmediatePropagation();
                await hmsActions.removePeer(ele.id, '');
                webSocketClient.send(`<feedback>/${ele.name}`);  
                tooltipActive = false;


                screenOverlay = true;
                console.log("Screen Overlay: ",screenOverlay);
                peersContainer.style.display = "none";
                // peersContainer.innerHTML = "";
                reviewPage1.style.display = "flex";
                var nextButton = document.getElementById('review-next');
                nextButton.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  reviewPage1.style.display = "none";
                  reviewPage2.style.display = "flex";
                  var submitFeed = document.getElementById('review-submit');
                  submitFeed.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    reviewPage2.style.display = "none";
                    screenOverlay = false;
                    console.log("Screen Overlay: ",screenOverlay);
                    peersContainer.style.display = "block";
                    // peersContainer.append(peerContainer);
                    // webSocketClient.send('pop');
                    console.log("Yahan tak aa gaya!!");
                    hmsStore.subscribe(renderPeers, selectPeers);
                  });
                });


              });
  
              const removeNo = document.getElementById('remove-no');
              removeNo.addEventListener('click',(event)=>{
                event.stopImmediatePropagation();
                const currentTip = document.getElementById('removetooltip');
                peerContainer.removeChild(currentTip);
                tooltipActive = false;
              });
            }


            // webSocketClient.send(`remove/${ele.name}`);
            // webSocketClient.send('pop');
          });

          document.getElementById('q-close').addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            if (queueOpen) {
              webSocketClient.send('/closeQueue');
              document.getElementById('q-close-para').innerText = "Allow";
              queueOpen = false;
            }
            else {
              webSocketClient.send('/openQueue');
              document.getElementById('q-close-para').innerText = "Halt";
              queueOpen = true;
            }

          });


          document.getElementById('chat').addEventListener('click', (event) => {
            // document.getElementById('chat').setAttribute('disabled',true);
            event.stopImmediatePropagation();
            screenOverlay = true;
            console.log("Chat key pressed!");
            // cam.click()
            // mic.click();
            peersContainer.style.display = "none";
            announcementScreen.style.display = "flex";
    
            document.getElementById('announce').addEventListener('click', (event) => {
              event.stopImmediatePropagation();
              var mssg = document.getElementById('announcement');
              console.log(mssg.value);
              webSocketClient.send('broadcast/' + mssg.value);
              peersContainer.style.display = "none";
              announcementScreen.style.display = "none";
              announcementReview.style.display = "flex";
              document.getElementById('mssg-text').innerHTML = mssg.value;
              // peersContainer.style.display = "none";
              document.getElementById('announce-ok').addEventListener('click', (event) => {
                event.stopImmediatePropagation();
                announcementReview.style.display = "none";
                peersContainer.style.display = "block";
                screenOverlay = false;
                // cam.click()
                // mic.click();
    
              });
              // mssg.value="";
            });
          });

          document.getElementById('call').addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            call.setAttribute('listener', 'true');
            leaveRoom();
          });


          document.getElementById('add-person').addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            var addPer = document.getElementById('add-person');
            addPer.setAttribute('disabled', true);
            // webSocketClient.send('pop');
          });

          document.getElementById('coffee-break').addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            document.getElementById('coffee-break').setAttribute('disabled',true);
            // screenOverlay = true;
            // peersContainer.style.display = "none";
            // coffee1.style.display = "flex";
            // const timesetBtn = document.getElementById('timeset');
            // const plus5Btn = document.getElementById('plus5');
            // const minus5Btn = document.getElementById('minus5');
            // var currentVal = 10;
            // plus5Btn.addEventListener('click',(event)=>{
            //   event.stopImmediatePropagation();
            //   currentVal = parseInt(timesetBtn.innerText);
            //   if(currentVal<=55)
            //   {
            //     timesetBtn.innerText = currentVal + 5;
            //     currentVal+=5;
            //   }
            // });

            // minus5Btn.addEventListener('click',(event)=>{
            //   event.stopImmediatePropagation();
            //   currentVal = parseInt(timesetBtn.innerText);
            //   if(currentVal>=15){
            //     timesetBtn.innerText = currentVal - 5;
            //     currentVal-=5;
            //   }
            // });

            // const takeBreak = document.getElementById('take-break')
            // takeBreak.addEventListener('click',(event)=>{
            //   event.stopImmediatePropagation();
            //   webSocketClient.send('/coffeeBreak');
            //   coffee1.style.display = "none";
            //   coffee2.style.display = "flex";
            //   var countdown = document.getElementById('countdown');
            //   countdown.innerText = currentVal;

            // });

            // if (!coffeeBreak) {
            //   coffeeBreak = true;
            //   webSocketClient.send('/coffeeBreak');
              
            // }
            // else {
            //   coffeeBreak = false;
            //   webSocketClient.send('/breakOver');
            //   coffeeCont.style.display = "none";
            // }
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

      else if (isHostHere && !screenOverlay) {
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

        var removePersonBtn = document.getElementById('remove-person')
        removePersonBtn.addEventListener('mouseenter',()=>{
          document.getElementById('remove-person-hover').style.display = "block";
        });
        removePersonBtn.addEventListener('mouseleave',()=>{
          document.getElementById('remove-person-hover').style.display = "none";
        });

        var addPersonBtn = document.getElementById('add-person')
          addPersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('add-person-hover').style.display = "block";
          });
          addPersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('add-person-hover').style.display = "none";
          });

          var pausePersonBtn = document.getElementById('q-close')
          pausePersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('pause-person-hover').style.display = "block";
          });
          pausePersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('pause-person-hover').style.display = "none";
          });

          var announcePersonBtn = document.getElementById('chat')
          announcePersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('announce-person-hover').style.display = "block";
          });
          announcePersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('announce-person-hover').style.display = "none";
          });

          var breakPersonBtn = document.getElementById('coffee-break')
          breakPersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('break-person-hover').style.display = "block";
          });
          breakPersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('break-person-hover').style.display = "none";
          });

          var closePersonBtn = document.getElementById('call')
          closePersonBtn.addEventListener('mouseover',()=>{
            document.getElementById('call-person-hover').style.display = "block";
          });
          closePersonBtn.addEventListener('mouseleave',()=>{
            document.getElementById('call-person-hover').style.display = "none";
          });

        document.getElementById('remove-person').addEventListener('click', async (event) => {
          event.stopImmediatePropagation();
          console.log('Evict btn pressed!');
          if(!tooltipActive){
            console.log("Yahan bhi aa gaya!");
            tooltipActive = true;
            var remPer = document.getElementById('remove-person');
            remPer.setAttribute("disabled", true);
  
            var removetooltip = h(
              "div",
              {
                class:"tooltip",
                id:"removetooltip",
                style:"width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
              },
              h(
                "div",
                {
                  id:"close-tip",
                  style:"position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:500;cursor:pointer;"
                },
                "x"
              ),
              h(
                "div",
                {
                  id:"remove-tip",
                  style:"font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                },
                "No one is in the room. You can can use this feature to remove the candidate from the interview room"
              )
            );
            peerContainer.append(removetooltip);
  
            const closeTip = document.getElementById('close-tip');
            closeTip.addEventListener('click',(event)=>{
              event.stopImmediatePropagation();
              console.log("Close Tip Pressed!");
              const currentTip = document.getElementById('removetooltip');
              peerContainer.removeChild(currentTip);
              tooltipActive = false;
            });
          }
          // await hmsActions.removePeer(ele.id, '');
          // // webSocketClient.send('pop');
          // webSocketClient.send(`remove/${ele.name}`);

        });

        document.getElementById('q-close').addEventListener('click', (event) => {
          event.stopImmediatePropagation();
          if (queueOpen) {
            webSocketClient.send('/closeQueue');
            document.getElementById('q-close-para').innerText = "Allow";
            queueOpen = false;
          }
          else {
            webSocketClient.send('/openQueue');
            document.getElementById('q-close-para').innerText = "Halt";
            queueOpen = true;
          }

        });

        var addPer = document.getElementById('add-person');
        addPer.setAttribute('disabled', false);
        addPer.addEventListener('click', (event) => {
          event.stopImmediatePropagation();
          webSocketClient.send('pop');

          // screenOverlay = true
          //       peersContainer.style.display = "none";
          //       reviewPage1.style.display = "flex";
          //       var nextButton = document.getElementById('review-next');
          //       nextButton.addEventListener('click', (event) => {
          //         event.stopImmediatePropagation();
          //         reviewPage1.style.display = "none";
          //         reviewPage2.style.display = "flex";
          //         var submitFeed = document.getElementById('review-submit');
          //         submitFeed.addEventListener('click', (event) => {
          //           event.stopImmediatePropagation();
          //           reviewPage2.style.display = "none";
          //           screenOverlay = false;
          //           peersContainer.style.display = "block";
          //           webSocketClient.send('pop');
          //         });
          //       });
          
        });

        document.getElementById('chat').addEventListener('click', (event) => {
          event.stopImmediatePropagation();
          screenOverlay = true;
          console.log("Chat key pressed!");
          // cam.click()
          // mic.click();
          peersContainer.style.display = "none";
          announcementScreen.style.display = "flex";
  
          document.getElementById('announce').addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            var mssg = document.getElementById('announcement');
            console.log(mssg.value);
            webSocketClient.send('broadcast/' + mssg.value);
            peersContainer.style.display = "none";
            announcementScreen.style.display = "none";
            announcementReview.style.display = "flex";
            document.getElementById('mssg-text').innerHTML = mssg.value;
            // peersContainer.style.display = "none";
            document.getElementById('announce-ok').addEventListener('click', () => {
              announcementReview.style.display = "none";
              peersContainer.style.display = "block";
              screenOverlay = false;
              // cam.click()
              // mic.click();
  
            });
            // mssg.value="";
          });
        });

        document.getElementById('call').addEventListener('click', (event) => {
          event.stopImmediatePropagation();
          call.setAttribute('listener', 'true');
          leaveRoom();
        });

        document.getElementById('coffee-break').addEventListener('click', (event) => {
          event.stopImmediatePropagation();
          document.getElementById('coffee-break').setAttribute('disabled',false);
          screenOverlay = true;
          readyToOpenRoom = false;
            peersContainer.style.display = "none";
            coffee1.style.display = "flex";
            const timesetBtn = document.getElementById('timeset');
            const plus5Btn = document.getElementById('plus5');
            const minus5Btn = document.getElementById('minus5');
            var currentVal = 10;
            plus5Btn.addEventListener('click',(event)=>{
              event.stopImmediatePropagation();
              currentVal = parseInt(timesetBtn.innerText);
              if(currentVal<=55)
              {
                timesetBtn.innerText = currentVal + 5;
                currentVal+=5;
              }
            });

            minus5Btn.addEventListener('click',(event)=>{
              event.stopImmediatePropagation();
              currentVal = parseInt(timesetBtn.innerText);
              if(currentVal>=15){
                timesetBtn.innerText = currentVal - 5;
                currentVal-=5;
              }
            });


            const takeBreak = document.getElementById('take-break')
            takeBreak.addEventListener('click',(event)=>{
              event.stopImmediatePropagation();
              webSocketClient.send(`/coffeeBreak/${currentVal}`);
              coffee1.style.display = "none";
              coffee2.style.display = "flex";
              var countdown = document.getElementById('countdown');
              var timeInSeconds = currentVal*60;
              (async function timer(){
                if(timeInSeconds>0&&!readyToOpenRoom){
                  setTimeout(()=>{
                    var minutes = Math.floor(timeInSeconds/60);
                    var seconds = timeInSeconds%60;
                    if(seconds>=10)
                      countdown.innerText = `${minutes}:${seconds}`;
                    else
                      countdown.innerText = `${minutes}:0${seconds}`;
                    timeInSeconds--;
                    timer();
                  },1000);
                }
                else{
                  console.log("Timer over!");
                  // currentVal = 0;
                  // timeInSeconds = 0;
                  readyToOpenRoom = false;
                  countdown.innerText = "";
                }
              })();
              isBreak = true;
              leaveRoom();
              var openRoom = document.getElementById('open-room');
              openRoom.addEventListener('click',(event)=>{
                event.stopImmediatePropagation();
                readyToOpenRoom = true;
                countdown.innerText = "";
                // currentVal = 0;
                  // timeInSeconds = 0;
                coffee2.style.display = "none";
                peersContainer.style.display = "none";
                webSocketClient.send('/breakOver');
                isBreak = false;
                joinBtn.click();
                setTimeout(()=>{
                  screenOverlay = false;
                },1000);
              });

            });
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
