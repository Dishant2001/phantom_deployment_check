
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


const startRoomBtn = document.getElementById('header-right-btn');
const nextbtn1 = document.getElementById('next1');
const nextbtn2 = document.getElementById('next2');
const nextbtn3 = document.getElementById('next3');
const prevbtn1 = document.getElementById('prev1');
const prevbtn2 = document.getElementById('prev2');
const firstForm = document.getElementById('first');
const secondForm = document.getElementById('second');
const thirdForm = document.getElementById('third');

const title = document.getElementById('title').value;
const location = document.getElementById('location').value;
const salary = document.getElementById('salary').value;
const skills = document.getElementById('skills').value;

const peersContainer = document.getElementById("hostContainer");
// const jobsList=document.getElementById('all-jobs');
// const totalCountSpan=document.getElementById('room-count');

function leaveRoom() {
    hmsActions.leave();
  }


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

  function buttonControl(){
    const mic=document.getElementById('mic');
    const call=document.getElementById('call');
    const cam=document.getElementById('video');
    
    if(mic.getAttribute('listener')!=='true'){
      mic.addEventListener('click',()=>{
        const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
        hmsActions.setLocalAudioEnabled(audioEnabled);
        console.log('Audio: ',audioEnabled);
        mic.style.backgroundColor=audioEnabled?"#fafafb":"#ff3459";
        mic.setAttribute('listener','true');
      });
    }
  
    if(cam.getAttribute('listener')!=='true'){
      cam.addEventListener('click',()=>{
        const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
        hmsActions.setLocalVideoEnabled(videoEnabled);
        cam.style.backgroundColor=videoEnabled?"#fafafb":"#ff3459";
        cam.setAttribute('listener','true');
        renderPeers();
      });
    }
  
    if(call.getAttribute('listener')!=='true'){
      call.addEventListener('click',()=>{
        call.setAttribute('listener','true');
        leaveRoom();
      });
    }
  
  }


  var temp = 0
var guests = 0;
var readyToGoIn=false;
var enterInCall=false;

