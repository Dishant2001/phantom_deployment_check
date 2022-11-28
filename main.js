const APP_ID = "229f7b2123034802a9bc71c29c097fe1"
const TOKEN = "006229f7b2123034802a9bc71c29c097fe1IADE/0pc4U+qirSbJOAUH/2HJtPg24AAJt1yYtX76aNlgC4VsiUAAAAAIgAnggAAZ5iFYwQAAQBnmIVjAwBnmIVjAgBnmIVjBABnmIVj"
const CHANNEL = "Room1"


const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const extension = new VirtualBackgroundExtension();

AgoraRTC.registerExtensions([extension]);

let localTracks = []
let remoteUsers = {}
let screenTrack = null;
let isSharingEnabled = false;
let UID = null;
let processor = null;
let virtualBackgroundEnabled = false;
let imgElement = null;


WebIM.conn = new WebIM.connection({
    appKey: "71833649#1034879",
})


WebIM.conn.addEventHandler('connection&message', {
    onConnected: () => {
        // document.getElementById("log").appendChild(document.createElement('div')).append("Connect success !")
        console.log("Connect success!");
    },
    onDisconnected: () => {
        // document.getElementById("log").appendChild(document.createElement('div')).append("Logout success !")
        console.log("Logout success!");
    },
    onTextMessage: (message) => {
        console.log(message)
        document.getElementById('chats').insertAdjacentHTML("beforeend",`<p>${message['msg']}</p>`);
        // document.getElementById("log").appendChild(document.createElement('div')).append("Message from: " + message.from + " Message: " + message.msg)
    },
    onTokenWillExpire: (params) => {
        // document.getElementById("log").appendChild(document.createElement('div')).append("Token is about to expire")
        // refreshToken(username, password)
    },
    onTokenExpired: (params) => {
        // document.getElementById("log").appendChild(document.createElement('div')).append("The token has expired")
        // refreshToken(username, password)
    },
    onError: (error) => {
        console.log('on error', error)
    }
})

function openChatConn(){
    WebIM.conn.open({
        user: "dishant2001",
        agoraToken: "007eJxTYDiYf18iZL9Zgd6EBde/N3R98HwYnGrQseuKg5zFig3XQ9QVGIyMLNPMk4wMjYwNjE0sDIwSLZOSzQ2TjSyTDSzN01INo3RakhsCGRkU5k9hZGRgZWAEQhBfhcHcxMIo1TTZQNcsNTlF19AwNUXXMsnETNfA0iw51cDU0CI1yRIAeoEm5g==",
    });
}

function closeChatConn(){
    WebIM.conn.close();
}

function htmlForVideo(UID) {
    let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}"></div>
                  </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
}

