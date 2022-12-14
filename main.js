const APP_ID = "229f7b2123034802a9bc71c29c097fe1"
const TOKEN = "006229f7b2123034802a9bc71c29c097fe1IACW7LHBWfh+spnJXbDkx2XoQ436s9nX2YXfpifc6wGXIwJ0vMsAAAAAIgDq5AAA5NWaYwQAAQDk1ZpjAwDk1ZpjAgDk1ZpjBADk1Zpj"
const CHANNEL = "Room3"


const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
const chatClient = AgoraRTM.createInstance(APP_ID);

let channel = chatClient.createChannel(CHANNEL);

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
let UserID = null;

const notifySound = new Audio('notify.mp3');



function beepSound() {
    // notifySound.play();
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

async function chatLogin(user, token) {
    await chatClient.login({ "uid": user, "token": token });
}

async function userChatLogin(userId) {
    if (userId.toLowerCase().includes("dishant")) {
        await chatLogin("dishant2001", "006229f7b2123034802a9bc71c29c097fe1IAA7FJI96nIKhEeqMbYyVEp1ki1Z9GKbs7Z9IbcXFJI0CPWz5I8AAAAAEADbKQAAH9aaYwEA6AMf1ppj");
    }
    else if (userId.toLowerCase().includes("deepak")) {
        await chatLogin("deepak1", "006229f7b2123034802a9bc71c29c097fe1IAD766c2/a1YXJ/rZ2argSGy7vOWJLd6S9oAwMgEcUu+5oFigx4AAAAAEACLIwAANdaaYwEA6AM11ppj");
    }
    else if (userId.toLowerCase().includes("jayshree")) {
        await chatLogin("jayshree1", "006229f7b2123034802a9bc71c29c097fe1IAAnwrGGoTKo0TJIr3nHizj8IchIfJ8Xd/SWlN8gyOfURq6Xf6gAAAAAEABfrwAATtaaYwEA6ANO1ppj");
    }
    else if (userId.toLowerCase().includes("rajesh")) {
        await chatLogin("rajesh1", "006229f7b2123034802a9bc71c29c097fe1IADKpdlEzMA0QXNyNDgPFI89VwrhPjSYT4khydP8ebPNssKdBFAAAAAAEAA36wAAdNaaYwEA6AN01ppj");
    }
}

function connectionStatus(){
    client.on("connection-state-change", (curState, prevState, reason) => {

        // The sample code uses debug console to show the connection state. In a real-world application, you can add
        // a label or a icon to the user interface to show the connection state. 
        // Display the current connection state.
        console.log("Connection state has changed to :" + curState);
        // Display the previous connection state.
        console.log("Connection state was : " + prevState);
        // Display the connection state change reason.
        console.log("Connection state change reason : " + reason);
    });
}

async function joinAndDisplayLocalStream() {

    connectionStatus();

    client.on('user-published', handleUserJoined)

    client.on('user-left', handleUserLeft)

    client.enableDualStream();

    UID = await client.join(APP_ID, CHANNEL, TOKEN, null)

    console.log("joined: ",UID);

    beepSound();

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({ optimizationMode: "detail" })



    htmlForVideo(UID);

    localTracks[1].play(`user-${UID}`)

    console.log("Your mic sound: ",localTracks[0]);

    await client.publish([localTracks[0], localTracks[1]])

    await userChatLogin(UserID);

    await channel.join();

}

async function joinStream() {
    UserID = document.getElementById('user').value;
    await joinAndDisplayLocalStream()

    document.getElementById('join-btn').style.display = 'none';
    document.getElementById('user').style.display = "none";
    document.getElementById('main').style.display = 'flex';
    document.getElementById('chat').style.display = 'block';
}

function chatBoxPop() {
    document.getElementById('chatbox').style.display = document.getElementById('chatbox').style.display == 'flex' ? 'none' : 'flex';
}

async function handleUserJoined(user, mediaType) {
    peerId = user.uid;

    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)

    beepSound();

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

    beepSound();

    document.getElementById(`user-container-${user.uid}`).remove()
}

