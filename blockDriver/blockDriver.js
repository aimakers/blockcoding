const record=require('node-record-lpcm16');
const aikit=require('./aimakerskitutil');
const gpio=require('rpi-gpio');
const pIDFinder = require('find-process');
var programArg = require('commander');
//for dht11 sensor
var sensor = require('node-dht-sensor');
var PiServo = require('pi-servo');
var pin2bcm = {3:2, 5:3, 7:4, 8:14, 10:15, 11:17, 12:18, 13:27, 15:22, 16:23, 18:24, 19:10, 21:9, 22:25, 23:11, 24:8, 26:7, 29:5, 31:6, 32:12, 33:13, 35:19, 36:16, 37:26, 38:20, 40:21};
programArg.version(0.1).option("-a,--autorun","from Autorun").parse(process.argv);

if(!programArg.autorun) {
	//if not autorun kill python button_trigger_4share3.py
	var exec = require('child_process').exec;
	exec("sudo systemctl stop aimk_auto");
}else{
	console.log("disable stop python");
}


//node version check
/*
const nodeVersion=process.version.split('.')[0];
let ktkws1=null;


if(nodeVersion==='v6'){
	ktkws1=require('./ktkws');
} else if(nodeVersion==='v8') {
	ktkws1=require('./ktkws_v8');
}
*/

//for playing pcm sound
const Speaker=require('speaker');
const fs=require('fs');
var wav = require('wav');
const soundBuffer=fs.readFileSync('../data/sample_sound.wav');

var genieSpeaker = null;

const client_id='';
const client_key='';
const client_secret='';
const json_path='./key/clientKey.json';
const proto_path='../data/gigagenieRPC.proto';

const kwstext=['기가지니','지니야','친구야','자기야'];
var kwsflag = 0; //=parseInt(process.argv[2]);
const async = require('async')
/*
function initMic(){
        return record.start({
                sampleRateHertz: 16000,
                threshold: 0,
                verbose: false,
                recordProgram: 'arecord',
        })
};
*/
//ktkws1.initialize('../data/kwsmodel.pack');



//let mic=initMic();
var hasKey = false;
if (fs.existsSync(json_path)) {
    // Do something
	hasKey = true;
	aikit.initializeJson(json_path,proto_path);
}
else{
	// 브라우저에 알림 처리
	// 키파일이 등록되지 않음.
}
//aikit.initialize(client_id,client_key,client_secret,cert_path,proto_path);

//기본 GPIO 설정

gpio.setup(29,gpio.DIR_IN,gpio.EDGE_BOTH);//버튼 핀은 입력으로

gpio.on('change',function (channel,value) {
	//29번 핀에 변화가 있는 경우
	if(channel===29 && value === false){
			//console.log("Button Clicked!");
			io.sockets.emit("receiveData",{Type:"ktaimk_button_push",Data:{ret:true}});
			//return;
	}

	io.sockets.emit("receiveData",{Type:"ktaimk_gpio_data",Data:{pin:channel,value:value}});
});

let ozo_timer_id = 0;
var io = require("socket.io").listen(3001);

var exec = require('child_process').exec;
cmd = "sudo python3 ./ozo_server.py";
exec(cmd,function(error, stdout, stderr) {
});

var device_msg_list = new Array();
class Mutex {
	constructor() {
		this.lock = false; 
	} 
	async acquire() { 
		while (true) { 
			if (this.lock === false) { 
				break; 
			} // custom sleep (setTimeout) 
			await sleep(100); 
		}
		this.lock = true;
	} 
	release() { 
		this.lock = false; 
	} 
}

var dm_buffer = new Array();
let cnt = 0;
const mutex = new Mutex();

io.sockets.on('connection', function(socket) {
		console.log("connect success");
		if(hasKey == false)
		{
			socket.emit("noHasDevKey");
		}
		else {
			socket.emit("hasDevKey");
		}
		socket.on("kill",function() {
			console.log("kill driver");
			socket.emit("die");
			process.exit();
		});
		socket.on("reboot",function() {
			setTimeout(function () {
			    process.on("exit", function () {
			        require("child_process").spawn(process.argv.shift(), process.argv, {
			            cwd: process.cwd(),
			            detached : true,
			            stdio: "inherit"
			        });
			    });
			    process.exit();
			}, 1000);
		});
		socket.on('deviceCtlMsg', async function(msg){
			console.log("---------");
			console.log(msg);
			console.log("---------");
			//await mutex.acquire();
			msg_executor(socket, msg);
			//mutex.release();
			data = getUTCString()
     		console.log(data);
		})
});

