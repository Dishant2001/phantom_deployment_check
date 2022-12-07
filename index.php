<?php 

require './vendor/autoload.php';
use Yasser\Agora\RtcTokenBuilder;
use Yasser\Agora\RtmTokenBuilder;

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// echo $uri;

$uri = explode( '/', $uri );



// $appID = $APP_ID;
// $appCertificate = $APP_CERTIFICATE;

function generateToken($channelName,$user,$expTimeInHrs){
    $appID = "229f7b2123034802a9bc71c29c097fe1";
    $appCertificate = "298fff9cabd649df89736820d18d8140"; 
    $role = RtcTokenBuilder::RolePublisher;
    $expireTimeInSeconds = $expTimeInHrs*60*60;
    $currentTimestamp = time();
    $privilegeExpiredTs = $currentTimestamp + $expireTimeInSeconds;
    
    $rtcToken = RtcTokenBuilder::buildTokenWithUserAccount($appID, $appCertificate, $channelName, $user,$role, $privilegeExpiredTs);
    return $rtcToken;
}

function generateChatToken($user,$expTimeInHrs){
    $appID = "229f7b2123034802a9bc71c29c097fe1";
    $appCertificate = "298fff9cabd649df89736820d18d8140"; 
    $role = RtmTokenBuilder::RoleRtmUser;
    $expireTimeInSeconds = $expTimeInHrs*60*60;
    $currentTimestamp = time();
    $privilegeExpiredTs = $currentTimestamp + $expireTimeInSeconds;
    
    $rtmToken = RtmTokenBuilder::buildToken($appID, $appCertificate,$user,$role, $privilegeExpiredTs);
    return $rtmToken;
}

function callTokenEndpoint(){
    $json = file_get_contents('php://input');
    $data = json_decode($json,true);
    $token = generateToken($data['channelName'],$data['user'],$data['expTimeInHrs']);
    echo json_encode(array("token"=>$token));
}

function chatTokenEndpoint(){
    $json = file_get_contents('php://input');
    $data = json_decode($json,true);
    $token = generateChatToken($data['user'],$data['expTimeInHrs']);
    echo json_encode(array("token"=>$token));
}

function resourceId(){

    $json = file_get_contents('php://input');
    $data = json_decode($json,true);

    $appID = "229f7b2123034802a9bc71c29c097fe1";
    $customerKey = "caa7d97c9fce44669f294c401f363449";
    // Customer secret
    $customerSecret = "950f2d98f7bb49e1afa508335a13ed17";
    // Concatenate customer key and customer secret
    $credentials = $customerKey . ":" . $customerSecret;

    // Encode with base64
    $base64Credentials = base64_encode($credentials);
    // Create authorization header
    $arr_header = "Authorization: Basic " . $base64Credentials;

    $clientRequest = array(
        "resourceExpiredHour"=>24,
        "scene"=>0
    );

    $content = array(
        "cname"=>$data['cname'],
        "uid"=>$data['uid'],
        "clientRequest"=>$clientRequest
    );
    $content = json_encode($content);

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.agora.io/v1/apps/' . $appID . '/cloud_recording/acquire');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    // curl_setopt($ch, CURLOPT_POSTFIELDS, "{\n  \"cname\": \"Room3\",\n  \"uid\": \"12345678\",\n  \"clientRequest\":{\n  }\n}");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $content);

    $headers = array();
    // $headers[] = 'Authorization: Basic Y2FhN2Q5N2M5ZmNlNDQ2NjlmMjk0YzQwMWYzNjM0NDk6OTUwZjJkOThmN2JiNDllMWFmYTUwODMzNWExM2VkMTc=';
    $headers[] = $arr_header;
    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        echo 'Error:' . curl_error($ch);
    }
    curl_close($ch);
    echo $result;
}