function renderPeers(peers) {
  peersContainer.innerHTML = "";


  if (!peers) {
    // this allows us to make peer list an optional argument
    peers = hmsStore.getState(selectPeers);
  }


  var video='';

  const guestContainer = h(
    "div",
    {
      class:"guestContainer",
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
        listener:'false',
        style: "margin:auto;display: flex;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
      },
      h(
        "img",
        {
          src:"img/setting.png",
          style:"margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id: "mic",
        listener:'false',
        style: "margin:auto;display: flex;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
      },
      h(
        "img",
        {
          src:"img/mic.png",
          style:"margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id: "call",
        listener:'false',
        style: "margin:auto;display: flex;background-color: #4C67F4;height: 100%;aspect-ratio:1;z-index: 0;border-radius:23px;"
      },
      h(
        "img",
        {
          src:"img/receiver.png",
          style:"margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id: "video",
        listener:'false',
        style: "margin:auto;display: flex;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
      },
      h(
        "img",
        {
          src:"img/cam.png",
          style:"margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id: "chat",
        listener:'false',
        style: "margin:auto;display: flex;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:15px;"
      },
      h(
        "img",
        {
          src:"img/chat.png",
          style:"margin:auto;width:50%;"
        }
      )
    )
  );

  const hostControls = h(
    "div",
    {
      class:"hostControls"
    },
    h(
      "div",
      {
        id:"remove-person",
      },
      h(
        "img",
        {
          src:"img/out.png",
          style:"margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id:"add-person"
      },
      h(
        "img",
        {
          src:"img/person.png",
          style:"margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id:"chat"
      },
      h(
        "img",
        {
          src:"img/chat.png",
          style:"margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id:"q-close"
      },
      h(
        "img",
        {
          src:"img/Q.png",
          style:"margin:auto;width:50%;"
        }
      )
    ),
    h(
      "div",
      {
        id:"coffee-break"
      },
      h(
        "img",
        {
          src:"img/coffee.png",
          style:"margin:auto;width:50%;"
        }
      )
    )
  );

  var hosts={};
  var countHost=0;
  var checkIfHost=false;

  peers.forEach((peer)=>{
    if(peer.roleName=='host')
      ++countHost;
  });

  peers.forEach((peer) => {

    if (peer.roleName == 'host') {
      temp = 1;
      hosts[peer.id] = peer;
      console.log('No. of hosts: ',Object.keys(hosts).length);
      console.log('Host arrived');
      if (peer.videoTrack) {
        video = h("video", {
          class: "peer-video" + (peer.isLocal ? " local" : ""),
          autoplay: true, // if video doesn't play we'll see a blank tile
          muted: true,
          playsinline: true,
          style: "display:inline-flex;position:absolute;top:0;margin:auto;transform: scale(-1, 1); filter: FlipH;width:"+100/countHost+"%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
        });

        // this method takes a track ID and attaches that video track to a given
        // <video> element
        hmsActions.attachVideo(peer.videoTrack, video);

        if(peer.isLocal){
          checkIfHost=true;
        }

       


        const peerContainer = h(
          "div",
          {
            class: "peer-container",
            style:"display:flex;flex-direction:row;flex-wrap:wrap;position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
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
              class:"guestContainer",
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

        document.getElementById('remove-person').addEventListener('click',async()=>{
          var currrently_in = Object.values(queue.peek())[0];
          console.log("Currently interviewd: ",currrently_in);
          await hmsActions.removePeer(currrently_in.id, '');
        });


      }
    }
    else {
      var ele = {}
      ele[peer.id] = peer;
      if (!queue.search(peer.id)) {
        queue.enqueue(ele);
        console.log(queue);
        guests = guests + 1;
        console.log(`${guests} in the meeting`);
        console.log(peer);
      }

      if(peer.isLocal){
        if (peer.videoTrack) {
          const video_temp = h("video", {
            class: "peer-video" + (peer.isLocal ? " local" : ""),
            autoplay: true, // if video doesn't play we'll see a blank tile
            muted: true,
            playsinline: true,
            style: "display:inline-flex;position:absolute;top:0;margin:auto;transform: scale(-1, 1); filter: FlipH;width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;"
          });
  
          // this method takes a track ID and attaches that video track to a given
          // <video> element
          hmsActions.attachVideo(peer.videoTrack, video_temp);
  
          // if(peer.isLocal){
          //   checkIfHost=true;
          // }
  
         
  
  
          const peerContainer = h(
            "div",
            {
              class: "peer-container",
              style:"display:flex;flex-direction:row;flex-wrap:wrap;position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
            },
            video_temp,
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
                class:"guestContainer",
              },
              video_temp
            ),
              controlContainer,
          );
  
          
          
  
          
  
  
          peersContainer.append(peerContainer);

          buttonControl();

      }

    }
  }
  });


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


var host_key,guest_key,room_id,token;

startRoomBtn.addEventListener("click",async() => {
    const response = await fetch('https://mytestsite.net.in/room',{method:'POST'});
    const data = await response.json();
    console.log(data);
    host_key=data['host_key'];
    guest_key=data['guest_key'];
    room_id=data.room_details.id;
    token=data['token'];
  });

  nextbtn1.addEventListener('click',()=>{
    firstForm.style.display="none";
    secondForm.style.display="flex";
  });
  nextbtn2.addEventListener('click',async ()=>{
    secondForm.style.display="none";
    thirdForm.style.display="flex";



    const response = await fetch('https://mytestsite.net.in/room',{method:'POST'});
    const data = await response.json();
    console.log(data);
    host_key=data['host_key'];
    guest_key=data['guest_key'];
    room_id=data.room_details.id;
    token=data['token'];

    hmsActions.join({
        userName: '',
        authToken: host_key,
        // authToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTEiLCJyb2xlIjoiaG9zdCIsImp0aSI6ImZjNjNlYjkxLWM3YjAtNDNkNS05NjkwLTY4NDIwNWNjZDA1ZSIsImV4cCI6MTY2NDAyNzEwOCwiaWF0IjoxNjYzOTQwNzA4LCJuYmYiOjE2NjM5NDA3MDh9.F87ulB6T7B6_e6wROU298Sb_Uw_6Yo-bRbh5ojlJYV8",
        settings: {
          isAudioMuted: false,
          isVideoMuted: false
        },
        rememberDeviceSelection: true,
      });
      const role = hmsStore.getState(selectLocalPeerRole);

      hmsStore.subscribe(renderPeers, selectPeers);




  });


  nextbtn3.addEventListener('click',async ()=>{
    thirdForm.style.display="none";
    // secondForm.style.display="flex";
    hmsActions.leave();

    var sendData={'room':room_id,'job':title,'description':salary+' '+location+' '+skills};

    const response = await fetch('https://mytestsite.net.in/createdRoomDetails',{method:'POST',body:`room=${room_id}&job=${title}&description=${salary+' '+location+' '+skills}`,headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }});

  });


  prevbtn1.addEventListener('click',()=>{
    firstForm.style.display="flex";
    secondForm.style.display="none";
    hmsActions.leave();
  });
  prevbtn2.addEventListener('click',()=>{
    secondForm.style.display="flex";
    thirdForm.style.display="none";
    hmsActions.leave();
  });