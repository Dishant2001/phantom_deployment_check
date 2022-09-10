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
  const conference = document.getElementById("conference");
  const peersContainer = document.getElementById("hostContainer");
  const startRoomBtn = document.getElementById('header-right-btn');
  const leaveBtn = document.getElementById("leave-btn");
  const muteAud = document.getElementById("mute-aud");
  const muteVid = document.getElementById("mute-vid");
  const controls = document.getElementById("controls");



  class Queue {
    constructor() {
        this.items = [];
    }
    
    enqueue(element) {
      console.log(String(Object.values(element)[0].joinedAt).slice(15,24));
      if (this.items.length==0)
        return this.items.push(element);
      else{
        for(var i=0;i<this.items.length;++i){
          if(String(Object.values(this.items[i])[0].joinedAt).slice(15,24)>String(Object.values(element)[0].joinedAt).slice(15,24)){
            this.items.splice(i,0,element);
            console.log('this.items:  ',this.items)
          }
        }
      }
    }
    
    dequeue() {
        if(this.items.length > 0) {
            return this.items.shift();
        }
    }
    
    peek() {
        return this.items[this.items.length - 1];
    }
    
    isEmpty(){
       return this.items.length == 0;
    }
   
    size(){
        return this.items.length;
    }
 
    clear(){
        this.items = [];
    }

    search(id){
      for(var i=0;i<this.items.length;++i){
        if(Object.keys(this.items[i])[0]==id)
          return true;
      }
      return false;
    }
}

