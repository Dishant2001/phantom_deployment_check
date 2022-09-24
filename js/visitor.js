const startRoomBtn = document.getElementById('header-right-btn');
const liveRooms =document.getElementById('job-cat-count');
const jobCategories=document.getElementById('job-categories');
// const jobsList=document.getElementById('all-jobs');
// const totalCountSpan=document.getElementById('room-count');


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


async function getInterviewData(){
    const response = await fetch('https://mytestsite.net.in/allInterviews',{method:'POST'});
  const data = await response.json();
  console.log(data);
  var allJobs={};
  var allJobsCount={};
  var totalRooms=0;
  Object.values(data).forEach((value)=>{
    if(value['category'] in Object.keys(allJobs)){
        console.log("YES here");
        allJobs[value.category].push(value);
        allJobsCount[value.category]+=1;
    }
    else{
        console.log(value.category);
        allJobs[value.category]=new Array(value);
        allJobsCount[value.category]=1;
    }
    totalRooms+=1;
});

console.log(allJobs);

var container=h(
    "div",
    {
        class:'live-rooms-count',
        style:"background-colour:#4c67f4;color:#ffffff;border:none;outline:none;"
    },
    totalRooms+" LIVE Video Interview Rooms"
);
liveRooms.append(container);

  Object.keys(allJobsCount).forEach((jobCount)=>{
    var container2=h(
        "div",
        {
            class:'catwise-count',
        },
        jobCount+'-'+allJobsCount.jobCount
    ); 
    liveRooms.append(container2);
  });




Object.keys(allJobs).forEach((key)=>{
    var jobHeader = h(
        "div",
        {
            class:"heading"
        },
        h(
            "div",
            {
                class:"job-heading"
            },
            "Live "+key+" Jobs"
        ),
        h(
            "div",
            {
                class:"see-all"
            },
            h(
                "span",
                {

                },
                "See all  →"
            )
        )
    );

    var jobsList=h(
        "div",
        {
            class:"all-jobs",
            style:"padding-top:min(2em,3vw);display:flex;flex-direction:row;flex-wrap:wrap;width:100%;margin:auto;justify-content:flex-start;"
        }
      );
    allJobs[key].forEach((item)=>{
        var jobCont=h(
            "div",
            {
                class:"job-cards",
                style:"display:flex;flex-direction:column;margin:auto;width:40%;aspect-ratio:1;border:1px solid #485470;border-radius:5px;"
            },
            h(
                "div",
                {
                    class:"job-cont-header",
                    style:"display:flex;flex-direction:row;justify-content:space-between;"
                },
                h(
                    "div",
                    {
                        class:"job-cont-header-left",
                        style:"display:flex;margin:auto"
                    },
                    h(
                        "span",
                        {
                            style:"font-family: 'Manrope', sans-serif;font-size:min(15px,1.5vw);margin:auto;"
                        },
                        item.job
                    )
                ),
                h(
                    "div",
                    {
                        class:"job-cont-header-right",
                        style:"display:flex;margin:auto"
                    },
                    h(
                        "img",
                        {
                            src:"img/logo.png",
                            style:"height:min(15px,1.5vw);margin:auto;"
                        },
                    )
                )
            ),
            h(
                "div",
                {
                    class:"job-video",
                    style:"width:100%;aspect-ratio:16/9;"
                },
                h(
                    "video",
                    {
                        class:"job-video-cont",
                        style:"width:100%;aspect-ratio:16/9;",
                        autoplay:true,
                        muted:true,
                        playsinline:true
                    },
                    "none"
                )
            ),
            h(
                "div",
                {
                    class:"job-description"
                },
                item.details.description
            )
        );
        
        jobsList.append(jobCont);
    });
    
    jobCategories.append(jobHeader);
    jobCategories.append(jobsList)
});


}

getInterviewData();