var msg_type_list = ["led", "gpioMode", "gpioWrite",  "getDHT11_Temp", "getDHT11_Humidity", "setServo", "bh1750", "dmr", "dmstop", "dma", "setHumanoidMotion", "digitalWrite2", "analogRead", "connect", "disconnect", "move", "on_led", "off_led", "stop", "drive", "rainbow", "flashrainbow", "turnoff", "rotate", "zigzag", "play", "dance"]

async function msg_executor(socket, msg){
      		if(msg.type == "led")
			{
				ledType = msg.data['type'];
				duration = msg.data['duration'];
				console.log("led on")
				var exec = require('child_process').exec;
				cmd = "python ./ledDriver.py "+ledType+" "+duration;
				exec(cmd,function(error, stdout, stderr) {
				});
			}
			if(msg.type == "gpioMode")
			{
				pin = msg.data["pin"];
				mode = msg.data["mode"];

				if(mode == 1){ // INPUT
					gpio.setup(pin,gpio.DIR_IN,gpio.EDGE_BOTH);//버튼 핀은 입력으로
					console.log("set gpio input mode: pin:"+pin);
				}
				else { //OUTPUT
					gpio.setup(pin,gpio.DIR_OUT);//버튼 핀은 입력으로
					console.log("set gpio output mode: pin:"+pin);

				}
			}
			if(msg.type == "gpioWrite")
			{
				pin = msg.data["pin"];
				value = msg.data["value"];
				value = value == 1 ? true : false;
				gpio.write(pin, value, function(err) {
					if (err) {
						//retry
						gpio.setup(pin,gpio.DIR_OUT,function(){
							gpio.write(pin, value, function(err) {
				        if (err) {
									console.log("gpio write error pin:"+pin+" value:"+value);
								}
			    		});
						});
					};
				});
			}
			
			if(msg.type == "getDHT11_Temp")
			{
				var gpin = pin2bcm[msg.data["pin"]];
				sensor.read(11,gpin,function(err,temperature,humidity){
					if(!err){
						//console.log('temp: ' + temperature.toFixed(1)+'°C, ' + 'humidity: '+humidity.toFixed(1) + '%');
						socket.emit("receiveData",{Type:"ktaimk_get_dht11_temp_data",Data:{ret:true,temp:temperature.toFixed(1),pin:msg.data["pin"]}});
					}
				})
			}
			if(msg.type == "getDHT11_Humidity")
			{
				var gpin = pin2bcm[msg.data["pin"]];
				sensor.read(11,gpin,function(err,temperature,humidity){
					if(!err){
						//console.log('temp: ' + temperature.toFixed(1)+'°C, ' + 'humidity: '+humidity.toFixed(1) + '%');
						socket.emit("receiveData",{Type:"ktaimk_get_dht11_humidity_data",Data:{ret:true,humidity:humidity.toFixed(1),pin:msg.data["pin"]}});
					}
				})
			}
			if(msg.type == "setServo")
			{
				var gpin = pin2bcm[msg.data["pin"]];
				var angle = msg.data["angle"];
				var sv = new PiServo(gpin);
				console.log("pin: "+gpin+" angle: "+angle);
				sv.open().then(function(){
					sv.setDegree(angle); // 0 - 180
					socket.emit("receiveData",{Type:"ktaimk_setServo_finish",Data:{ret:true,pin:msg.data["pin"]}});
				}).catch(function(error){
					console.log(error);
				});
			}
			if(msg.type == "bh1750")
			{
				var exec = require('child_process').exec;
				cmd = "python ./bh1750.py";
				exec(cmd,function(error, stdout, stderr) {
					if(!stderr){
						socket.emit("receiveData",{Type:"ktaimk_get_bh1750_data",Data:{ret:true,data:stdout}});
					}
					else{
						socket.emit("receiveData",{Type:"ktaimk_get_bh1750_data",Data:{ret:true,data:-1}});
					}
				});
			}
			if(msg.type == "dmr")
			{
				l1 = msg.data['l1'];
				r1 = msg.data['r1'];
				l2 = msg.data['l2'];
				r2 = msg.data['r2'];

				var exec = require('child_process').exec;
				cmd = "python ./dcmotorspeed.py "+l1+" "+r1+" "+l2+" "+r2;
				exec(cmd,function(error, stdout, stderr) {

				});
			}
			if(msg.type == "dmstop")
			{
				
				var exec = require('child_process').exec;
				cmd = "python ./dcmotorstop.py";
				exec(cmd,function(error, stdout, stderr) {

				});
			}
			if(msg.type == "dma")
			{
				pin = msg.data['pin'];
				angel = msg.data['angel'];

				var exec = require('child_process').exec;
				cmd = "python ./servomotor_angle.py "+pin+" "+angel;
				exec(cmd,function(error, stdout, stderr) {

				});
			}
			if(msg.type == "setHumanoidMotion")
			{
				data = msg.data['data'];

				var exec = require('child_process').exec;
				cmd = "python ./setHumanoidMotion.py "+data;
				exec(cmd,function(error, stdout, stderr) {

				});
			}
			if(msg.type == "digitalWrite2")
			{
				port = msg.data['port'];
				data = msg.data['data'];

				var exec = require('child_process').exec;
				cmd = "python ./digitalWrite2.py "+port+" "+data;
				exec(cmd,function(error, stdout, stderr) {

				});
			}
			if(msg.type == "analogRead")
			{
				data = msg.data['data'];
				var exec = require('child_process').exec;
				cmd = "python ./analogRead.py "+data;
				exec(cmd,function(error, stdout, stderr) {
					if(!stderr){
						socket.emit("receiveData",{Type:"ktaimk_get_analogRead",Data:{ret:true,data:stdout}});
					}
					else{
						socket.emit("receiveData",{Type:"ktaimk_get_analogRead",Data:{ret:true,data:-1}});
					}
				});
			}
			//M-Ozobot

			if(msg.type == "maru_oconnect")
			{
				data = getUTCString()
    			console.log(data);
				data = msg.data['name'];
				console.log(data);
				command = 'maru_oconnect '
				cmd = "python3 ./ozocommand.py "+command+" "+data;
				result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_oconnect_wait", Data:{wait:result}});
				console.log(result);				
			}
			if(msg.type == "maru_odisconnect")
			{
				command = 'maru_odisconnect';
				cmd = "python3 ./ozocommand.py "+ command;
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_odisconnect_wait", Data:{wait:result}});
			}
			if(msg.type == "maru_oreadcolor")
			{
				//added by kt
				command = "maru_oreadcolor ";
				data = msg.data['color'];
				cmd = "python3 ./ozocommand.py "+command + data;
				ret = await execShellCommand(cmd);
				console.log("result " + ret);
				ret = ret.replace(/\n/g, "");
				console.log("maru_oreadcolor_data " + ret);
				if(ret =='True'){
					ret = true;
					console.log(ret);
				}
				else if(ret == 'False'){
					ret = false;
					console.log(ret);
				}
				socket.emit("receiveData",{Type:"maru_oreadcolor_data", Data:{color:ret}});
				socket.emit("receiveData",{Type:"maru_oreadcolor_wait", Data:{wait:true}});			
			}
			if(msg.type == "maru_oobstacle")
			{
				//added by kt
				command = "maru_oobstacle ";
				data = msg.data['pos'];
				param = data
				console.log(param);			
				cmd = "python3 ./ozocommand.py "+command+param;
				ret = await execShellCommand(cmd);
				ret = ret.replace(/\n/g, "");
				if(ret=="False"){
					ret = false;
				}
				else{
					ret = true;
				}
				console.log("maru_oobstacle_data "+ret);
				socket.emit("receiveData",{Type:"maru_oobstacle_data", Data:{obstacle:ret}});
				socket.emit("receiveData",{Type:"maru_oobstacle_wait", Data:{wait:true}});	
			}	
			if(msg.type == "maru_omove1")
			{
				command = 'maru_omove1 ';
				ldirection = msg.data['ldirection'];
				lspeed = msg.data['lspeed'];
				rdirection = msg.data['rdirection'];
				rspeed = msg.data['rspeed'];
				param = ldirection+' '+lspeed+' '+rdirection+' '+rspeed;
				console.log('move1 ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_omove1_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_omove1_wait", Data:{wait:result}});
				}
			}
			if(msg.type == "maru_omove2")
			{
				command = 'maru_omove2 ';
				direction = msg.data['direction'];
				distance = msg.data['distance'];
				speed = msg.data['speed'];
				param = direction+' '+distance+' '+speed;
				console.log('move2 ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_omove2_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_omove2_wait", Data:{wait:result}});
				}			
			}	
			if(msg.type == "maru_omove3")
			{
				command = 'maru_omove3 ';
				distance = msg.data['distance'];
				speed = msg.data['speed'];
				param = distance+' '+speed;
				console.log('move3 ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_omove3_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_omove3_wait", Data:{wait:result}});
				}							
			}	
			if(msg.type == "maru_orotate1")
			{
				command = 'maru_orotate1 ';
				direction = msg.data['direction'];
				degree = msg.data['degree'];
				param = direction+' '+degree;
				console.log('orotate1 ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_orotate1_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_orotate1_wait", Data:{wait:result}});
				}
			}
			if(msg.type == "maru_orotate2")
			{
				command = 'maru_orotate2 ';
				direction = msg.data['direction'];
				rotation = msg.data['rotation'];
				param = direction+' '+rotation;
				console.log('orotate2 ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_orotate2_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_orotate2_wait", Data:{wait:result}});
				}		
			}			
			if(msg.type == "maru_ostop")
			{
				command = "maru_ostop";
				cmd = "python3 ./ozocommand.py "+command;
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_ostop_wait", Data:{wait:result}});
			}
			if(msg.type == "maru_oturnoff")
			{
				command = "maru_oturnoff";
				cmd = "python3 ./ozocommand.py "+command;
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_oturnoff_wait", Data:{wait:result}});				
			}	
			if(msg.type == "maru_otopled1")
			{
				command = "maru_otopled1 ";
				rgb =  msg.data['rgb'];
				r = rgb[0]; g = rgb[1]; b = rgb[2];			
				param = r+' '+g+' '+b;
				console.log('otopled1 ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;				
				const result = await execShellCommand(cmd);
				console.log(result);
				socket.emit("receiveData",{Type:"maru_otopled1_wait", Data:{wait:result}});								
			}					
			if(msg.type == "maru_otopled2")
			{
				command = "maru_otopled2";
				cmd = "python3 ./ozocommand.py "+command;
				const result = await execShellCommand(cmd);
				console.log(result);
				socket.emit("receiveData",{Type:"maru_otopled2_wait", Data:{wait:result}});												
			}
			if(msg.type == "maru_otopled3")
			{
				command = "maru_otopled3";
				cmd = "python3 ./ozocommand.py "+command;
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_otopled3_wait", Data:{wait:result}});
			}				
			if(msg.type == "maru_otopledoff")
			{
				command = "maru_otopledoff";
				cmd = "python3 ./ozocommand.py "+command;
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_otopledoff_wait", Data:{wait:result}});				
			}
			if(msg.type == "maru_ofrontled1")
			{
				//added by kt
				command = "maru_ofrontled1 ";

				pos = msg.data['pos'];
				led1 = msg.data['led1'];
				led2 = msg.data['led2'];
				led3 = msg.data['led3'];
				led4 = msg.data['led4'];
				led5 = msg.data['led5'];
				//console.log(pos + ' ' + led1 + led2 + led3 + led4 + led5+ "/");
				//pos = 0		//추가 구현 필요
				var total_led_info = [led1, led2, led3, led4, led5];
				if (pos == 0){
					i=0;
					r = total_led_info[i][0];
					g = total_led_info[i][1];
					b = total_led_info[i][2];

					param = r+' '+g+' '+b+' '+ '1';
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);

					r = total_led_info[i+1][0];
					g = total_led_info[i+1][1];
					b = total_led_info[i+1][2];
					param = r+' '+g+' '+b+' '+ 2;
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);
					
					r = total_led_info[i+2][0];
					g = total_led_info[i+2][1];
					b = total_led_info[i+2][2];
					param = r+' '+g+' '+b+' '+ 3;
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);	

					r = total_led_info[i+3][0];
					g = total_led_info[i+3][1];
					b = total_led_info[i+3][2];
					param = r+' '+g+' '+b+' '+ 4;
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);
					
					r = total_led_info[i+4][0];
					g = total_led_info[i+4][1];
					b = total_led_info[i+4][2];
					param = r+' '+g+' '+b+' '+ 5;
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);										
				}
				else if(pos == 1){
					r = total_led_info[0][0];
					g = total_led_info[0][1];
					b = total_led_info[0][2];
					param = r+' '+g+' '+b+' '+ 1;
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);
				}
				else if(pos == 2){
					r = total_led_info[1][0];
					g = total_led_info[1][1];
					b = total_led_info[1][2];
					param = r+' '+g+' '+b+' '+ 2; 
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);
				}
				else if(pos == 3){
					r = total_led_info[2][0];
					g = total_led_info[2][1];
					b = total_led_info[2][2];
					param = r+' '+g+' '+b+' '+ 3;
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);
				}
				else if(pos == 4){
					r = total_led_info[3][0];
					g = total_led_info[3][1];
					b = total_led_info[3][2];
					param = r+' '+g+' '+b+' '+ 4;
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);
				}
				else if(pos == 5){
					r = total_led_info[4][0];
					g = total_led_info[4][1];
					b = total_led_info[4][2];
					param = r+' '+g+' '+b+' '+ 5;
					console.log('ofrontled1 ' + param);
					cmd = "python3 ./ozocommand.py "+command+param;				
					result = await execShellCommand(cmd);
				}
				socket.emit("receiveData",{Type:"maru_ofrontled1_wait", Data:{wait:result}});				
			}	
			if(msg.type == "maru_ofrontled2")
			{
				command = "maru_ofrontled2";
				cmd = "python3 ./ozocommand.py "+command;				
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_ofrontled2_wait", Data:{wait:result}});								
			}	
			if(msg.type == "maru_ofrontledoff")
			{
				command = "maru_ofrontledoff";
				cmd = "python3 ./ozocommand.py "+command;				
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_ofrontledoff_wait", Data:{wait:result}});					
			}	
			if(msg.type == "maru_oemotion")
			{
				var sound_list = ['happy1', 'happy2', 'happy3', 'happy4', 'happy5', 'allright1', 'allright2', 'sad1', 'sad2', 'sad3', 'sad4','surprised1', 'surprised2', 'surprised3', 'surprised4', 'surprised5', 'laugh1', 'laugh2', 'laugh3', 'laugh4', 'laugh5', 'laugh6'];
				data = msg.data['sound'];
				var result = null;
				console.log(data);
				command = 'maru_oemotion '
				for  (var i= 0; i < sound_list.length; i++)
				{
					if(data == sound_list[i]){
						console.log("oemotion " + data)
						cmd = "python3 ./ozocommand.py "+command + data;
						result = await execShellCommand(cmd);
					}
				}
				socket.emit("receiveData",{Type:"maru_oemotion_wait", Data:{wait:result}});					
			}	
			if(msg.type == "maru_odirection")
			{
				var sound_list = ['forward','left','right','back'];
				var result = null;
				data = msg.data['sound'];
				console.log(data);
				command = 'maru_odirection '
				for  (var i= 0; i < sound_list.length; i++)
				{
					if(data == sound_list[i]){
						console.log("odirection " + data)
						cmd = "python3 ./ozocommand.py "+command + data;
						result = await execShellCommand(cmd);
					}
				}
				socket.emit("receiveData",{Type:"maru_odirection_wait", Data:{wait:result}});					
			}					
			if(msg.type == "maru_onumber")
			{
				var sound_list = ['0','1','2','3','4','5','6','7','8','9','10'];
				var result = null;
				data = msg.data['sound'];
				console.log(data);
				command = 'maru_onumber '
				for  (var i= 0; i < sound_list.length; i++)
				{
					if(data == sound_list[i]){
						console.log("onumber " + data)
						cmd = "python3 ./ozocommand.py "+command + data;
						result = await execShellCommand(cmd);
					}
				}
				socket.emit("receiveData",{Type:"maru_onumber_wait", Data:{wait:result}});					
			}			
			if(msg.type == "maru_ocolor")
			{
				var sound_list = ['red','green','yellow','blue','cyan','white','black'];
				var result = null;
				data = msg.data['sound'];
				console.log(data);
				command = 'maru_ocolor '
				for  (var i= 0; i < sound_list.length; i++)
				{
					if(data == sound_list[i]){
						console.log("ocolor " + data)
						cmd = "python3 ./ozocommand.py "+command + data;
						result = await execShellCommand(cmd);
					}
				}
				socket.emit("receiveData",{Type:"maru_ocolor_wait", Data:{wait:result}});	
			}	
			if(msg.type == "maru_ogentone1")
			{
				command = 'maru_ogentone1 ';
				octno = msg.data['octno'];
				tone = msg.data['tone'];
				param = octno+' '+tone;
				console.log('ogentone1 ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_ogentone1_wait", Data:{wait:result}});					
			}
			if(msg.type == "maru_ogentone2")
			{
				command = 'maru_ogentone2 ';
				octno = msg.data['octno'];
				tone = msg.data['tone'];
				duration = msg.data['duration'];				
				param = octno+' '+tone+' '+duration;
				console.log('ogentone2 ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_ogentone2_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_ogentone2_wait", Data:{wait:result}});
				}						
			}
			if(msg.type == "maru_orestnote")
			{
				command = 'maru_orestnote ';
				duration = msg.data['duration'];				
				param = duration;
				console.log('orestnote ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_orestnote_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_orestnote_wait", Data:{wait:result}});
				}
			}			
			if(msg.type == "maru_ostopsound")
			{
				command = "maru_ostopsound";
				cmd = "python3 ./ozocommand.py "+command;				
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_ostopsound_wait", Data:{wait:result}});				
			}	
			if(msg.type == "maru_odance")
			{
				command = "maru_odance";
				cmd = "python3 ./ozocommand.py "+command;				
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_odance_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_odance_wait", Data:{wait:result}});
				}				
				//socket.emit("receiveData",{Type:"maru_odance_wait", Data:{wait:result}});								
			}	
			if(msg.type == "maru_orainbow")
			{
				command = "maru_orainbow";
				cmd = "python3 ./ozocommand.py "+command;				
				const result = await execShellCommand(cmd);
				socket.emit("receiveData",{Type:"maru_orainbow_wait", Data:{wait:result}});				
			}				
			if(msg.type == "maru_oflashrainbow")
			{
				command = 'maru_oflashrainbow ';
				count = msg.data['count'];				
				//param = duration;
				//console.log('oflashrainbow ' + param);
				cmd = "python3 ./ozocommand.py "+ command + count;				
				//cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_oflashrainbow_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_oflashrainbow_wait", Data:{wait:result}});
				}				
			}	
			if(msg.type == "maru_ozigzag")
			{
				command = 'maru_ozigzag ';
				//degree = msg.data['degree'];
				count = msg.data['count'];
				direct = msg.data['direct'];				
				param = count+' '+direct;
				console.log('ozigzag ' + param);
				cmd = "python3 ./ozocommand.py "+command+param;
				result = await execShellCommand(cmd);
				result = result.replace(/\n/g, "");
				console.log('result ' + result);				
				if(result == "waiting"){
					console.log("Result waiting...");
					ozo_timer_id = setInterval(function(){
						maruo_waiting_status_check(socket, "maru_ozigzag_wait")
					}, 1000 );
				}
				else{
					socket.emit("receiveData",{Type:"maru_ozigzag_wait", Data:{wait:result}});
				}				
			}
			if(msg.type == "maru_oallstop"){
				console.log('maru_oallstop');
				cmd = "python3 ./ozocommand.py "+ "maru_oallstop";
				const result = await execShellCommand(cmd);
				if(ozo_timer_id != null) {
					console.log("All Stop Ozobot Waiting Loop...")
		        	clearInterval(ozo_timer_id);
		        	ozo_timer_id =null;
		    	}		
			}
};

 const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, 2000);
  });
}