function htmlForScreenShare() {
    let player = `<div class="video-container" id="screen-share-cont">
                        <div class="video-player" id="screen-cont"></div>
                  </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
}

async function joinAndDisplayLocalStream() {

    client.on('user-published', handleUserJoined)

    client.on('user-left', handleUserLeft)

    UID = await client.join(APP_ID, CHANNEL, TOKEN, null)

    openChatConn();

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()


    htmlForVideo(UID);

    localTracks[1].play(`user-${UID}`)

    await client.publish([localTracks[0], localTracks[1]])
}

async function joinStream() {
    await joinAndDisplayLocalStream()
    document.getElementById('join-btn').style.display = 'none'
    document.getElementById('main').style.display = 'flex'
    document.getElementById('chat').style.display = 'block';
}

function chatBoxPop(){
    document.getElementById('chatbox').style.display = document.getElementById('chatbox').style.display == 'flex'?'none':'flex';
}

async function handleUserJoined(user, mediaType) {
    peerId = user.uid;
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)

    if (mediaType === 'video') {
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null) {
            player.remove()
        }

        htmlForVideo(user.uid);

        user.videoTrack.play(`user-${user.uid}`)
    }

    if (mediaType === 'audio') {
        user.audioTrack.play()
    }
}

async function handleUserLeft(user) {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

async function leaveAndRemoveLocalStream() {
    for (let i = 0; localTracks.length > i; i++) {
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave();

    closeChatConn();

    document.getElementById('join-btn').style.display = 'block'
    document.getElementById('main').style.display = 'none'
    document.getElementById('video-streams').innerHTML = ''
    document.getElementById('chat').style.display = 'none';
    document.getElementById('chats').innerHTML = '';
}

async function toggleMic(e) {
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false)
        e.target.innerText = 'Mute'
        e.target.style.backgroundColor = 'cadetblue'
    } else {
        await localTracks[0].setMuted(true)
        e.target.innerText = 'Unmute'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

async function toggleCamera(e) {
    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false)
        e.target.innerText = 'Camera switch off'
        e.target.style.backgroundColor = 'cadetblue'
    } else {
        await localTracks[1].setMuted(true);
        e.target.innerText = 'Camera switch on';
        e.target.style.backgroundColor = '#EE4B2B';
    }
}


async function screenShare() {

    if (isSharingEnabled == false) {
        screenTrack = await AgoraRTC.createScreenVideoTrack();
        await client.unpublish([localTracks[0], localTracks[1]]);
        await client.publish(screenTrack);
        htmlForScreenShare();
        screenTrack.play(`screen-cont`);
        document.getElementById(`screen-share-btn`).innerHTML = "Stop Sharing";
        isSharingEnabled = true;
    } else {
        screenTrack.stop();
        await client.unpublish(screenTrack);
        document.getElementById('screen-share-cont').remove();
        await client.publish([localTracks[0], localTracks[1]]);
        localTracks[1].play(`user-${UID}`);
        document.getElementById(`screen-share-btn`).innerHTML = "Share Screen";

        isSharingEnabled = false;
    }
}

async function getProcessorInstance() {
    if (!processor && localTracks[1]) {
        processor = extension.createProcessor();

        try {
            await processor.init("agora-extension-virtual-background/wasms");
        } catch (e) {
            console.log("Fail to load WASM resource!"); return null;
        }
        localTracks[1].pipe(processor).pipe(localTracks[1].processorDestination);
    }
    return processor;
}

async function setBackgroundBlurring() {
    if (localTracks[1] && !virtualBackgroundEnabled) {

        processor = await getProcessorInstance();

        try {
            processor.setOptions({ type: 'blur', blurDegree: 1 });
            await processor.enable();
            document.getElementById('blur-btn').innerText = "Remove Background";
        } catch (e) {
            console.log(e);
        }

        virtualBackgroundEnabled = true;
    }
    else {
        await processor.disable();
        document.getElementById('blur-btn').innerText = "Blur Background";

        virtualBackgroundEnabled = false;
    }
}

async function setBackgroundColor() {
    if (localTracks[1] && !virtualBackgroundEnabled) {

        let processor = await getProcessorInstance();

        try {
            processor.setOptions({ type: 'color', color: '#ffffff' });
            await processor.enable();
            document.getElementById('color-btn').innerText = "Remove Color";
        } catch (e) {
            console.log(e);
        }

        virtualBackgroundEnabled = true;
    }
    else {
        await processor.disable();
        document.getElementById('color-btn').innerText = "Color Background";

        virtualBackgroundEnabled = false;
    }
}

async function setBackgroundImage() {
    if (!virtualBackgroundEnabled) {
        imgElement = document.createElement('img');

        imgElement.onload = async() => {
      
            let processor = await getProcessorInstance();
      
            try {
              processor.setOptions({type: 'img', source: imgElement});
              await processor.enable();
              document.getElementById('bgimg-btn').innerText = "Remove Image";
            }  catch(e) {
                console.log(e);
            }
      
            virtualBackgroundEnabled = true;
          }

        imgElement.src = 'background.jpg';

        
    }
    else {
        await processor.disable();
        document.getElementById('bgimg-btn').innerText = "Background Image";
        imgElement = null;
        virtualBackgroundEnabled = false;
    }
}


function sendMssg(){
    let option = {
        chatType: 'singleChat',    // Set it to single chat
        type: 'txt',               // Message type
        to: 'dishant2001',                // The user receiving the message (user ID)
        msg: UID + ' : ' + document.getElementById('mssg').value           // The message content
    }

    let msg = WebIM.message.create(option); 
    WebIM.conn.send(msg).then((res) => {
        console.log('send private text success');
        document.getElementById('chats').insertAdjacentHTML("beforeend",`<p>${option['msg']}</p>`);
    }).catch((err) => {
        console.log('send private text fail', err);
    })
}




document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('chat').addEventListener('click',chatBoxPop);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('screen-share-btn').addEventListener('click', screenShare);
document.getElementById('blur-btn').addEventListener('click', setBackgroundBlurring);
document.getElementById('color-btn').addEventListener('click', setBackgroundColor);
document.getElementById('bgimg-btn').addEventListener('click', setBackgroundImage);
document.getElementById('send').addEventListener('click',sendMssg);
