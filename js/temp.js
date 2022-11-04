import {
    joinRoom,
    attachVideoToContainer,
    leave,
    audioState,
    videoState,
    getRoomState,
    removePeer,
    subscribeToChange
} from "./100ms.js";


const form = document.getElementById("join");
  const joinBtn = document.getElementById("join-btn");
  const joinBtnGuest = document.getElementById('join-btn-guest');
  const roomName = document.getElementById('room-name');

// const conference = document.getElementById("conference");
const peersContainer = document.getElementById("hostContainer"); //container to render both host video and guestContainer
const guestContainer = document.getElementById("guestContainer"); //container to render small sized video tile in right bottom corner
const queueContainer = document.getElementById("queue"); //container to show present candidates in queue in form of bubbles with name initials
const startRoomBtn = document.getElementById('header-right-btn');
const leaveBtn = document.getElementById("leave-btn");
const confCont = document.getElementById('confirm-cont');

const announcementScreen = document.getElementById('announce-mssg');//green screen for message announcement
const announcementReview = document.getElementById('announce-next'); //green screen that comes after announcing the mssg
const queueClosedMssg = document.getElementById('queue-closed');
const cameraScreenStart = document.getElementById('camera-start'); //green screen that appears for 5 seconds when camera is switched on after a break or room is reopened



//green screens that appear for host to give candidate feedback
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

var media_recorder = null;//for accessing device camera to temporarily record 5 second video for room preview on homepage as well as for people in queue 
var camera_stream = null;
var isHostHere = false; //true when current user is the Host
var isGuesthere = false;//true when current user has joined as a Guest

var someoneInQueue = false, checkTurn = 1;

var roomSelect;

var allowInitialQueueFront = false;

var queueOpen = true; //checks status of queue obtained from server while polling
var screenOverlay = false;//checks if green screen has to be displayed or not, over the video call screen, that is the peersContainer

var isBreak = false;//checks status of break of a room obtained while polling, if true, then display the confCont container

var tooltipActive = false; //check if tool tip should be shown or is already being shown
var readyToOpenRoom = false;
var recentBreak = false; //checking if was a break taken recently or not

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
var username = '<none>'; //initialising username to <none>
var feedback_check_username = "<none>"; //for company feedback from the candidate. records details of the candidate whom we have to ask for feedback.
var queue;
var count = 1, nextcount = 1, inQueue = false;

var mssg = null;

var hostKey = undefined;
var base64String = null;
var duration = null;

var joinedIn = false;

var blobSizeMinimum = 1000000, blobSizeMaximum = -1; //just for blob max and min size testing purpose