let mode=0;//0:idle 1:kws, 2:stt, 3:DSS(QueryVoice)
let ktstt=null;
let ktqbv=null; // DSS (queryByVoice)
/*
mic.on('data',(data)=>{
	if(mode===1){
		result = 0;
		result=ktkws1.pushBuffer(data);
		//result=ktkws2.pushBuffer(data);
		if(result===1) {
			console.log("KWS Detected");
			//pcmplay.write(soundBuffer);
			io.sockets.emit("receiveData",{Type:"ktaimk_kws_detect",Data:{kwsFlag:kwsflag,ret:true}});
			mode = 0;
			//setTimeout(startStt,1000);
		}

	} else if(mode === 2) {
    ktstt.write({audioContent:data});
	} else if(mode === 3) {
		ktqbv.write({audioContent:data});
	}
});
*/

function maruo_waiting_status_check(socket, ret_msg_str){
	const { exec } = require('child_process');
	const py = exec('python3 ./ozocommand.py maru_ocheck', (error, stdout, stderr) => {
	  if (error || stderr) {
	    // Handle error.
	  } else {
	  	ret = stdout;
	    //console.log(stdout);
	    console.log("time_id" + ozo_timer_id);
	    result = ret.replace(/\n/g, "");
	    console.log(result); 
	    console.log();
		if(result == 'True' || result =='False'){
				if(ozo_timer_id != null) {
		        	clearInterval(ozo_timer_id);
		        	ozo_timer_id =null;
		        	console.log("clear timer");
		        	socket.emit("receiveData",{Type:ret_msg_str, Data:{wait:result}});
		    	}
		}
		else if(result =='waiting'){
			console.log("Still waiting.....");
		}
	  }
	})
}