async function leaveAndRemoveLocalStream() {
    for (let i = 0; localTracks.length > i; i++) {
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave();
    if (channel != null) {
        await channel.leave();
    }
    await chatClient.logout();

    beepSound();

    document.getElementById('join-btn').style.display = 'block'
    document.getElementById('user').style.display = 'block';
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
        await client.unpublish([localTracks[1]]);
        await client.publish(screenTrack);
        htmlForScreenShare();
        screenTrack.play(`screen-cont`);
        document.getElementById(`screen-share-btn`).innerHTML = "Stop Sharing";
        isSharingEnabled = true;
    } else {
        screenTrack.stop();
        await client.unpublish(screenTrack);
        document.getElementById('screen-share-cont').remove();
        await client.publish([localTracks[1]]);
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

        imgElement.onload = async () => {

            let processor = await getProcessorInstance();

            try {
                processor.setOptions({ type: 'img', source: imgElement });
                await processor.enable();
                document.getElementById('bgimg-btn').innerText = "Remove Image";
            } catch (e) {
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


async function sendMssg() {

    let channelMessage = document.getElementById("mssg").value

    if (channel != null) {
        await channel.sendMessage({ text: channelMessage }).then(() => {

            document.getElementById("chats").insertAdjacentHTML('beforeend', `<p>${UserID + ' : ' + channelMessage}</p>`);

        }

        )
    }
}


function upLinkNetworkQuality() {
    client.on("network-quality", (quality) => {
        if (quality.uplinkNetworkQuality == 1) {
            document.getElementById("upLinkIndicator").innerHTML = "Excellent";
            document.getElementById("upLinkIndicator").style.color = "green";
        }
        else if (quality.uplinkNetworkQuality == 2) {
            document.getElementById("upLinkIndicator").innerHTML = "Good";
            document.getElementById("upLinkIndicator").style.color = "yellow";
        }
        else (quality.uplinkNetworkQuality >= 4)
        {
            document.getElementById("upLinkIndicator").innerHTML = "Poor";
            document.getElementById("upLinkIndicator").style.color = "red";
        }
    });
}


function downLinkNetworkQuality() {
    client.on("network-quality", (quality) => {
        if (quality.downlinkNetworkQuality == 1) {
            document.getElementById("downLinkIndicator").innerHTML = "Excellent";
            document.getElementById("downLinkIndicator").style.color = "green";
        }
        else if (quality.downlinkNetworkQuality == 2) {
            document.getElementById("downLinkIndicator").innerHTML = "Good";
            document.getElementById("downLinkIndicator").style.color = "yellow";
        }
        else if (quality.downlinkNetworkQuality >= 4) {
            document.getElementById("downLinkIndicator").innerHTML = "Poor";
            document.getElementById("downLinkIndicator").style.color = "red";
        }
    });
}

function remoteNetworkQuality(){
    var networkQualities = client.getRemoteNetworkQuality();
    console.log("Remote:  ",networkQualities);
}

function remoteVideo(){
    var videos = client.getRemoteVideoStats();
    console.log("Remote Video:  ",videos);
}

function remoteAudio(){
    var audios = client.getRemoteAudioStats();
    console.log("Remote Audio:  ",audios);
}


async function micTest(){
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioContext = new AudioContext();
    const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream);
    const analyserNode = audioContext.createAnalyser();
    mediaStreamAudioSourceNode.connect(analyserNode);
    
    const pcmData = new Float32Array(analyserNode.fftSize);
    const onFrame = () => {
        analyserNode.getFloatTimeDomainData(pcmData);
        let sumSquares = 0.0;
        for (const amplitude of pcmData) { sumSquares += amplitude*amplitude; }
        
        var val = Math.sqrt(sumSquares / pcmData.length)

        document.getElementById('volumeMeter').innerText = (val>0.05 && localTracks.length>0 && localTracks[0].muted)?"Are you speaking?":"";
        
        window.requestAnimationFrame(onFrame);
    };
    window.requestAnimationFrame(onFrame);
}

micTest();





channel.on('ChannelMessage', function (message, memberId) {

    console.log("Message received from: " + memberId + " Message: " + message['text']);
    console.log(message)
    document.getElementById("chats").insertAdjacentHTML('beforeend', `<p>${memberId + ' : ' + message['text']}</p>`);

})
// Display channel member stats
channel.on('MemberJoined', function (memberId) {

    console.log(memberId + " joined the channel")

})
// Display channel member stats
channel.on('MemberLeft', function (memberId) {

    console.log(memberId + " left the channel")

})

upLinkNetworkQuality();
downLinkNetworkQuality();

(async function remoteQuality(){
    remoteNetworkQuality();
    remoteVideo();
    remoteAudio();
    setTimeout(()=>{
        remoteQuality();
    },10000)
})();


document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('chat').addEventListener('click', chatBoxPop);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('screen-share-btn').addEventListener('click', screenShare);
document.getElementById('blur-btn').addEventListener('click', setBackgroundBlurring);
document.getElementById('color-btn').addEventListener('click', setBackgroundColor);
document.getElementById('bgimg-btn').addEventListener('click', setBackgroundImage);
document.getElementById('send').addEventListener('click', sendMssg);