(async function polling() {
    //checking if roomId is available to call API from server and also someone is there to join the video room
    if (roomId != null && joinedIn) {
        const response = await fetch('http://localhost/phantom/api/roomDetail', {
            method: 'post',
            headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
            body: JSON.stringify({ 'roomId': roomId, 'blobData': base64String, 'breakDuration': duration }),
        });
        const mssg_response = await response.json();
        console.log(mssg_response);


            //checking if the user is a candidate/guest, and is the candidate to be asked for company feedback
            if (!isHostHere && mssg_response['feedback'] == feedback_check_username) {
                screenOverlay = true;
                feedback_check_username = "<none>";
                username = "<none>";
                peersContainer.style.display = "none";
                feedbackCont.style.display = "flex";

                var companyRating = null;
                const feedBackText = document.getElementById('feedback-textarea');

                const star1 = document.getElementById('cstar1');
                const star2 = document.getElementById('cstar2');
                const star3 = document.getElementById('cstar3');
                const star4 = document.getElementById('cstar4');
                const star5 = document.getElementById('cstar5');

                star1.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    companyRating = star1.value;
                });
                star2.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    companyRating = star2.value;
                });
                star3.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    companyRating = star3.value;
                });
                star4.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    companyRating = star4.value;
                });
                star5.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    companyRating = star5.value;
                });

                const submitFeedbackBtn = document.getElementById('submit-feedback');
                submitFeedbackBtn.addEventListener('click', async (event) => {
                    event.stopImmediatePropagation();
                    joinedIn = false;
                    var feedbackCont2 = document.getElementById('candidate-feedback-2');
                    feedbackCont.style.display = "none";
                    feedbackCont2.style.display = "flex";
                    //sending company feedback to server
                    const response = await fetch('http://localhost/phantom/api/companyFeedback', {
                        method: 'post',
                        headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                        body: JSON.stringify({ 'roomId': roomId, 'candidate': null, 'feedback': { 'rating': companyRating, 'remarks': feedBackText.value } }),
                    });
                });
            }


            
                queueClosedMssg.style.display = "none";
                //show video tiles if screenoverlay is false
                if (!screenOverlay)
                    peersContainer.style.display = "block";

                //if breakStatus is false,and recentBreak is true, that is, break was taken and has ended now    
                if (!mssg_response['breakStatus'] && recentBreak) {
                    // peersContainer.style.display = "block";
                    screenOverlay = false;
                    breakNotice.style.display = "none";
                    recentBreak = false;
                }
                //if json from polling server says break is going on, and you are a guest/candidate in queue, display this green screen with countdown timer
                if (mssg_response['breakStatus'] && !isHostHere) {
                    peersContainer.style.display = "none";
                    screenOverlay = true;
                    breakNotice.style.display = "flex";
                    if (duration == null) {
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
                                duration = timeInSeconds / 60;
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
                //if broadcast mssg to be shown on this page was null initially, and broadcast mssg obtained with polling is not the default value "message", then change the mssg variable value
                else if (mssg == null && mssg_response['broadcastMssg'] != 'message' && !isGuesthere && !isHostHere) {
                    console.log(mssg_response['broadcastMssg']);
                    mssg = mssg_response['broadcastMssg'];

                }
                

                else {

                    //retrieve base64 string from json data obtained while polling
                    var b64 = mssg_response['blobData'];
                    var recData = '';

                    if (b64 != '' && b64 != null) {
                        //converting base64 back to video blob
                        const byteCharacters = atob(b64.replace(/^data:video\/(webm|mp4|mpeg);base64,/, ''));
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'video/webm' });
                        //creating URL of blob data
                        recData = URL.createObjectURL(blob);
                    }
                    //displaying the 5 second recorded blob video to candidate in queue or a visitor if blob link has been created
                    if (recData != '') {
                        console.log(recData);
                        if (!isHostHere && !isGuesthere) {
                            peersContainer.innerHTML = "";

                            var mssgCont = h(
                                "div",
                                {
                                    id: "announcement-mssg",
                                    style: "background-color:#F1F4FB;display: flex;padding: min(15px,1.5vw);z-index: 200;flex-direction: row;justify-content: space-evenly;border-radius: 20px;width: 50%;aspect-ratio: 20/3;margin: auto;margin-top: -20%;font-family: 'Manrope', sans-serif;font-style: normal;font-weight: 500;text-align: center;font-size: min(15px,1.5vw);"
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
                            peersContainer.append(video_rec);
                            if (mssg != undefined)
                                peersContainer.append(mssgCont);
                        }
                    }



                    //referrring to response obtained with polling by another variable
                    data = mssg_response;
                    
                    console.log("Received: ", data);
                    console.log(`Username:${username}  Queue Front:${data.queueFront}`);
                    //checking if user on the current browser tab is the first in queue
                    if (data && data.queueFront != null && data.queueFront['name'] == username) {
                        console.log('Its your turn');
                        if (count == 1)
                            // conf = confirm('Host is inviting you inside. Are you ready?');
                            confCont.style.display = "flex";
                        const confBtn = document.getElementById('confirm-btn');
                        confBtn.addEventListener('click', () => {
                            --count;
                            confCont.style.display = "none";
                            //100ms api function to tell that current user is ready to join, start access to camera to current user and call function renderPeers defined below
                            
                            subscribeToChange(renderPeers);
                        });
                    }
                    //if user on current browser tab is next in Queue, alert him/her
                    if (data && data.nextInQueue != null && data.nextInQueue['name'] == username) {
                        console.log('You are next');
                        if (nextcount == 1)
                            alert('You are next!');
                        --nextcount;
                    }

                    //displaying the current Queue
                    queueContainer.innerHTML = "";

                    if (data) {
                        queue = data.queue;
                        //randome colours for queue candidate bubbles
                        var colors = ['#36F599', '#ff3b4e', '#4c67f4', '#ffad0e', '#8f3eb5', '#faf25d'];
                        for (var i = 0; i < queue.length; ++i) {
                            //ignoring the first item in queue, that is <start>, just to ensure first candidate does'nt enter automatically, without the host calling him
                            if (queue[i]['name'] != '<start>') {

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

                    //if usert on current browser tab is a Guest or a visitor, and not a Host, then displaying various buttons below interview video tile
                    if (!isHostHere) {
                        queueBtns.style.display = "flex";
                        queueBtns2.style.display = "none";
                        const leftBtn1 = document.getElementById('left-btn1');
                        const leftBtn2 = document.getElementById('left-btn2');
                        const rightBtn = document.getElementById('right-btn');
                        rightBtn.style.backgroundColor = "#4c67f4";
                        rightBtn.style.color = "#ffffff";
                        //checking if user is in the Queue, and not in the room, that is, inQueue is true and isGuesthere is false
                        //displaying leave queue button
                        if (inQueue && !isGuesthere) {
                            leftBtn2.style.display = "none";
                            leftBtn1.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                screenOverlay = true;
                                peersContainer.style.display = "none";
                                leaveQ.style.display = "flex";
                                var yesBtn = document.getElementById('leave-yes');
                                var noBtn = document.getElementById('leave-no');
                                yesBtn.addEventListener('click', async (event) => {
                                    event.stopImmediatePropagation();
                                    // var index = data.queue.indexOf(username);
                                    var index = null;
                                    for (index = 0; index < data.queue.length; ++index) {
                                        if (data.queue[index]['name'] == username)
                                            break;
                                    }
                                    // webSocketClient.send(`<leave>/${index}/${roomSelect}`);
                                    const resp = await fetch('http://localhost/phantom/api/leave', {
                                        method: 'post',
                                        headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                                        body: JSON.stringify({ 'roomId': roomId, 'leave': index }),
                                    });
                                    //user on current browser tab is no more in the Queue, so change frontend view
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
                        //if user on current browser tab is in the room, hide all queue candidate and visitor view buttons
                        else if (isGuesthere) {
                            leftBtn1.style.display = "none";
                            rightBtn.style.display = "none";
                        }
                        else {
                            if (data.queueStatus) {
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
    //6 seconds polling
    setTimeout(() => {
        polling();
    }, 6000);

})();


//function to create a new room, calls server
startRoomBtn.addEventListener("click", async () => {

    let room = prompt("Please enter room name", null);
    if (room != null) {
        // document.getElementById("demo").innerHTML =
        // "Hello " + person + "! How are you today?";

        let host_name = prompt("Please enter Host Name", null);

        if (host_name != null) {
            const response = await fetch('http://localhost/phantom/api/room', {
                method: 'POST',
                body: JSON.stringify({ 'roomName': room, 'hostName': host_name }),
            });
            const data = await response.json();
            console.log(data);
            roomId = data['roomId'];
        }

    }

});

// Joining the room

//recording Camera on/off previous state
var recordPreviousState = 1;
//joining as host
function joinAsHost(token) {
    joinRoom(document.getElementById("name").value,token,true,false,true);
    //user on current browser tab is the host
    isHostHere = true;
    peersContainer.style.display = "none";
    cameraScreenStart.style.display = "flex";
    setTimeout(() => {
        cameraScreenStart.style.display = "none";
        peersContainer.style.display = "block";
        //starting the video of host, and calling the renderPeers function using 100ms API
        
        subscribeToChange(renderPeers);
        
    }, 5000);


    //function to record 5 second chunks of host, to show as preview
    (async function recordLoop() {
        //checking if previous camera state was on, then only record
        if (recordPreviousState == 1) {
            console.log("Starting recording again!!");
            var blobs_recorded = [];
            camera_stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1070, height: 600 } });
            media_recorder = new MediaRecorder(camera_stream, { mimeType: 'video/webm' });
            media_recorder.addEventListener('dataavailable', async function (e) {
                console.log("Recording: ", new Blob([e.data], { type: 'video/webm' }));
                blobs_recorded.push(e.data);
            });
            media_recorder.addEventListener('stop', async function () {
                let video_local = URL.createObjectURL(new Blob(blobs_recorded, { type: 'video/webm' }));
                console.log("video url: ", video_local);
                
                var myblob = new Blob(blobs_recorded, { type: 'video/webm' });

                var reader = new FileReader();
                reader.readAsDataURL(myblob);
                reader.onloadend = function () {
                    base64String = reader.result;
                }


            });
            media_recorder.start();
        }
        setTimeout(() => {
            //checking if previous camera state was on, then only stop recording, else not possible
            if (recordPreviousState == 1) {
                media_recorder.stop();
            }
            recordLoop();
        }, 5000);
    })();
}


joinBtn.addEventListener("click", (event) => {
    event.stopImmediatePropagation();
    joinedIn = true;
    console.log("Host button clicked");
    roomSelect = document.getElementById('room-name').value;
    const asHostCont = document.getElementById('as-host-key');
    asHostCont.style.display = "block";
    const hostName = document.getElementById('name').value;

    document.getElementById('host-join').addEventListener('click', async (event) => {
        event.stopImmediatePropagation();
        roomId = document.getElementById('room-key').value;
        console.log(roomId, typeof (roomId));
        //getting room details from server
        const response = await fetch("http://localhost/phantom/api/roomDetail", {
            method: 'POST',
            headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
            body: JSON.stringify({ 'roomId': roomId }),
        });
        console.log(response);
        const data = await response.json();
        console.log(data);
        //storing the room Host key
        hostKey = data['hostKey'];
        console.log(hostKey);

        //joining as a Host
        joinAsHost(hostKey);

        const response2 = await fetch("http://localhost/phantom/api/startRecording", {
            method: 'POST',
            headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
            body: JSON.stringify({ 'roomId': roomId }),
        });
        console.log(response2);

    });


});


joinBtnGuest.addEventListener('click', async (event) => {
    event.stopImmediatePropagation();
    if (username == "<none>") {
        username = document.getElementById("name").value;
        if (username != '') {

            feedback_check_username = username;

            console.log("Guest button clicked");
            document.getElementById('room-name').style.display = "block";
            const guestBtn = document.getElementById('guest-join');
            guestBtn.style.display = "block";

            const resp = await fetch('http://localhost/phantom/api/allRooms');
            const d = await resp.json();
            console.log(d);
            const dropdown = document.getElementById('room-name');
            for (let j = 0; j < d.length; ++j) {
                const allRooms = h(
                    "option",
                    {
                        "value": d[j]['roomId']
                    },
                    d[j]['roomName']
                );
                dropdown.append(allRooms);
            }

            guestBtn.addEventListener('click', async (event) => {
                event.stopImmediatePropagation();
                joinedIn = true;
                roomSelect = document.getElementById('room-name').value;
                roomId = roomSelect;
                const response = await fetch('http://localhost/phantom/api/enqueue', {
                    method: 'post',
                    headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                    body: JSON.stringify({ 'roomId': roomSelect, 'candidate': username }),
                });
                const data = await response.json();
                console.log(data);
                //candidate is in Queue now
                inQueue = true;
            });

        }
    }
    else {
        username = "<none>";
        alert("Enter name (only for testing purposes. Would be taken care in deployment by login credentials");
    }
});


var leave_count = 1;

//function to check room active status, if room is active or not
async function roomActiveStatus() {
    const response = await fetch('http://localhost/phantom/api/roomActive', {
        method: 'post',
        headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
        body: JSON.stringify({ 'roomId': roomId }),
    });
    const data = await response.json();
    console.log(data);
}

// Leaving the room
function leaveRoom() {
    if (leave_count > 0) {


        //checking if the guest who is on top of queue presses the leave button
        if (data && data.queueFront && username == data.queueFront['name']) {
            //100ms function to leave a video call room
            leave();
            joinedIn = false;
            feedback_check_username = username
            username = '<none>';
            inQueue = false;
        }
        //means host is trying to leave the room
        else {
            //check if host has asked for break, then close the room, and stop the recording
            if (isBreak) {
                leave();
                try {
                    media_recorder.stop();
                } catch (error) {
                    console.log(error);
                }
            }
            //if the host wants to close the room
            else {
                screenOverlay = true;
                peersContainer.style.display = "none";
                closeAlert1.style.display = "flex";
                const leaveYes = document.getElementById('close-yes');
                const leaveNo = document.getElementById('close-no');
                leaveYes.addEventListener('click', async (event) => {
                    event.stopImmediatePropagation();
                    
                    await roomActiveStatus();

                    const response2 = await fetch("http://localhost/phantom/api/stopRecording", {
                        method: 'POST',
                        headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                        body: JSON.stringify({ 'roomId': roomId }),
                    });
                    console.log(response2);
                    joinedIn = false;
                    leave();


                    try {
                        media_recorder.stop();
                    } catch (error) {
                        console.log(error);
                    }
                    closeAlert1.style.display = "none";
                    closeAlert2.style.display = "flex";
                    //reopening the room
                    const roomOpen = document.getElementById('room-open');
                    roomOpen.addEventListener('click', async (event) => {
                        event.stopImmediatePropagation();
                        closeAlert2.style.display = "none";
                        peersContainer.style.display = "none";
                        // joinBtn.click();
                        await roomActiveStatus();
                        joinedIn = true;
                        //joining again as host, calling the joinAsHost function and passing the host Key as parameter
                        joinAsHost(hostKey);
                        setTimeout(() => {
                            screenOverlay = false;
                        }, 1000);
                        
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


    }
    
}

//checking if host or guest closes the tab, if yes, then remove from room
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
            const audioEnabled = audioState();
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
            const videoEnabled = videoState();
            const cam_img = document.getElementById('cam-img');
            cam_img.src = videoEnabled ? "img/cam.png" : "img/cam_red.png";
            //setting recordPreviousState as per video on/off
            if (!videoEnabled) {
                recordPreviousState = 0;
            }
            else if (videoEnabled) {
                recordPreviousState = 1;
            }
            cam.setAttribute('listener', 'true');
            //calling the renderPeers function again as state of camera has changed
            renderPeers();
        });
    }


}


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

//joining as Guest
function joinAsGuest(token) {
    //100ms api to join video call
    //here token is the guest Key for the room
    joinRoom(username,token,true,false,false);
}

//this function handles all the video calling
async function renderPeers(peers) {

    tooltipActive = false;

    //checking if user in the current browser tab is at the queue front, if yes, then make him join the room
    if (data != undefined && data.queueFront != null && username == data.queueFront['name']) {
        //since this browser tab also has room details, take guestKey from json obtained by polling, and join the room as guest
        var guestToken = data.guestKey;
        joinAsGuest(guestToken);
        isGuesthere = true;
        mssg = undefined;
        console.log('joined in as Guest also!!!');
    }

    peersContainer.innerHTML = "";


    if (!peers) {
        // this allows us to make peer list an optional argument
        peers = getRoomState();
    }





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
        )
    );



    var hosts = [], guests = [];
    var countHost = 0;
    var countGuest = 0;
    var checkIfHost = false;

    peers.forEach((peer) => {
        //checking roles of all peers currently present in the video call room
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

    //if host is present in the room
    if (countHost > 0) {

        var peer = hosts[0];
        console.log(peer);
        // ele=guests[0];
        console.log(ele);
        var video;
        //if video track of host exists, that is, camera works fine
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
            attachVideoToContainer(peer,video);
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


            
            attachVideoToContainer(ele,video_guest);
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
                            await removePeer(ele,'');
                            // webSocketClient.send(`<feedback>/${ele.name}/${roomSelect}`);
                            const response = await fetch('http://localhost/phantom/api/feedback', {
                                method: 'post',
                                headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                                body: JSON.stringify({ 'roomId': roomId, 'candidate': ele.name, 'feedback': null }),
                            });
                            tooltipActive = false;


                            screenOverlay = true;
                            console.log("Screen Overlay: ", screenOverlay);
                            peersContainer.style.display = "none";
                            // peersContainer.innerHTML = "";
                            reviewPage1.style.display = "flex";

                            var candidateDecision = null;
                            var rating = null;
                            var shareDecisionWithCandidate = null;
                            const shortlist = document.getElementById('shortlist');
                            const reject = document.getElementById('reject');
                            const hold = document.getElementById('hold');
                            const later = document.getElementById('later');

                            const star1 = document.getElementById('star1');
                            const star2 = document.getElementById('star2');
                            const star3 = document.getElementById('star3');
                            const star4 = document.getElementById('star4');
                            const star5 = document.getElementById('star5');

                            const shareYes = document.getElementById('share-yes');
                            const shareNo = document.getElementById('share-no');


                            shortlist.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                candidateDecision = "shortlisted";
                            });
                            reject.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                candidateDecision = "rejected";
                            });
                            hold.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                candidateDecision = "on hold";
                            });
                            later.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                candidateDecision = "later";
                            });

                            star1.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                rating = star1.value;
                            });
                            star2.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                rating = star2.value;
                            });
                            star3.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                rating = star3.value;
                            });
                            star4.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                rating = star4.value;
                            });
                            star5.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                rating = star5.value;
                            });

                            shareYes.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                shareDecisionWithCandidate = true;
                            });
                            shareNo.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                shareDecisionWithCandidate = false;
                            });



                            var nextButton = document.getElementById('review-next');
                            nextButton.addEventListener('click', (event) => {
                                event.stopImmediatePropagation();
                                reviewPage1.style.display = "none";
                                reviewPage2.style.display = "flex";

                                var nextInterview = null;
                                var giveRecording = null;

                                const remarks = document.getElementById('remarks');
                                const giveInterview = document.getElementById('give-yes');
                                const give6months = document.getElementById('give-6-months');
                                const giveYear = document.getElementById('give-year');
                                const giveNever = document.getElementById('give-never');
                                const recordingYes = document.getElementById('recording-yes');
                                const recordingOneReplay = document.getElementById('recording-yes-one');
                                const recordingNo = document.getElementById('recording-no');

                                giveInterview.addEventListener('click', (event) => {
                                    event.stopImmediatePropagation();
                                    nextInterview = "Yes";
                                });
                                give6months.addEventListener('click', (event) => {
                                    event.stopImmediatePropagation();
                                    nextInterview = "After 6 months";
                                });
                                giveYear.addEventListener('click', (event) => {
                                    event.stopImmediatePropagation();
                                    nextInterview = "After 1 year";
                                });
                                giveNever.addEventListener('click', (event) => {
                                    event.stopImmediatePropagation();
                                    nextInterview = "No";
                                });

                                recordingYes.addEventListener('click', (event) => {
                                    event.stopImmediatePropagation();
                                    giveRecording = "Yes, unlimited replays";
                                });
                                recordingOneReplay.addEventListener('click', (event) => {
                                    event.stopImmediatePropagation();
                                    giveRecording = "Yes, one replay";
                                });
                                recordingNo.addEventListener('click', (event) => {
                                    event.stopImmediatePropagation();
                                    giveRecording = "No";
                                });

                                var submitFeed = document.getElementById('review-submit');
                                submitFeed.addEventListener('click', async (event) => {
                                    event.stopImmediatePropagation();
                                    reviewPage2.style.display = "none";
                                    screenOverlay = false;
                                    console.log("Screen Overlay: ", screenOverlay);
                                    peersContainer.style.display = "block";
                                    // peersContainer.append(peerContainer);
                                    // webSocketClient.send('pop');
                                    const feedBack = {
                                        "candidateDecision": candidateDecision,
                                        "rating": rating,
                                        "remarks": remarks.value,
                                        "shareDecision": shareDecisionWithCandidate,
                                        "nextInterview": nextInterview,
                                        "giveRecording": giveRecording
                                    }
                                    const response = await fetch('http://localhost/phantom/api/feedback', {
                                        method: 'post',
                                        headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                                        body: JSON.stringify({ 'roomId': roomId, 'candidate': ele.name, "feedback": feedBack }),
                                    });

                                    console.log("Yahan tak aa gaya!!");
                                    subscribeToChange(renderPeers);
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
                                const response = await fetch('http://localhost/phantom/api/closeQueue', {
                                    method: 'post',
                                    headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                                    body: JSON.stringify({ 'roomId': roomId }),
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
                                const response = await fetch('http://localhost/phantom/api/openQueue', {
                                    method: 'post',
                                    headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                                    body: JSON.stringify({ 'roomId': roomId }),
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

                    document.getElementById('announce').addEventListener('click', async (event) => {
                        event.stopImmediatePropagation();
                        var mssg = document.getElementById('announcement');
                        console.log(mssg.value);
                        // webSocketClient.send('broadcast/' + mssg.value+`/${roomSelect}`);
                        const response = await fetch('http://localhost/phantom/api/broadcast', {
                            method: 'post',
                            headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                            body: JSON.stringify({ 'roomId': roomId, 'message': mssg.value }),
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
                            const response = await fetch('http://localhost/phantom/api/closeQueue', {
                                method: 'post',
                                headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                                body: JSON.stringify({ 'roomId': roomId }),
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
                            const response = await fetch('http://localhost/phantom/api/openQueue', {
                                method: 'post',
                                headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                                body: JSON.stringify({ 'roomId': roomId }),
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
            addPer.addEventListener('click', async (event) => {
                event.stopImmediatePropagation();
                // webSocketClient.send(`pop/${roomSelect}`);
                const response = await fetch('http://localhost/phantom/api/dequeue', {
                    method: 'post',
                    headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                    body: JSON.stringify({ 'roomId': roomId }),
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

                document.getElementById('announce').addEventListener('click', async (event) => {
                    event.stopImmediatePropagation();
                    var mssg = document.getElementById('announcement');
                    console.log(mssg.value);
                    // webSocketClient.send('broadcast/' + mssg.value+`/${roomSelect}`);
                    const response = await fetch('http://localhost/phantom/api/broadcast', {
                        method: 'post',
                        headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                        body: JSON.stringify({ 'roomId': roomId, 'message': mssg.value }),
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
                takeBreak.addEventListener('click', async (event) => {
                    event.stopImmediatePropagation();
                    // webSocketClient.send(`/coffeeBreak/${currentVal}/${roomSelect}`);
                    const response = await fetch('http://localhost/phantom/api/breakStatus', {
                        method: 'post',
                        headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                        body: JSON.stringify({ 'roomId': roomId, 'breakDuration': currentVal }),
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
                    openRoom.addEventListener('click', async (event) => {
                        event.stopImmediatePropagation();
                        readyToOpenRoom = true;
                        tooltipActive = false;
                        countdown.innerText = "";
                        // currentVal = 0;
                        // timeInSeconds = 0;
                        coffee2.style.display = "none";
                        peersContainer.style.display = "none";
                        const response = await fetch('http://localhost/phantom/api/breakStatus', {
                            method: 'post',
                            headers: { "Content-Type": "application/json", 'Accept': 'application/json' },
                            body: JSON.stringify({ 'roomId': roomId }),
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