let queue = new Queue();


  var hosts={};
  var guests={};
  var host_key='',guest_key='',token='';

  // startRoomBtn.addEventListener("click",async() => {
  //   const response = await fetch('http://localhost:5000/room',{method:'POST'});
  //   const data = await response.json();
  //   console.log(data);
  //   host_key=data['host_key'];
  //   guest_key=data['guest_key'];
  //   token=data['token'];
  // });
  
  // Joining the room
  joinBtn.addEventListener("click", () => {
    hmsActions.join({
      userName: document.getElementById("name").value,
      // authToken: host_key,
      authToken:"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTEiLCJyb2xlIjoiaG9zdCIsImp0aSI6IjkwMjRhYjU0LTdmMjItNDAxMC04ZTUxLTQ3NWM1OTMxZjg4YyIsImV4cCI6MTY2Mjg3NDAwMywiaWF0IjoxNjYyNzg3NjAzLCJuYmYiOjE2NjI3ODc2MDN9.gzw0bfMQQlS_6e4Np5OGeISN9Bulrm6LzCSfzR8dRnQ",
      settings: {
        isAudioMuted: false,
        isVideoMuted: false
    },
    rememberDeviceSelection: true,
    });
    const role = hmsStore.getState(selectLocalPeerRole);
    console.log(role)
  });

  joinBtnGuest.addEventListener("click", async() => {
    // const response = await fetch('http://localhost:5000/guestkey',{method:'POST'});
    // const data = await response.json();
    hmsActions.join({
      userName: document.getElementById("name").value,
      // authToken: data['guest_key'],
      authToken:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2Nlc3Nfa2V5IjoiNjMxMmVmZjdiMWU3ODBlNzhjM2NlZDI0IiwidHlwZSI6ImFwcCIsInZlcnNpb24iOjIsInJvb21faWQiOiI2MzE2ZTFjM2IxZTc4MGU3OGMzZDFkY2YiLCJ1c2VyX2lkIjoidTIiLCJyb2xlIjoiZ3Vlc3QiLCJqdGkiOiIwMmYxZDY2OC1kNzAyLTRmNDItOGQ2MS03N2RlNWI4YTcwMGQiLCJleHAiOjE2NjI4NzQwMDMsImlhdCI6MTY2Mjc4NzYwMywibmJmIjoxNjYyNzg3NjAzfQ.2nPlKUQW802flxn-nwVQ0IYdDwji8i21IXI9lsAEj-Q',
      settings: {
        isAudioMuted: true,
        isVideoMuted: true
    },
    rememberDeviceSelection: true,
    });
    const role = hmsStore.getState(selectLocalPeerRole);
    console.log(role)
  });
  
  // Leaving the room
  function leaveRoom() {
    hmsActions.leave();
  }
  
  // Cleanup if user refreshes the tab or navigates away
  window.onunload = window.onbeforeunload = leaveRoom;
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

  var temp=0
  var guests=0;
  function renderPeers(peers) {
    peersContainer.innerHTML = "";
    queue.clear();
  
    if (!peers) {
      // this allows us to make peer list an optional argument
      peers = hmsStore.getState(selectPeers);
    }
  
    peers.forEach((peer) => {

      if(peer.roleName=='host'){
        temp=1;
        hosts[peer.id]=peer;
        console.log('Host arrived');
        if (peer.videoTrack) {
          const video = h("video", {
                            class: "peer-video" + (peer.isLocal ? " local" : ""),
                            autoplay: true, // if video doesn't play we'll see a blank tile
                            muted: true,
                            playsinline: true,
                            style:"transform: scale(-1, 1); filter: FlipH;width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;margin-top:100px"
                          });
    
          // this method takes a track ID and attaches that video track to a given
          // <video> element
          hmsActions.attachVideo(peer.videoTrack, video);
    
          const peerContainer = h(
            "div",
            {
              class: "peer-container"
            },
            video,
            h(
              "div",
              {
                class: "peer-name"
              },
              peer.name + (peer.isLocal ? " (You)" : "")
            )
          );

          const controlContainer = h(
            "div",
            {
              class:"controls",
              style:"position: absolute;top:82%;margin:auto;display: flex;flex-direction: row;justify-content: space-around;background:none;width: 70%;height: 10%;z-index: 0;justify-content:space-around;"
            },
            h(
              "div",
              {
                id:"setting",
                style:"margin:auto;display: inline-block;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:20px;"
              },
              "settings"
            ),
            h(
              "div",
              {
                id:"mic",
                style:"margin:auto;display: inline-block;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:20px;"
              },
              "mic"
            ),
            h(
              "div",
              {
                id:"call",
                style:"margin:auto;display: inline-block;background-color: #4C67F4;height: 100%;aspect-ratio:1;z-index: 0;border-radius:25px;"
              },
              "call"
            ),
            h(
              "div",
              {
                id:"video",
                style:"margin:auto;display: inline-block;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:20px;"
              },
              "video"
            ),
            h(
              "div",
              {
                id:"chat",
                style:"margin:auto;display: inline-block;background-color: #FAFAFB;height: 80%;aspect-ratio:1;z-index: 0;border-radius:20px;"
              },
              "chat"
            )
          );

    
          peersContainer.append(peerContainer);
          peersContainer.append(controlContainer);
        }
      }
      else{
        var ele={}
        ele[peer.id]=peer;
        if(!queue.search(peer.id)){
          queue.enqueue(ele);
          console.log(queue);
          guests=guests+1;
          console.log(`${guests} in the meeting`);
          console.log(peer);
          const peerContainer = h(
            "div",
            {
              class: "peer-container"
            },
            h(
              "div",
              {
                class: "peer-name"
              },
              peer.name + (peer.isLocal ? " (You)" : "") + `  ${peer.id} `+'Joined at: '+ `${peer.joinedAt}`
            )
          );
    
          peersContainer.append(peerContainer);
          
      }
      }
    });
    if(peers.length!=0 && queue.size()!=0){
      console.log(queue.peek());
      var top_guest=Object.values(queue.peek())[0];
      console.log(top_guest);
      if (top_guest.videoTrack) {
        const video_guest = h("video", {
                          class: "peer-video" + (top_guest.isLocal ? " local" : ""),
                          autoplay: true, // if video doesn't play we'll see a blank tile
                          muted: true,
                          playsinline: true,
                          style:"transform: scale(-1, 1); filter: FlipH;width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;margin-top:100px"
                        });
                      
                        hmsActions.attachVideo(top_guest.videoTrack, video_guest);
                        const peerContainer = h(
                          "div",
                          {
                            class: "peer-container"
                          },
                          video_guest,
                          h(
                            "div",
                            {
                              class: "peer-name"
                            },
                            top_guest.name + (top_guest.isLocal ? " (You)" : "")
                          )
                        );
                        peersContainer.append(peerContainer);
                      }
    }


  }

// subscribe to the peers, so render is called whenever there is a change like peer join and leave
hmsStore.subscribe(renderPeers, selectPeers);




  var temp=0
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
  
  function onConnection(isConnected) {
    if (isConnected) {
      form.classList.add("hide");
      conference.classList.remove("hide");
      leaveBtn.classList.remove("hide");
      controls.classList.remove("hide");
    } else {
      form.classList.remove("hide");
      conference.classList.add("hide");
      leaveBtn.classList.add("hide");
      controls.classList.add("hide");
    }
  }
  
  // // reactive state - renderPeers is called whenever there is a change in the peer-list
  // hmsStore.subscribe(renderPeers, selectPeers);
  
  // // listen to the connection state
  hmsStore.subscribe(onConnection, selectIsConnectedToRoom);
  
  muteAud.addEventListener("click", () => {
    const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
  
    hmsActions.setLocalAudioEnabled(audioEnabled);
  
    muteAud.textContent = audioEnabled ? "Mute" : "Unmute";
  });
  
  muteVid.addEventListener("click", () => {
    const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
  
    hmsActions.setLocalVideoEnabled(videoEnabled);
  
    muteVid.textContent = videoEnabled ? "Hide" : "Unhide";
  
    // Re-render video tile
    renderPeers();
  });
  