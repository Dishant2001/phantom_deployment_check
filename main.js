const APP_ID = "229f7b2123034802a9bc71c29c097fe1"
const TOKEN = "006229f7b2123034802a9bc71c29c097fe1IAD19E2UZIDq90Wtay9wvNbBSu8UXZllwndAmRd7d0kewAJ0vMsAAAAAIgAHbwAAZLCQYwQAAQBksJBjAwBksJBjAgBksJBjBABksJBj"
const CHANNEL = "Room3"

const customerKey = "caa7d97c9fce44669f294c401f363449";
    // Customer secret
const customerSecret = "950f2d98f7bb49e1afa508335a13ed17";
    // Concatenate customer key and customer secret
const credentials = customerKey + ":" + customerSecret;
const base64_cred = btoa(credentials);

var allUsers = new Array();



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
        await chatLogin("dishant2001", "006229f7b2123034802a9bc71c29c097fe1IACiVHwKgbqoVU4FGPevXbNbyH/C7b5Q/FTOYuY1LxDGm/Wz5I8AAAAAEAC2cgEAabOQYwEA6ANps5Bj");
    }
    else if (userId.toLowerCase().includes("deepak")) {
        await chatLogin("deepak1", "006229f7b2123034802a9bc71c29c097fe1IAD05QlbaBl/M1Uy4lMXbIJFI3e1uRwBOxilnXKVpJavRIFigx4AAAAAEAA0AwAAU7OQYwEA6ANTs5Bj");
    }
    else if (userId.toLowerCase().includes("jayshree")) {
        await chatLogin("jayshree1", "006229f7b2123034802a9bc71c29c097fe1IAD2oqxg8F21QDFMnKRlO4W0BY8sgO5ma2aqD+dBcwE7+a6Xf6gAAAAAEABlIQAAPLOQYwEA6AM8s5Bj");
    }
    else if (userId.toLowerCase().includes("rajesh")) {
        await chatLogin("rajesh1", "006229f7b2123034802a9bc71c29c097fe1IAAwrFAnMUD8gUhw14fsnD/FKJTmOAl9FKeXg2d0/0MP2MKdBFAAAAAAEABqdAEAH7OQYwEA6AMfs5Bj");
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
    allUsers.push(UID);
    console.log(allUsers);

    beepSound();

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({ optimizationMode: "detail" })


    htmlForVideo(UID);

    localTracks[1].play(`user-${UID}`)

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

    if(allUsers.indexOf(peerId)>-1)
        allUsers.push(peerId);

    console.log(allUsers);

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

    allUsers.splice(allUsers.indexOf(user.uid),1);
    console.log(allUsers);

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

    allUsers.splice(allUsers.indexOf(UID),1);
    console.log(allUsers);

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


async function getResourceId(){
    const response  = await fetch('https://api.agora.io/v1/apps/' + APP_ID + '/cloud_recording/acquire',
    {
        method:'post',
        headers: { "Content-Type": "application/json",'Authorization': 'Basic ' + base64_cred},
        body: JSON.stringify({
            'cname':CHANNEL,
            "uid":'12345678',
            'clientRequest':{}
        })
    }
    );
    const data = await response.json();
    var rId = data['resourceId'];
    return rId;
}


async function startRecording(){
    var rId = getResourceId();
    const recordingFileConfig = {
        "maxIdleTime": 30,
            "streamTypes": 2,
            "channelType": 0,
            "videoStreamType": 0,
            "subscribeVideoUids": allUsers,
            "subscribeAudioUids": allUsers,
            "subscribeUidGroup": 0
            };

        const storageConfig = {
            "vendor": 1,
            "region": 1,
            "bucket": "phantom-aws-bucket",
            "accessKey": "AKIA6PGGFQGTQ33YYMYP",
            "secretKey": "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",
            "fileNamePrefix": [
                "directory1",
                "directory2"
            ]
        };

    const clientRequest = {
        "token":TOKEN,
        // "extensionServiceConfig"=>$extensionServiceConfig,
        "recordingFileConfig":recordingFileConfig,
        "storageConfig":storageConfig
    };

    const content = {
        "cname":CHANNEL,
        "uid":"12345678",
        "clientRequest":clientRequest
    };

    const response  = await fetch('https://api.agora.io/v1/apps/' + APP_ID + '/cloud_recording/resourceid/' + rId + '/mode/individual/start',
    {
        method:'post',
        headers: { "Content-Type": "application/json",'Authorization': 'Basic ' + base64_cred},
        body: JSON.stringify(content)
    }
    );
    const data = await response.json();
    var sid = data['sid'];

    return [rId,sid];
}

async function stopRecording(RID,sid){
    const response  = await fetch('https://api.agora.io/v1/apps/' + APP_ID + '/cloud_recording/resourceid/' + RID + '/sid/' + sid + '/mode/individual/stop',
    {
        method:'post',
        headers: { "Content-Type": "application/json",'Authorization': 'Basic ' + base64_cred},
        body: JSON.stringify({
            "cname":CHANNEL,
            "uid":"12345678",
            "clientRequest":{}
        })
    }
    );
    const data = await response.json();
    console.log(data);
}

var recStatus = false;

async function handleRecording(){
    var rId,sid;
    if(!recStatus){
        document.getElementById('rec-btn').innerText = 'Stop Recording';
        var arr = await startRecording();
        rId = arr[0];
        sid = arr[1];
        recStatus = true;
    }
    else{
        document.getElementById('rec-btn').innerText = 'Start Recording';
        await stopRecording(rId,sid);
        recStatus = false;
    }
}



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
document.getElementById('rec-btn').addEventListener('click',handleRecording);
