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