function getUTCString(){
	return new Date().toISOString();
}

function execShellCommand(cmd) {
 const exec = require('child_process').exec;
 return new Promise((resolve, reject) => {
 	exec(cmd, (error, stdout, stderr) => {
   	if (error) {
    	console.warn(error);
   	}
   	resolve(stdout? stdout : stderr);
  	});
 	});
}

function playWav(wavData,cb = null){
	var wavReader = new wav.Reader();
	if(genieSpeaker != null)
	{
		//genieSpeaker.close();
	}
	// the "format" event gets emitted at the end of the WAVE header
	wavReader.on('format', function (format) {
		// the WAVE header is stripped from the output of the reader
		genieSpeaker = new Speaker(format);

		genieSpeaker.on("flush",function(){
			if(cb != null)
			{
				cb();
			}
		});
		wavReader.pipe(genieSpeaker);

	});
	wavReader.write(wavData,function(){
		wavReader.end();
	});

}

function startStt(){
	ktstt=aikit.getVoice2Text();
	var stt_data = null;
	ktstt.on('error',(error)=>{
		console.log('Error:'+error);
		io.sockets.emit("receiveData",{Type:"ktaimk_stt_detect",Data:""});
	});
	ktstt.on('data',(data)=>{
		console.log('stt result:'+JSON.stringify(data));
		stt_data = data;
		if(data.resultCd!==200) mode=2;
		if(data.resultCd == 509 ){
			console.log('resOptions resultCd == 509 License limit exceeded');
			io.sockets.emit("receiveData",{Type:"ktaimk_stt_detect",Data:""});
			io.sockets.emit("receiveData",{Type:"ktaimk_license_limit",Data:""});
			return;
		}
	});
	ktstt.on('end',()=>{
        console.log('stt text stream end');
        if(stt_data == null)
        {
            stt_data = "";
		}
		if(stt_data.resultCd == 509 ){
			mode=0;
			return;
		}
		io.sockets.emit("receiveData",{Type:"ktaimk_stt_detect",Data:stt_data});
		mode=0;
	});
	ktstt.write({reqOptions:{mode:0,lang:0}});
	mode=2;
};