function startRecording(){

    $json = file_get_contents('php://input');
    $data = json_decode($json,true);

    $rId = $data['resourceId'];

    $appID = "229f7b2123034802a9bc71c29c097fe1";
    $customerKey = "caa7d97c9fce44669f294c401f363449";
    // Customer secret
    $customerSecret = "950f2d98f7bb49e1afa508335a13ed17";
    // Concatenate customer key and customer secret
    $credentials = $customerKey . ":" . $customerSecret;

    // Encode with base64
    $base64Credentials = base64_encode($credentials);
    // Create authorization header
    $arr_header = "Authorization: Basic " . $base64Credentials;

    $token = $data['token'];

    $recordingConfig = array(
        "maxIdleTime"=> 30,
            "streamTypes"=> 2,
            "channelType"=> 0,
            "videoStreamType"=> 0,
            "transcodingConfig"=>array(
                "width"=> 960,
                "height"=> 540,
                "bitrate"=> 500,
                "fps"=> 15,
                "mixedVideoLayout"=> 1,
                "backgroundColor"=> "#000000"
            )
        );

    $recordingFileConfig = array(
        "avFileType"=>array("hls","mp4")
    );

        $storageConfig = array(
            "vendor"=> 1,
            "region"=> 1,
            "bucket"=> "phantom-aws-bucket",
            "accessKey"=> "AKIA6PGGFQGTQ33YYMYP",
            "secretKey"=> "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",
            "fileNamePrefix"=> array(
                "agora",
                "recordings"
            )
            );

    $clientRequest = array(
        "token"=>$token,
        "recordingConfig"=>$recordingConfig,
        // "extensionServiceConfig"=>$extensionServiceConfig,
        "recordingFileConfig"=>$recordingFileConfig,
        "storageConfig"=>$storageConfig
    );

    $content = array(
        "cname"=>$data['cname'],
        "uid"=>$data['uid'],
        "clientRequest"=>$clientRequest
    );
    $content = json_encode($content);

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.agora.io/v1/apps/' . $appID . '/cloud_recording/resourceid/' . $rId . '/mode/mix/start');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    // curl_setopt($ch, CURLOPT_POSTFIELDS, "{\n  \"cname\": \"Room3\",\n  \"uid\": \"12345678\",\n  \"clientRequest\":{\n  }\n}");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $content);

    $headers = array();
    // $headers[] = 'Authorization: Basic Y2FhN2Q5N2M5ZmNlNDQ2NjlmMjk0YzQwMWYzNjM0NDk6OTUwZjJkOThmN2JiNDllMWFmYTUwODMzNWExM2VkMTc=';
    $headers[] = $arr_header;
    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        echo 'Error:' . curl_error($ch);
    }
    curl_close($ch);
    echo $result;
}

function stopRecording(){

    $json = file_get_contents('php://input');
    $data = json_decode($json,true);

    $rId = $data['resourceId'];
    $sid = $data['sid'];

    $appID = "229f7b2123034802a9bc71c29c097fe1";
    $customerKey = "caa7d97c9fce44669f294c401f363449";
    // Customer secret
    $customerSecret = "950f2d98f7bb49e1afa508335a13ed17";
    // Concatenate customer key and customer secret
    $credentials = $customerKey . ":" . $customerSecret;

    // Encode with base64
    $base64Credentials = base64_encode($credentials);
    // Create authorization header
    $arr_header = "Authorization: Basic " . $base64Credentials;

    $clientRequest = new stdClass();

    $content = array(
        "cname"=>$data['cname'],
        "uid"=>$data['uid'],
        "clientRequest"=>$clientRequest
    );
    $content = json_encode($content);

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.agora.io/v1/apps/' . $appID . '/cloud_recording/resourceid/' . $rId . "//sid/" . $sid . '/mode/mix/stop');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    // curl_setopt($ch, CURLOPT_POSTFIELDS, "{\n  \"cname\": \"Room3\",\n  \"uid\": \"12345678\",\n  \"clientRequest\":{\n  }\n}");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $content);

    $headers = array();
    // $headers[] = 'Authorization: Basic Y2FhN2Q5N2M5ZmNlNDQ2NjlmMjk0YzQwMWYzNjM0NDk6OTUwZjJkOThmN2JiNDllMWFmYTUwODMzNWExM2VkMTc=';
    $headers[] = $arr_header;
    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        echo 'Error:' . curl_error($ch);
    }
    curl_close($ch);
    echo $result;
}

function apiEndpoints($endpoint){
    switch($endpoint){
        case "token":{
            callTokenEndpoint();
            break;
        }
        case "chat":{
            chatTokenEndpoint();
            break;
        }
        case "resourceid":{
            resourceId();
            break;
        }
        case "startRecording":{
            startRecording();
            break;
        }
        case "stopRecording":{
            stopRecording();
            break;
        }
    }
}


$requestMethod = $_SERVER["REQUEST_METHOD"];

switch($requestMethod){
    case "POST":{
        apiEndpoints($uri[3]);
        break;
    }
    case "GET":{
        echo "<h1>Welcome</h1>";
    }
}


?>