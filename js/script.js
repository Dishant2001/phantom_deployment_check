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
  const roomName = document.getElementById('room-name');
  
  
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
  
  var roomSelect;
  
  var allowInitialQueueFront = false;
  
  var queueOpen = true;
  var screenOverlay = false;
  
  var isBreak = false;
  
  var tooltipActive = false;
  var readyToOpenRoom = false;
  var recentBreak = false;

  var roomId = null;
  
  
  
  
//   const webSocketClient = new WebSocket("wss://3.137.162.168:5000");
  // const webSocketClient = new WebSocket("ws://localhost:5000");
  
//   webSocketClient.onclose = function () {
//     console.log("Connection closed!");
//   }
  
//   webSocketClient.onopen = function () {
    console.log("Connected to server!");
    // const data={'mssg':'hello!'};
    // webSocketClient.send(JSON.stringify(data));
  
    var data;
    var username = '<none>';
    var feedback_check_username = "<none>";
    var queue;
    var count = 1, nextcount = 1, inQueue = false;
  
    var mssg = null;
  
    var hostKey = undefined;
    var base64String = null;
    var duration = null;
  
  // async function apiCall(){
  //     const response = await fetch("http://localhost/phantom/api/roomDetail",{
  //             method:'POST',
  //             headers: { "Content-Type": "application/json"},
  //             body: JSON.stringify({'roomId':"63554fcee08863a3f2f9a34a"}),
  //         });
  //         console.log(response);
  //         const data = await response.text();
  //         console.log(data);
  // }

  // apiCall();


    (async function polling(){
        if(roomId!=null){
          const response  = await fetch('http://localhost/phantom/api/roomDetail',{
            method:'post',
            headers: { "Content-Type": "application/json",'Accept': 'application/json'},
            body: JSON.stringify({'roomId':roomId,'blobData':base64String,'breakDuration':duration}),
          });
          const mssg_response = await response.json();
          console.log(mssg_response);

          
  
      // if(!isHostHere&&mssg_response.hasOwnProperty('guestToken')){
      //   console.log("Entered in Guest Join message box");
      //   var guestToken = mssg_response['guestToken'];
      //   joinAsGuest(guestToken);
      // }
  
      if(mssg_response.hasOwnProperty('auth')){
        if(mssg_response['auth']){
          console.log(mssg_response['room_tokens']);
          hostKey = mssg_response['room_tokens'][roomSelect]["host_key"];
          joinAsHost(hostKey);
          console.log("Joining again!");
        }
        else{
          alert("Wrong Key!");
        }
      }
  
      else{
  
        if ((mssg_response['queueFront'] != null || mssg_response['queueFront'] != undefined) && checkTurn == 1) {
          console.log("Someone is giving interview or had his interview done");
          someoneInQueue = true;
          checkTurn = 2;
        }
    
        if (!isHostHere && mssg_response['feedback'] == feedback_check_username) {
          screenOverlay = true;
          feedback_check_username = "<none>";
          username = "<none>";
          peersContainer.style.display = "none";
          feedbackCont.style.display = "flex";
          const submitFeedbackBtn = document.getElementById('submit-feedback');
          submitFeedbackBtn.addEventListener('click', async(event) => {
            event.stopImmediatePropagation();
            var feedbackCont2 = document.getElementById('candidate-feedback-2');
            feedbackCont.style.display = "none";
            feedbackCont2.style.display = "flex";
            const response  = await fetch('http://localhost/phantom/api/feedback',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId,'candidate':null}),
                  });
          });
        }
    
        // if (mssg_response['closed'] && !mssg_response['queue'].includes(username) && !isHostHere) {
        //   console.log("Queue has been closed! Sorry!");
        //   // queueClosedMssg.style.display = "block";
        //   // peersContainer.style.display = "none";
        //   queueBtns.style.display="none";
        //           queueBtns2.style.display="flex";
        // }
    
        if (true) {
    
          queueClosedMssg.style.display = "none";
          if (!screenOverlay)
            peersContainer.style.display = "block";
    
          if (!mssg_response['breakStatus'] && recentBreak) {
            // peersContainer.style.display = "block";
            screenOverlay = false;
            breakNotice.style.display = "none";
            recentBreak = false;
          }
    
          if (mssg_response['breakStatus'] && !isHostHere) {
            peersContainer.style.display = "none";
            screenOverlay = true;
            breakNotice.style.display = "flex";
            if(duration==null){
              duration = mssg_response['breakDuration'];
              recentBreak = true;
            }
    
            const timeRemaining = document.getElementById('time-remaining');
            var timeInSeconds = duration * 60;
            (async function timer() {
              if (timeInSeconds > 0) {
                setTimeout(() => {
                  var minutes = Math.floor(timeInSeconds / 60);
                  var seconds = timeInSeconds % 60;
                  if (seconds >= 10)
                    timeRemaining.innerText = `${minutes}:${seconds}`;
                  else
                    timeRemaining.innerText = `${minutes}:0${seconds}`;
                  timeInSeconds--;
                  duration = timeInSeconds/60;
                  timer();
                }, 1000);
              }
              else {
                console.log("Timer over!");
                // currentVal = 0;
                // timeInSeconds = 0;
                // readyToOpenRoom = false;
                timeRemaining.innerText = "";
              }
            })();
    
          }
    
          else if (mssg==null && mssg_response['broadcastMssg'] != 'message' && !isGuesthere && !isHostHere) {
            console.log(mssg_response['broadcastMssg']);
            mssg = mssg_response['broadcastMssg'];
    
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
    
    
    
            // if(mssg_response.hasOwnProperty('videoBlob')){
            //   // const reader = new FileReader();
    
            //   // var arrayBuff = reader.readAsArrayBuffer(mssg_response['videoBlob']);
            //   var byteCharacters = mssg_response['videoBlob']; 
            //   console.log('Base64 string received: ',byteCharacters);
            //   // var byteCharacters = atob(vidBlob);
    
            //   // const byteNumbers = new Array(byteCharacters.length);
            //   // for (let i = 0; i < byteCharacters.length; i++) {
            //   //     byteNumbers[i] = byteCharacters.charCodeAt(i);
            //   // }
    
            //   // const byteArray = new Uint8Array(byteNumbers);
    
            //   // const blob = new Blob([byteArray], {type: 'video/webm'});
    
            //   // // var myReceivedBlob = new Blob(vidBlob, { type: 'video/webm' })
            //   // console.log("Video Blob: ",blob); 
    
            // }
    
            // var recData = mssg_response['blobData'];
            var b64 = mssg_response['blobData'];
            var recData = '';
    
            if(b64!=''&&b64!=null){
              const byteCharacters = atob(b64.replace(/^data:video\/(webm|mp4|mpeg);base64,/, ''));
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], {type: 'video/webm'});
              recData = URL.createObjectURL(blob);
            }
    
            // (async function recordStream() {
            //   if (byteCharacters != '') {
            //     // console.log("Byte Data: ",byteCharacters);
    
            //     const base64Response = await fetch(`${byteCharacters}`);
            //     const blob = await base64Response.blob();
    
            //     var recData = URL.createObjectURL(blob);
            //     console.log("Received video: ", blob);
            //     if (!isHostHere && !isGuesthere) {
            //       peersContainer.innerHTML = "";
    
            //       var mssgCont = h(
            //         "div",
            //         {
            //           id: "announcement-mssg",
            //           style: "background-color:#F1F4FB;display: flex;padding: min(15px,1.5vw);z-index: 200;flex-direction: row;justify-content: space-evenly;border-radius: 20px;width: 50%;aspect-ratio: 20/3;margin: auto;margin-top: -20%;font-family: 'Manrope', sans-serif;font-style: normal;font-weight: 500;text-align: center;font-size: min(15px,1.5vw);"
            //         },
            //         h(
            //           "div",
            //           {
            //             id: "mssg-img"
            //           },
            //           h(
            //             "img",
            //             {
            //               src: "img/hand.png"
            //             },
            //             ""
            //           ),
            //         ),
            //         h(
            //           "div",
            //           {
            //             id: "mssg-mssg"
            //           },
            //           mssg
            //         )
            //       );
    
            //       var video_rec = h(
            //         "video",
            //         {
            //           style: "width:100%;aspect-ratio:16/9;border-radius:24px;",
            //           src: recData,
            //           autoplay: true,
            //           muted: true,
            //           playsinline: true,
            //         }
            //       );
            //       // recVideo.src=recData['blobData'];
            //       peersContainer.append(video_rec);
            //       if (mssg != undefined)
            //         peersContainer.append(mssgCont);
            //     }
            //   }
            // })();
    
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
            console.log(`Username:${username}  Queue Front:${data.queueFront}`);
            if (data && data.queueFront!=null && data.queueFront['name'] == username) {
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
            if (data && data.nextInQueue!=null && data.nextInQueue['name'] == username) {
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
    
                if(queue[i]['name']!='<start>'){
    
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
                      ith_guest['name'][0].toUpperCase()
                    )
                  );
      
                  queueContainer.append(queueEle);
                }
    
              }
            }
    
    
            if (!isHostHere) {
              queueBtns.style.display = "flex";
              queueBtns2.style.display = "none";
              const leftBtn1 = document.getElementById('left-btn1');
              const leftBtn2 = document.getElementById('left-btn2');
              const rightBtn = document.getElementById('right-btn');
              rightBtn.style.backgroundColor = "#4c67f4";
              rightBtn.style.color = "#ffffff";
              if (inQueue && !isGuesthere) {
                leftBtn2.style.display = "none";
                leftBtn1.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  screenOverlay = true;
                  peersContainer.style.display = "none";
                  leaveQ.style.display = "flex";
                  var yesBtn = document.getElementById('leave-yes');
                  var noBtn = document.getElementById('leave-no');
                  yesBtn.addEventListener('click', async(event) => {
                    event.stopImmediatePropagation();
                    // var index = data.queue.indexOf(username);
                    var index = null;
                    for(index=0;index<data.queue.length;++index){
                      if(data.queue[index]['name']==username)
                        break;
                    }
                    // webSocketClient.send(`<leave>/${index}/${roomSelect}`);
                    const resp = await fetch('http://localhost/phantom/api/leave',{
                      method:'post',
                      headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                      body: JSON.stringify({'roomId':roomId,'leave':index}),
                    });
                    inQueue = false;
                    username = "<none>";
                    leaveQ.style.display = "none";
                    peersContainer.style.display = "block";
                  });
                  noBtn.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    leaveQ.style.display = "none";
                    peersContainer.style.display = "block";
                  });
    
                });
                if (data.nextInQueue && username == data.nextInQueue['name']) {
                  leftBtn1.style.display = "block";
                  rightBtn.innerHTML = "You are next. The room will open soon...";
                }
                else if (data.queue[2] && username == data.queue[2]['name']) {
                  leftBtn1.style.display = "block";
                  rightBtn.innerHTML = "You are 2<sup>nd</sup> in the Q now.";
                }
                else {
                  leftBtn1.style.display = "block";
                  rightBtn.innerHTML = "Please wait. You are in the queue";
                }
    
              }
              else if (isGuesthere) {
                leftBtn1.style.display = "none";
                rightBtn.style.display = "none";
              }
              else {
                if (data.closed) {
                  leftBtn1.style.display = "none";
                  rightBtn.innerHTML = "Interviewer is not taking any more Walk-In at this moment";
                  rightBtn.style.backgroundColor = "#ff3b4e";
                  rightBtn.style.color = "#ffffff";
                }
                else if (!isGuesthere) {
                  queueBtns.style.display = "none";
                  queueBtns2.style.display = "flex";
                  const rightBtn2 = document.getElementById('right-btn2');
                  rightBtn2.style.cursor = 'pointer';
                  rightBtn2.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    joinBtnGuest.click();
                  });
                }
              }
    
            }
    
    
          }
        }
      }


        }
        setTimeout(()=>{
            polling();
        },6000);

    })();
  
  
  
    var guests = {};
    var isHost = false;
    var host_key = '', guest_key = '', token = '', room_id = '6316e1c3b1e780e78c3d1dcf';
  
    startRoomBtn.addEventListener("click",async() => {
      const response = await fetch('http://localhost/phantom/api/rooms',{
        method:'POST',
        body:JSON.stringify({'roomId':"63554fcee08863a3f2f9a34a",
        "hostKey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzU1NGZjZWUwODg2M2EzZjJmOWEzNGEiLCJ1c2VyX2lkIjoidTEiLCJyb2xlIjoiaG9zdCIsImp0aSI6IjBlZTBlYjA4LWVmMTgtNGU0NC1hYmI4LWQxNjU2N2QxNzM2YSIsImV4cCI6MTY2Njg1MjA4NSwiaWF0IjoxNjY2NzY1Njg1LCJuYmYiOjE2NjY3NjU2ODV9.IbP-qB8I6k3TtJaBNJKhTZnNL64ntNWUjFXlZE15UKM",
        "guestKey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzU1NGZjZWUwODg2M2EzZjJmOWEzNGEiLCJ1c2VyX2lkIjoidTIiLCJyb2xlIjoiZ3Vlc3QiLCJqdGkiOiJlZWYyZWM3NS03MTEwLTQ2ZmUtYWU1MC0yMGNkMmRiNzIyZDQiLCJleHAiOjE2NjY4NTIwODUsImlhdCI6MTY2Njc2NTY4NSwibmJmIjoxNjY2NzY1Njg1fQ.O-ESHRQjSSgDgBQGta5979OWWY5Q1JJRORPCr9oMj8g",
        "hostName":"Dishant"
      }),
      });
      const data = await response.json();
      console.log(data);
      
    });
  
    // Joining the room
  
  
    function joinAsHost(token){
      // event.stopImmediatePropagation();
      hmsActions.join({
        userName: document.getElementById("name").value,
        // authToken: host_key,
        // authToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTEiLCJyb2xlIjoiaG9zdCIsImp0aSI6IjQ1ZDUxMmQ4LTNjNzItNGYyYy1hY2Y2LTQzMTU2ZWU4Mzg0ZiIsImV4cCI6MTY2NTg0ODU3MiwiaWF0IjoxNjY1NzYyMTcyLCJuYmYiOjE2NjU3NjIxNzJ9.3P6oeA4RavSjKpfh1Y4sPHNGkx0obUr5EhO8Nvw7nIg",
        authToken:token,
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
        // if(!allowInitialQueueFront){
        //   allowInitialQueueFront = true
        //   webSocketClient.send(JSON.stringify({ 'enqueue': "<start>","room":roomSelect }));
        // }
        // webSocketClient.send('/startRecording');
      }, 5000);
  
  
  
      (async function recordLoop() {
        var blobs_recorded = [];
        camera_stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1024, height: 576 } });
        media_recorder = new MediaRecorder(camera_stream, { mimeType: 'video/webm' });
        media_recorder.addEventListener('dataavailable', async function (e) {
          console.log("Recording: ", new Blob([e.data], { type: 'video/webm' }));
          blobs_recorded.push(e.data);
        });
        media_recorder.addEventListener('stop', async function () {
          let video_local = URL.createObjectURL(new Blob(blobs_recorded, { type: 'video/webm' }));
          console.log("video url: ", video_local);
          // recVideo.src=video_local;
          // webSocketClient.send(JSON.stringify({ 'blobData': video_local ,"room":roomSelect}));
          var myblob = new Blob(blobs_recorded, { type: 'video/webm' });
  
          var reader = new FileReader();
          reader.readAsDataURL(myblob);
          reader.onloadend = function () {
            base64String = reader.result;
            // console.log('Base64 String - ', base64String);
            // console.log("Blob data before sending: ",myblob);
            // webSocketClient.send(base64String);
  
          }
  
  
        });
        media_recorder.start();
        setTimeout(() => {
          media_recorder.stop();
          recordLoop();
        }, 5000);
      })();
    }
  
  
    joinBtn.addEventListener("click", (event) => {
      event.stopImmediatePropagation();
      console.log("Host button clicked");
      roomSelect = document.getElementById('room-name').value;
      const asHostCont = document.getElementById('as-host-key');
      asHostCont.style.display = "block";
      const hostName = document.getElementById('name').value;
  
      document.getElementById('host-join').addEventListener('click',async (event)=>{
        event.stopImmediatePropagation();
        roomId = document.getElementById('room-key').value;
        console.log(roomId,typeof(roomId));
        // webSocketClient.send(JSON.stringify({'cred':{'room':roomSelect,'key':key,'host':hostName}}));
        const response = await fetch("http://localhost/phantom/api/roomDetail",{
            method:'POST',
            headers: { "Content-Type": "application/json",'Accept': 'application/json'},
            body: JSON.stringify({'roomId':roomId}),
        });
        console.log(response);
        const data = await response.json();
        console.log(data);
        // const response = await fetch('http://localhost/phantom/api/allRooms');
        // const data = await response.json();
        // console.log(data);
        hostKey = data['hostKey'];
        console.log(hostKey);
        joinAsHost(hostKey);
      });
  
  
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
      if(username=="<none>"){
        username = document.getElementById("name").value;
        if(username!=''){
  
          feedback_check_username = username;
          // const response = await fetch('http://127.0.0.1:5000/enqueue',{
          //   mode:'cors',
          //   method:'POST',
          //   headers: { "Content-Type": "application/json"},
          //   body: JSON.stringify({'user':username})
          // });
    
          console.log("Guest button clicked");
          roomSelect = document.getElementById('room-name').value;
    
        // document.getElementById('host-join').addEventListener('click',(event)=>{
        //   event.stopImmediatePropagation();
        //   var key = document.getElementById('room-key').value;
        //   webSocketClient.send(JSON.stringify({'cred':{'room':roomSelect,'key':key}}));
        // });
    
          // webSocketClient.send(JSON.stringify({ 'enqueue': username,'room':roomSelect }));
          roomId = "63554fcee08863a3f2f9a34a";

          const response = await fetch('http://localhost/phantom/api/enqueue',{
            method:'post',
            headers: { "Content-Type": "application/json",'Accept': 'application/json'},
            body: JSON.stringify({'roomId':roomId,'candidate':username}),
          });
          const data = await response.json();
          console.log(data);

          inQueue = true;
        }
      }
      else{
        username = "<none>";
        alert("Enter name (only for testing purposes. Would be taken care in deployment by login credentials");
      }
  
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

    async function roomActiveStatus(){
      const response = await fetch('http://localhost/phantom/api/roomActive',{
                method:'post',
                headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                body: JSON.stringify({'roomId':roomId}),
              });
              const data = await response.json();
              console.log(data);
    }
  
    // Leaving the room
    function leaveRoom() {
      if (leave_count > 0) {
  
  
        // console.log('Data.front: ', data.front);
        if (data && username == data.front) {
          hmsActions.leave();
          feedback_check_username = username
          username = '<none>';
          inQueue = false;
          // if(mssg_response['next']==null)
          //   webSocketClient.send('pop');
          // webSocketClient.send(`<feedback>/${feedback_check_username}/${roomSelect}`);
  
        }
        else {
  
          if (isBreak) {
            hmsActions.leave();
            // webSocketClient.send('/stopRecording');
            try {
              media_recorder.stop();
            } catch (error) {
              console.log(error);
            }
          }
  
          else {
            screenOverlay = true;
            peersContainer.style.display = "none";
            closeAlert1.style.display = "flex";
            const leaveYes = document.getElementById('close-yes');
            const leaveNo = document.getElementById('close-no');
            leaveYes.addEventListener('click', async(event) => {
              event.stopImmediatePropagation();
              // webSocketClient.send(`roomActive/${roomSelect}`);
              await roomActiveStatus();
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
              roomOpen.addEventListener('click', async(event) => {
                event.stopImmediatePropagation();
                closeAlert2.style.display = "none";
                peersContainer.style.display = "none";
                // joinBtn.click();
                await roomActiveStatus();
                joinAsHost(hostKey);
                setTimeout(() => {
                  screenOverlay = false;
                }, 1000);
                // screenOverlay = false;
              });
  
  
            });
  
            leaveNo.addEventListener('click', (event) => {
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
    // window.onunload = window.onbeforeunload = () => {
    //   if (leave_count > 0)
    //     leaveRoom();
    // };
  
    window.addEventListener('beforeunload', function (e) {
      e.preventDefault();
      e.returnValue = '';
      if (leave_count > 0)
        leaveRoom();
  });
  
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
          mic_img.src = audioEnabled ? "img/mic.png" : "img/mic_red.png";
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
          cam_img.src = videoEnabled ? "img/cam.png" : "img/cam_red.png";
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
            id: "mic-img",
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
            id: 'cam-img',
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
  
  
    function joinAsGuest(token){
      hmsActions.join({
        userName: username,
        // authToken: guest_key,
        // authToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTIiLCJyb2xlIjoiZ3Vlc3QiLCJqdGkiOiIzZWM0ZGU4Zi02YWJhLTQ1NmQtODY2YS1jYzZlOGRmM2E4NWMiLCJleHAiOjE2NjYwMjM3ODQsImlhdCI6MTY2NTkzNzM4NCwibmJmIjoxNjY1OTM3Mzg0fQ.M5jyU7t5G54ncP9wtjjUg4nJJTsrnnBZPFFSws8TrUs',
        authToken:token,
        settings: {
          isAudioMuted: true,
          isVideoMuted: false
        },
        rememberDeviceSelection: false,
      });
    }
  
  
    async function renderPeers(peers) {
  
      tooltipActive = false;
  
      // const response = await fetch('http://127.0.0.1:5000/getQueue',{
      //   mode:'cors',
      //   headers:{'Content-Type':'application/json'}
      // });
      // const resp_data=await response.json();
  
      // q=resp_data.queue;
      // q_top=resp_data.top;
      // q_next=resp_data.next;
      // console.log('Current Queue: ',q);
      if (data != undefined && data.queueFront!=null && username == data.queueFront['name']) {
        var guestToken = data.guestKey;
        joinAsGuest(guestToken);
        // webSocketClient.send(`guestToken/${roomSelect}`);
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
              style: "margin:auto;"
            },
            "Evict"
          ),
          h(
            "div",
            {
              id: "remove-person-hover",
              style: "position:absolute;top:5%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ff3459;color:#ffffff;width:110%;aspect-ratio:5;"
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
              style: "margin:auto;"
            },
            "Next"
          ),
          h(
            "div",
            {
              id: "add-person-hover",
              style: "position:absolute;top:20%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
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
              id: "q-close-para",
              style: "margin:auto;"
            },
            queueOpen ? "Halt" : "Allow"
          ),
          h(
            "div",
            {
              id: "pause-person-hover",
              style: "position:absolute;top:35%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
            },
            queueOpen ? "Stop more candidates to join" : "Allow more candidates to join"
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
              id: "announce-person-hover",
              style: "position:absolute;top:50%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
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
              id: "break-person-hover",
              style: "position:absolute;top:65%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
            },
            "Take a break"
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
              style: "margin:auto;"
            },
            "Stop"
          ),
          h(
            "div",
            {
              id: "call-person-hover",
              style: "position:absolute;top:80%;left:100%;display:none;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);background-color:#ffffff;color:black;width:110%;aspect-ratio:5;"
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
            removePersonBtn.addEventListener('mouseover', () => {
              document.getElementById('remove-person-hover').style.display = "block";
            });
            removePersonBtn.addEventListener('mouseleave', () => {
              document.getElementById('remove-person-hover').style.display = "none";
            });
  
            var addPersonBtn = document.getElementById('add-person')
            addPersonBtn.addEventListener('mouseover', () => {
              document.getElementById('add-person-hover').style.display = "block";
            });
            addPersonBtn.addEventListener('mouseleave', () => {
              document.getElementById('add-person-hover').style.display = "none";
            });
  
            var pausePersonBtn = document.getElementById('q-close')
            pausePersonBtn.addEventListener('mouseover', () => {
              document.getElementById('pause-person-hover').style.display = "block";
            });
            pausePersonBtn.addEventListener('mouseleave', () => {
              document.getElementById('pause-person-hover').style.display = "none";
            });
  
            var announcePersonBtn = document.getElementById('chat')
            announcePersonBtn.addEventListener('mouseover', () => {
              document.getElementById('announce-person-hover').style.display = "block";
            });
            announcePersonBtn.addEventListener('mouseleave', () => {
              document.getElementById('announce-person-hover').style.display = "none";
            });
  
            var breakPersonBtn = document.getElementById('coffee-break')
            breakPersonBtn.addEventListener('mouseover', () => {
              document.getElementById('break-person-hover').style.display = "block";
            });
            breakPersonBtn.addEventListener('mouseleave', () => {
              document.getElementById('break-person-hover').style.display = "none";
            });
  
            var closePersonBtn = document.getElementById('call')
            closePersonBtn.addEventListener('mouseover', () => {
              document.getElementById('call-person-hover').style.display = "block";
            });
            closePersonBtn.addEventListener('mouseleave', () => {
              document.getElementById('call-person-hover').style.display = "none";
            });
  
            document.getElementById('remove-person').addEventListener('click', (event) => {
              event.stopImmediatePropagation();
  
              console.log('Evict btn clicked again');
  
              if (!tooltipActive) {
                console.log("Yahan bhi aa gaya!");
                tooltipActive = true;
                var remPer = document.getElementById('remove-person');
                remPer.setAttribute("disabled", false);
                var removetooltip = h(
                  "div",
                  {
                    class: "tooltip",
                    id: "removetooltip",
                    style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                  },
                  h(
                    "div",
                    {
                      id: "close-tip",
                      style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                    },
                    "x"
                  ),
                  h(
                    "div",
                    {
                      id: "remove-tip",
                    },
                    h(
                      "p",
                      {
                        style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                      },
                      "Are you sure you want to evict the candidate from the room?"
                    ),
                    h(
                      "p",
                      {
                        style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:600;padding:min(10px,1vw);cursor:pointer;"
                      },
                      h(
                        "span",
                        {
                          id: "remove-yes"
                        },
                        "Yes"
                      ),
                      h(
                        "span",
                        {
                          style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:500;padding:min(10px,1vw);"
                        },
                        " | "
                      ),
                      h(
                        "span",
                        {
                          id: "remove-no"
                        },
                        "No"
                      )
                    )
                  )
                );
                peerContainer.append(removetooltip);
  
                const closeTip = document.getElementById('close-tip');
                closeTip.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  const currentTip = document.getElementById('removetooltip');
                  peerContainer.removeChild(currentTip);
                  tooltipActive = false;
                });
  
                const removeYes = document.getElementById('remove-yes');
                removeYes.addEventListener('click', async (event) => {
                  event.stopImmediatePropagation();
                  await hmsActions.removePeer(ele.id, '');
                  // webSocketClient.send(`<feedback>/${ele.name}/${roomSelect}`);
                  const response  = await fetch('http://localhost/phantom/api/feedback',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId,'candidate':ele.name}),
                  });
                  tooltipActive = false;
  
  
                  screenOverlay = true;
                  console.log("Screen Overlay: ", screenOverlay);
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
                      console.log("Screen Overlay: ", screenOverlay);
                      peersContainer.style.display = "block";
                      // peersContainer.append(peerContainer);
                      // webSocketClient.send('pop');
                      console.log("Yahan tak aa gaya!!");
                      hmsStore.subscribe(renderPeers, selectPeers);
                    });
                  });
  
  
                });
  
                const removeNo = document.getElementById('remove-no');
                removeNo.addEventListener('click', (event) => {
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
  
  
                if (!tooltipActive) {
                  console.log("Yahan bhi aa gaya!");
                  tooltipActive = true;
                  var closeQ = document.getElementById('q-close');
                  var queuetooltip = h(
                    "div",
                    {
                      class: "tooltip",
                      id: "queuetooltip",
                      style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                    },
                    h(
                      "div",
                      {
                        id: "close-tip",
                        style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                      },
                      "x"
                    ),
                    h(
                      "div",
                      {
                        id: "queue-close-tip",
                      },
                      h(
                        "p",
                        {
                          style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                        },
                        "This indicates you dont want any more candidates to to appear for the interview in this room, at this time. Are you sure that you dont want any more candidates?"
                      ),
                      h(
                        "p",
                        {
                          style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:600;padding:min(10px,1vw);cursor:pointer;"
                        },
                        h(
                          "span",
                          {
                            id: "remove-yes"
                          },
                          "Yes"
                        ),
                        h(
                          "span",
                          {
                            style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:500;padding:min(10px,1vw);"
                          },
                          " | "
                        ),
                        h(
                          "span",
                          {
                            id: "remove-no"
                          },
                          "No"
                        )
                      )
                    )
                  );
                  peerContainer.append(queuetooltip);
  
                  const closeTip = document.getElementById('close-tip');
                  closeTip.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    const currentTip = document.getElementById('queuetooltip');
                    peerContainer.removeChild(currentTip);
                    tooltipActive = false;
                  });
  
                  const removeYes = document.getElementById('remove-yes');
                  removeYes.addEventListener('click', async (event) => {
                    event.stopImmediatePropagation();
                    // webSocketClient.send(`/closeQueue/${roomSelect}`);
                    const response  = await fetch('http://localhost/phantom/api/closeQueue',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId}),
                  });
                    document.getElementById('q-close-para').innerText = "Allow";
                    queueOpen = false;
                    tooltipActive = false;
                    const currentTip = document.getElementById('queuetooltip');
                    peerContainer.removeChild(currentTip);
  
                  });
  
                  const removeNo = document.getElementById('remove-no');
                  removeNo.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    const currentTip = document.getElementById('queuetooltip');
                    peerContainer.removeChild(currentTip);
                    tooltipActive = false;
                  });
                }
  
  
  
              }
              else {
  
  
                if (!tooltipActive) {
                  console.log("Yahan bhi aa gaya!");
                  tooltipActive = true;
                  var closeQ = document.getElementById('q-close');
                  var queuetooltip = h(
                    "div",
                    {
                      class: "tooltip",
                      id: "queuetooltip",
                      style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                    },
                    h(
                      "div",
                      {
                        id: "close-tip",
                        style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                      },
                      "x"
                    ),
                    h(
                      "div",
                      {
                        id: "queue-close-tip",
                      },
                      h(
                        "p",
                        {
                          style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                        },
                        "You are allowing candidates to join and appear for the interview. in this room . Are you sure?"
                      ),
                      h(
                        "p",
                        {
                          style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:600;padding:min(10px,1vw);cursor:pointer;"
                        },
                        h(
                          "span",
                          {
                            id: "remove-yes"
                          },
                          "Yes"
                        ),
                        h(
                          "span",
                          {
                            style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:500;padding:min(10px,1vw);"
                          },
                          " | "
                        ),
                        h(
                          "span",
                          {
                            id: "remove-no"
                          },
                          "No"
                        )
                      )
                    )
                  );
                  peerContainer.append(queuetooltip);
  
                  const closeTip = document.getElementById('close-tip');
                  closeTip.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    const currentTip = document.getElementById('queuetooltip');
                    peerContainer.removeChild(currentTip);
                    tooltipActive = false;
                  });
  
                  const removeYes = document.getElementById('remove-yes');
                  removeYes.addEventListener('click', async (event) => {
                    event.stopImmediatePropagation();
                    // webSocketClient.send(`/openQueue/${roomSelect}`);
                    const response  = await fetch('http://localhost/phantom/api/openQueue',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId}),
                  });
                    document.getElementById('q-close-para').innerText = "Halt";
                    queueOpen = true;
                    tooltipActive = false;
                    const currentTip = document.getElementById('queuetooltip');
                    peerContainer.removeChild(currentTip);
  
                  });
  
                  const removeNo = document.getElementById('remove-no');
                  removeNo.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    const currentTip = document.getElementById('queuetooltip');
                    peerContainer.removeChild(currentTip);
                    tooltipActive = false;
                  });
                }
  
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
  
              document.getElementById('announce').addEventListener('click', async(event) => {
                event.stopImmediatePropagation();
                var mssg = document.getElementById('announcement');
                console.log(mssg.value);
                // webSocketClient.send('broadcast/' + mssg.value+`/${roomSelect}`);
                const response  = await fetch('http://localhost/phantom/api/broadcast',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId,'message':mssg.value}),
                  });
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
  
  
              if (!tooltipActive) {
                console.log("Yahan bhi aa gaya!");
                tooltipActive = true;
                var addPer = document.getElementById('add-person');
                addPer.setAttribute("disabled", true);
  
                var addPertooltip = h(
                  "div",
                  {
                    class: "tooltip",
                    id: "addPertooltip",
                    style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                  },
                  h(
                    "div",
                    {
                      id: "close-tip",
                      style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                    },
                    "x"
                  ),
                  h(
                    "div",
                    {
                      id: "remove-tip",
                      style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                    },
                    "This button is used to call next candidate in the Q to join the room when its empty."
                  )
                );
                peerContainer.append(addPertooltip);
  
                const closeTip = document.getElementById('close-tip');
                closeTip.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  console.log("Close Tip Pressed!");
                  const currentTip = document.getElementById('addPertooltip');
                  peerContainer.removeChild(currentTip);
                  tooltipActive = false;
                });
              }
  
              // webSocketClient.send('pop');
            });
  
            document.getElementById('coffee-break').addEventListener('click', (event) => {
              event.stopImmediatePropagation();
  
  
              if (!tooltipActive) {
                console.log("Yahan bhi aa gaya!");
                tooltipActive = true;
                var coffeeBreak = document.getElementById('coffee-break');
                coffeeBreak.setAttribute("disabled", true);
  
                var coffeetooltip = h(
                  "div",
                  {
                    class: "tooltip",
                    id: "coffeetooltip",
                    style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                  },
                  h(
                    "div",
                    {
                      id: "close-tip",
                      style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                    },
                    "x"
                  ),
                  h(
                    "div",
                    {
                      id: "remove-tip",
                      style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                    },
                    "You can take coffee break when the room is empty"
                  )
                );
                peerContainer.append(coffeetooltip);
  
                const closeTip = document.getElementById('close-tip');
                closeTip.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  console.log("Close Tip Pressed!");
                  const currentTip = document.getElementById('coffeetooltip');
                  peerContainer.removeChild(currentTip);
                  tooltipActive = false;
                });
              }
  
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
          removePersonBtn.addEventListener('mouseenter', () => {
            document.getElementById('remove-person-hover').style.display = "block";
          });
          removePersonBtn.addEventListener('mouseleave', () => {
            document.getElementById('remove-person-hover').style.display = "none";
          });
  
          var addPersonBtn = document.getElementById('add-person')
          addPersonBtn.addEventListener('mouseover', () => {
            document.getElementById('add-person-hover').style.display = "block";
          });
          addPersonBtn.addEventListener('mouseleave', () => {
            document.getElementById('add-person-hover').style.display = "none";
          });
  
          var pausePersonBtn = document.getElementById('q-close')
          pausePersonBtn.addEventListener('mouseover', () => {
            document.getElementById('pause-person-hover').style.display = "block";
          });
          pausePersonBtn.addEventListener('mouseleave', () => {
            document.getElementById('pause-person-hover').style.display = "none";
          });
  
          var announcePersonBtn = document.getElementById('chat')
          announcePersonBtn.addEventListener('mouseover', () => {
            document.getElementById('announce-person-hover').style.display = "block";
          });
          announcePersonBtn.addEventListener('mouseleave', () => {
            document.getElementById('announce-person-hover').style.display = "none";
          });
  
          var breakPersonBtn = document.getElementById('coffee-break')
          breakPersonBtn.addEventListener('mouseover', () => {
            document.getElementById('break-person-hover').style.display = "block";
          });
          breakPersonBtn.addEventListener('mouseleave', () => {
            document.getElementById('break-person-hover').style.display = "none";
          });
  
          var closePersonBtn = document.getElementById('call')
          closePersonBtn.addEventListener('mouseover', () => {
            document.getElementById('call-person-hover').style.display = "block";
          });
          closePersonBtn.addEventListener('mouseleave', () => {
            document.getElementById('call-person-hover').style.display = "none";
          });
  
          document.getElementById('remove-person').addEventListener('click', async (event) => {
            event.stopImmediatePropagation();
            console.log('Evict btn pressed!');
            if (!tooltipActive) {
              console.log("Yahan bhi aa gaya!");
              tooltipActive = true;
              var remPer = document.getElementById('remove-person');
              remPer.setAttribute("disabled", true);
  
              var removetooltip = h(
                "div",
                {
                  class: "tooltip",
                  id: "removetooltip",
                  style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                },
                h(
                  "div",
                  {
                    id: "close-tip",
                    style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                  },
                  "x"
                ),
                h(
                  "div",
                  {
                    id: "remove-tip",
                    style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                  },
                  "No one is in the room. You can can use this feature to remove the candidate from the interview room"
                )
              );
              peerContainer.append(removetooltip);
  
              const closeTip = document.getElementById('close-tip');
              closeTip.addEventListener('click', (event) => {
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
  
  
              if (!tooltipActive) {
                console.log("Yahan bhi aa gaya!");
                tooltipActive = true;
                var closeQ = document.getElementById('q-close');
                var queuetooltip = h(
                  "div",
                  {
                    class: "tooltip",
                    id: "queuetooltip",
                    style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                  },
                  h(
                    "div",
                    {
                      id: "close-tip",
                      style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                    },
                    "x"
                  ),
                  h(
                    "div",
                    {
                      id: "queue-close-tip",
                    },
                    h(
                      "p",
                      {
                        style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                      },
                      "This indicates you dont want any more candidates to to appear for the interview in this room, at this time. Are you sure that you dont want any more candidates?"
                    ),
                    h(
                      "p",
                      {
                        style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:600;padding:min(10px,1vw);cursor:pointer;"
                      },
                      h(
                        "span",
                        {
                          id: "remove-yes"
                        },
                        "Yes"
                      ),
                      h(
                        "span",
                        {
                          style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:500;padding:min(10px,1vw);"
                        },
                        " | "
                      ),
                      h(
                        "span",
                        {
                          id: "remove-no"
                        },
                        "No"
                      )
                    )
                  )
                );
                peerContainer.append(queuetooltip);
  
                const closeTip = document.getElementById('close-tip');
                closeTip.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  const currentTip = document.getElementById('queuetooltip');
                  peerContainer.removeChild(currentTip);
                  tooltipActive = false;
                });
  
                const removeYes = document.getElementById('remove-yes');
                removeYes.addEventListener('click', async (event) => {
                  event.stopImmediatePropagation();
                  // webSocketClient.send(`/closeQueue/${roomSelect}`);
                  const response  = await fetch('http://localhost/phantom/api/closeQueue',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId}),
                  });
                  const data = await response.json();
                  document.getElementById('q-close-para').innerText = "Allow";
                  queueOpen = false;
                  tooltipActive = false;
                  const currentTip = document.getElementById('queuetooltip');
                  peerContainer.removeChild(currentTip);
  
                });
  
                const removeNo = document.getElementById('remove-no');
                removeNo.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  const currentTip = document.getElementById('queuetooltip');
                  peerContainer.removeChild(currentTip);
                  tooltipActive = false;
                });
              }
  
  
  
            }
            else {
  
  
              if (!tooltipActive) {
                console.log("Yahan bhi aa gaya!");
                tooltipActive = true;
                var closeQ = document.getElementById('q-close');
                var queuetooltip = h(
                  "div",
                  {
                    class: "tooltip",
                    id: "queuetooltip",
                    style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                  },
                  h(
                    "div",
                    {
                      id: "close-tip",
                      style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                    },
                    "x"
                  ),
                  h(
                    "div",
                    {
                      id: "queue-close-tip",
                    },
                    h(
                      "p",
                      {
                        style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                      },
                      "You are allowing candidates to join and appear for the interview. in this room . Are you sure?"
                    ),
                    h(
                      "p",
                      {
                        style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:600;padding:min(10px,1vw);cursor:pointer;"
                      },
                      h(
                        "span",
                        {
                          id: "remove-yes"
                        },
                        "Yes"
                      ),
                      h(
                        "span",
                        {
                          style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);font-weight:500;padding:min(10px,1vw);"
                        },
                        " | "
                      ),
                      h(
                        "span",
                        {
                          id: "remove-no"
                        },
                        "No"
                      )
                    )
                  )
                );
                peerContainer.append(queuetooltip);
  
                const closeTip = document.getElementById('close-tip');
                closeTip.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  const currentTip = document.getElementById('queuetooltip');
                  peerContainer.removeChild(currentTip);
                  tooltipActive = false;
                });
  
                const removeYes = document.getElementById('remove-yes');
                removeYes.addEventListener('click', async (event) => {
                  event.stopImmediatePropagation();
                  // webSocketClient.send(`/openQueue/${roomSelect}`);
                  const response  = await fetch('http://localhost/phantom/api/openQueue',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId}),
                  });
                  const data = await response.json();
                  document.getElementById('q-close-para').innerText = "Halt";
                  queueOpen = true;
                  tooltipActive = false;
                  const currentTip = document.getElementById('queuetooltip');
                  peerContainer.removeChild(currentTip);
  
                });
  
                const removeNo = document.getElementById('remove-no');
                removeNo.addEventListener('click', (event) => {
                  event.stopImmediatePropagation();
                  const currentTip = document.getElementById('queuetooltip');
                  peerContainer.removeChild(currentTip);
                  tooltipActive = false;
                });
              }
  
            }
  
          });
  
          var addPer = document.getElementById('add-person');
          addPer.setAttribute('disabled', false);
          addPer.addEventListener('click', async(event) => {
            event.stopImmediatePropagation();
            // webSocketClient.send(`pop/${roomSelect}`);
            const response = await fetch('http://localhost/phantom/api/dequeue',{
            method:'post',
            headers: { "Content-Type": "application/json",'Accept': 'application/json'},
            body: JSON.stringify({'roomId':roomId}),
          });
          const data = await response.json();
          console.log(data);
  
            if (!tooltipActive) {
              console.log("Yahan bhi aa gaya!");
              tooltipActive = true;
              var addPer = document.getElementById('add-person');
              addPer.setAttribute("disabled", true);
  
              var addPertooltip = h(
                "div",
                {
                  class: "tooltip",
                  id: "addPertooltip",
                  style: "width:50%;display:flex;background-color:#ffffff;position:absolute;top:3%;right:1%;z-index:100;border-radius:min(15px,1.5vw);"
                },
                h(
                  "div",
                  {
                    id: "close-tip",
                    style: "position:absolute;top:-4%;right:-4%;background-color:#ffffff;font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(8px,0.8vw);border-radius:50%;font-weight:600;cursor:pointer;"
                  },
                  "x"
                ),
                h(
                  "div",
                  {
                    id: "remove-tip",
                    style: "font-family: 'Manrope', sans-serif;font-style: normal;font-size:min(10px,1vw);padding:min(10px,1vw);"
                  },
                  "We are asking the next candidate in the Q to join the room"
                )
              );
              peerContainer.append(addPertooltip);
  
              const closeTip = document.getElementById('close-tip');
              closeTip.addEventListener('click', (event) => {
                event.stopImmediatePropagation();
                console.log("Close Tip Pressed!");
                const currentTip = document.getElementById('addPertooltip');
                peerContainer.removeChild(currentTip);
                tooltipActive = false;
              });
            }
  
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
  
            document.getElementById('announce').addEventListener('click', async(event) => {
              event.stopImmediatePropagation();
              var mssg = document.getElementById('announcement');
              console.log(mssg.value);
              // webSocketClient.send('broadcast/' + mssg.value+`/${roomSelect}`);
              const response  = await fetch('http://localhost/phantom/api/broadcast',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId,'message':mssg.value}),
                  });
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
            document.getElementById('coffee-break').setAttribute('disabled', false);
            screenOverlay = true;
            readyToOpenRoom = false;
            peersContainer.style.display = "none";
            coffee1.style.display = "flex";
            const timesetBtn = document.getElementById('timeset');
            const plus5Btn = document.getElementById('plus5');
            const minus5Btn = document.getElementById('minus5');
            var currentVal = 10;
            plus5Btn.addEventListener('click', (event) => {
              event.stopImmediatePropagation();
              currentVal = parseInt(timesetBtn.innerText);
              if (currentVal <= 55) {
                timesetBtn.innerText = currentVal + 5;
                currentVal += 5;
              }
            });
  
            minus5Btn.addEventListener('click', (event) => {
              event.stopImmediatePropagation();
              currentVal = parseInt(timesetBtn.innerText);
              if (currentVal >= 15) {
                timesetBtn.innerText = currentVal - 5;
                currentVal -= 5;
              }
            });
  
  
            const takeBreak = document.getElementById('take-break')
            takeBreak.addEventListener('click', async(event) => {
              event.stopImmediatePropagation();
              // webSocketClient.send(`/coffeeBreak/${currentVal}/${roomSelect}`);
              const response  = await fetch('http://localhost/phantom/api/breakStatus',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId,'breakDuration':currentVal}),
                  });
              coffee1.style.display = "none";
              coffee2.style.display = "flex";
              var countdown = document.getElementById('countdown');
              var timeInSeconds = currentVal * 60;
              (async function timer() {
                if (timeInSeconds > 0 && !readyToOpenRoom) {
                  setTimeout(() => {
                    var minutes = Math.floor(timeInSeconds / 60);
                    var seconds = timeInSeconds % 60;
                    if (seconds >= 10)
                      countdown.innerText = `${minutes}:${seconds}`;
                    else
                      countdown.innerText = `${minutes}:0${seconds}`;
                    timeInSeconds--;
                    timer();
                  }, 1000);
                }
                else {
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
              openRoom.addEventListener('click', async(event) => {
                event.stopImmediatePropagation();
                readyToOpenRoom = true;
                tooltipActive = false;
                countdown.innerText = "";
                // currentVal = 0;
                // timeInSeconds = 0;
                coffee2.style.display = "none";
                peersContainer.style.display = "none";
                const response  = await fetch('http://localhost/phantom/api/breakStatus',{
                    method:'post',
                    headers: { "Content-Type": "application/json",'Accept': 'application/json'},
                    body: JSON.stringify({'roomId':roomId}),
                  });
                isBreak = false;
                // joinBtn.click();
                joinAsHost(hostKey);
                setTimeout(() => {
                  screenOverlay = false;
                }, 1000);
              });
  
            });
          });
        }
  
  
  
  
      }
  
  
    }
  
  