function startText2Voice(str,isDSS = false){
	var kttts=aikit.getText2VoiceStream({text:str,lang:0,mode:0});
	kttts.on('error',(error)=>{
		console.log('Error:'+error);
		io.sockets.emit("receiveData",{Type:"ktaimk_tts_finished",Data:str});
	});
	kttts.on('data',(data)=>{
        if(data.streamingResponse==='resOptions' && data.resOptions.resultCd===200) console.log('Stream send. format:'+data.resOptions.format);
        if(data.streamingResponse==='audioContent') {
					//pcmplay.write(data.audioContent);
					playWav(data.audioContent,function(){
						console.log("wav play finish");
						if(isDSS === false)
						{
							io.sockets.emit("receiveData",{Type:"ktaimk_tts_finished",Data:str});
						} else {
							io.sockets.emit("receiveData",{Type:"ktaimk_dss_finished",Data:str});
						}
					});
			}
			else{
				console.log('msg received:'+JSON.stringify(data));
				if(data["resOptions"]["resultCd"] == 500 ){
					console.log('resOptions resultCd == 500 ');
					if(isDSS === false)
					{
						io.sockets.emit("receiveData",{Type:"ktaimk_tts_finished",Data:str});
					} else {
						io.sockets.emit("receiveData",{Type:"ktaimk_dss_finished",Data:str});
					}
				}
				if(data["resOptions"]["resultCd"] == 509 ){
					console.log('resOptions resultCd == 509 License limit exceeded');
					if(isDSS === false)
					{
						io.sockets.emit("receiveData",{Type:"ktaimk_license_limit",Data:""});
						io.sockets.emit("receiveData",{Type:"ktaimk_tts_finished",Data:str});
					} else {
						io.sockets.emit("receiveData",{Type:"ktaimk_license_limit",Data:""});
						io.sockets.emit("receiveData",{Type:"ktaimk_dss_finished",Data:str});
					}

				}
			}
	});
	kttts.on('end',()=>{
		console.log('tts end');
	});
}

