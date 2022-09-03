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
  const conference = document.getElementById("conference");
  const peersContainer = document.getElementById("hostContainer");
  const leaveBtn = document.getElementById("leave-btn");
  const muteAud = document.getElementById("mute-aud");
  const muteVid = document.getElementById("mute-vid");
  const controls = document.getElementById("controls");

  var hosts={};
  var guests={};
  
  // Joining the room
  joinBtn.addEventListener("click", () => {
    hmsActions.join({
      userName: document.getElementById("name").value,
      authToken: document.getElementById("token").value
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
  function renderPeers(peers) {
    peersContainer.innerHTML = "";
  
    if (!peers) {
      // this allows us to make peer list an optional argument
      peers = hmsStore.getState(selectPeers);
    }
    console.log(peers);
    peers.forEach((peer) => {
        if(peer['roleName']=='host'){
            hosts[peer['id']]=peer;

            if (peer.videoTrack) {
                const video = h("video", {
                  class: "peer-video" + (peer.isLocal ? " local" : ""),
                  autoplay: true, // if video doesn't play we'll see a blank tile
                  muted: true,
                  playsinline: true,
                  style:"transform: scale(-1, 1); filter: FlipH;max-width:100%;aspect-ratio:16/9;object-fit:cover;z-index:-100;border-radius: 24px;margin-top:100px"
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
          
                peersContainer.append(peerContainer);
              }

        }
        else if(peer['roleName']=='guest'){
            guests[peer['id']]=peer;
            const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
            hmsActions.setLocalVideoEnabled(videoEnabled);
        }
      
    });

    console.log(hosts);
    console.log(guests);
  }
  
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
  
  // reactive state - renderPeers is called whenever there is a change in the peer-list
  hmsStore.subscribe(renderPeers, selectPeers);
  
  // listen to the connection state
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
  