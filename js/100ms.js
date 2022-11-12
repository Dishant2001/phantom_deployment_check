import {
    HMSReactiveStore,
    selectIsConnectedToRoom,
    selectIsLocalAudioEnabled,
    selectIsLocalVideoEnabled,
    selectPeers,
    selectLocalPeerRole,
    selectMessagesByPeerID,
} from "https://cdn.skypack.dev/@100mslive/hms-video-store";

// Initialize HMS Store
const hmsManager = new HMSReactiveStore();
hmsManager.triggerOnSubscribe();
const hmsStore = hmsManager.getStore();
const hmsActions = hmsManager.getHMSActions();


function joinRoom(username,token,audioMuted,videoMuted,remember){
    hmsActions.join({
        userName: username,
        authToken: token,
        settings: {
            isAudioMuted: audioMuted,//boolean
            isVideoMuted: videoMuted//boolean
        },
        rememberDeviceSelection: remember,//boolean
    });
}

function attachVideoToContainer(peer,container){
    hmsActions.attachVideo(peer.videoTrack, container);
}

function leave(){
    hmsActions.leave();
}

function audioState(){
    const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
    hmsActions.setLocalAudioEnabled(audioEnabled);
    return audioEnabled;
}

function videoState(){
    const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
    hmsActions.setLocalVideoEnabled(videoEnabled);
    return videoEnabled;
}

function getRoomState(){
    var peers = hmsStore.getState(selectPeers);
    return peers;
}

async function removePeer(ele,mssg){
    await hmsActions.removePeer(ele.id, mssg);
}

function sendMessage(mssg,peer){
    console.log("Mssg to be sent: ",mssg);
    console.log("sending to: ",peer.name);
    hmsActions.sendDirectMessage(mssg,peer.id);
}

function subscribetoMessages(renderMessages,peer){
    if(peer!=null){
        hmsStore.subscribe(renderMessages,selectMessagesByPeerID(peer.id));
    }
}

function subscribeToChange(renderPeers){
    hmsStore.subscribe(renderPeers, selectPeers);
}

export {
    joinRoom,
    attachVideoToContainer,
    leave,
    audioState,
    videoState,
    getRoomState,
    removePeer,
    subscribeToChange,
    sendMessage,
    subscribetoMessages
};

//renderPeers is a function which is used to render video Room on browser. It has been implemented in the temp.js file

//Example of how renderPeers works
//display a tile for each peer in the peer list
// function renderPeers(peers) {
//     peersContainer.innerHTML = "";
  
//     if (!peers) {
//       // this allows us to make peer list an optional argument
//       peers = getRoomState();
//     }
  
//     peers.forEach((peer) => {
//       if (peer.videoTrack) {
//         const video = h("video", {
//           class: "peer-video" + (peer.isLocal ? " local" : ""),
//           autoplay: true, // if video doesn't play we'll see a blank tile
//           muted: true,
//           playsinline: true
//         });
  
//         // this method takes a track ID and attaches that video track to a given
//         // <video> element
//         hmsActions.attachVideo(peer.videoTrack, video);
  
//         const peerContainer = h(
//           "div",
//           {
//             class: "peer-container"
//           },
//           video,
//           h(
//             "div",
//             {
//               class: "peer-name"
//             },
//             peer.name + (peer.isLocal ? " (You)" : "")
//           )
//         );
  
//         peersContainer.append(peerContainer);
//       }
//     });
//   }