function startQueryVoice(){
	ktqbv = aikit.queryByVoice( function(err,msg){
		mode=0; // mic idle mode;
		if(err){
			console.log(JSON.stringify(err));
			io.sockets.emit("receiveData",{Type:"ktaimk_dss_finished",Data:str});

		} else {
			console.log("QueryVoice Msg:"+JSON.stringify(msg));
			const action = msg.action[0];
			const uword = msg.uword;
			if(msg.resultCd == 509 ){
				console.log('resOptions resultCd == 509 License limit exceeded');
				io.sockets.emit("receiveData",{Type:"ktaimk_dss_finished",Data:""});
				io.sockets.emit("receiveData",{Type:"ktaimk_license_limit",Data:""});
				return;
			
			}
			if(action)
			{
				let reqMsgStr = action.mesg;
				//reqMsgStr = striptags(reqMsgStr);
				reqMsgStr = reqMsgStr.replace("<![CDATA[",'');
				reqMsgStr = reqMsgStr.replace(/<[^>]*>/g, '');
				reqMsgStr = reqMsgStr.replace(/\]/gi, '');
				reqMsgStr = reqMsgStr.replace(/\[/gi, '');
				reqMsgStr = reqMsgStr.replace(/\>/gi, '');
				reqMsgStr = reqMsgStr.replace(/\</gi, '');
				console.log(reqMsgStr);
				io.sockets.emit("receiveData",{Type:"ktaimk_stt_detect",Data:uword});
				startText2Voice(reqMsgStr,true);
			}
			else {
				io.sockets.emit("receiveData",{Type:"ktaimk_dss_finished",Data:""});
			}
		}

	});
	//init
	ktqbv.write({reqOptions:{lang:0,userSession:'12345',deviceId:'D06190914TP808IQKtzq'}});
	console.log("Start DSS");
	mode=3;
}

//for devkey
var uploadDir = __dirname+"/key/";
var multer = require('multer');
var upload = multer({
    dest: uploadDir
});

//make dir
fs.mkdir(uploadDir, function() {});

var cors = require('cors');
var http = require('http');
var express = require('express');
var app = express();

// CORS 설정
app.use(cors());

http.createServer(app).listen(3002,function(){
    console.log("http server start");
});

app.post('/upload', upload.single('file'), function(req, res, next) {
	fs.rename(uploadDir + req.file.filename, uploadDir + 'clientKey.json', function() {
			io.sockets.emit('update_complete', "");
			//aikit.initializeJson(json_path,cert_path,proto_path);
    });
})

app.get("/test",function(req,res){
	res.status(200).send("express test");
});
