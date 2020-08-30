import sys
import ozolib
import time
import socket
from threading import Thread

DEBUG = False
def log(s):
    if DEBUG:
        print(s)

HOST='' 
PORT=50123 
server_socket=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
    server_socket.bind((HOST,PORT))
except OSError as e:
    print(e)
    exit(1)
log("server started")

status="start"
stopflag = 0


def t1(id,f,p1):
    global status
    status = 'waiting'
    ret = f(p1)
    status  = ret    

def t2(id,f,p1,p2):
    global status
    status = 'waiting'
    ret = f(p1,p2)
    status  = ret    

def t3(id,f,p1,p2,p3):
    global status
    status = 'waiting'
    ret = f(p1,p2,p3)
    status  = ret    

def t4(id,f,p1,p2,p3,p4):
    global status
    status = 'waiting'
    ret = f(p1,p2,p3,p4)
    status  = ret
    log("T4 ended\n\r")

def tz(id,degree,count,dir=0):
    global status,stopflag
    status = 'waiting'
    stopflag = 0
    time = 300
    if dir == 0:
        speed = 1000
    else:
        speed = -1000
    for i in range(0,count):
        if stopflag==1:
            return True
        bot1.turn(degree)
        if stopflag==1:       
            return True        
        bot1.move(speed,speed,time)
        if stopflag==1:        
            return True        
        bot1.turn(-degree)
        if stopflag==1:
            return True        
        bot1.move(speed,speed,time) 
        if stopflag==1:
            return True        
    status = True

def td(id):
    global status,stopflag
    status = 'waiting'
    stopflag = 0

    bot1.flashLED(0xff,0xff,0,3)        
    bot1.play('allright1')
    if stopflag==1:         
        return True              
    bot1.turn(1080,480)        
    if stopflag==1:        
        return True      
    bot1.flashrainbow(3)
    if stopflag==1:        
        return True   
    for i in range(0,2):  
        if stopflag==1:                 
            return True                       
        bot1.zigzag(-60, 1, False)

    bot1.flashLED(0,0xff,0,3)            
    if stopflag==1:        
        return True
    bot1.turn(360)     
    if stopflag==1:          
        return True
    bot1.play('allright2') 
    if stopflag==1:           
        return True    
    bot1.rainbow()
    if stopflag==1:         
        return True  
     
    duration=200 
    speed=1500
    for j in range(0,2):               
        for i in range(0,2):
            if stopflag==1:          
                return True 
            bot1.move(speed,speed,duration)
            if stopflag==1:         
                return True            
            bot1.move(-speed,-speed,duration)
            if stopflag==1:        
                return True
            bot1.turn(30)
    if stopflag==1:         
        return True 
    bot1.play('laugh5')  
    if stopflag==1:       
        return True  
    bot1.turn(1440, 720)    
    if stopflag==1:         
        return True                                             
    bot1.play('sad1')  
    if stopflag==1:          
        return True     
    bot1.offLED() 
    status = True


while True:
    server_socket.listen(1) 
    client_socket, addr=server_socket.accept()
    log('Connected by {}'.format(addr))
    data=client_socket.recv(1024)
    if data:
        data = data.decode('utf-8').lower()
        com = data.split(' ')
        param_cnt = len(com)
        log("com:{}, count:{}".format(com,param_cnt))
        if com[0]=='maru_oconnect':
            if 'bot1' in locals():  #이미 연결된 로봇이 있으면 연결안함
                if bot1.bisconnected() is True:
                    ret = "Already Connencted"
                else:
                    del bot1
            if 'bot1' not in locals():
                ozo = ozolib.Ozo()
                if param_cnt>=2:
                    robot = ozo.find(com[1])
                else:
                    robot = ozo.find()   

                if robot is False:
                    ret = "None"
                else:
                    devices = ozo.getrobots()
                    log(robot)
                    log("Detected MAC&Names : {}".format(devices))
                    log("Selected MAC and Name : {}".format(robot))
                    bot1 = ozolib.Command(robot)
                    if bot1.bconnect() is False:
                        del bot1
                        ret = False
                    else:
                        ret = True

        elif com[0]=='maru_odisconnect':
            log("Disconnect 1")
            if 'bot1' in locals():  #연결된 로봇이 있는 경우만 disconnect
                log("Disconnect 2")                
                if bot1.isconnected() is True:
                    ret = bot1.bdisconnect()
                    log("bot1.disconnected")
                    del bot1
                else:
                    log("Disconnect 3")                     
                    del bot1
                    ret = True
            else:
                log("Disconnect 4") 
                ret = True

        elif com[0]=='maru_oisconnected':
            if 'bot1' not in locals():
                ret = False
            elif param_cnt==1:
                ret = bot1.bisconnected()
            else:
                ret =  "Incorrect Parameters"  

        elif com[0]=='maru_oreadcolor':
            if 'bot1' not in locals():
                ret = False
            elif param_cnt==2:
                ret = bot1.breadcolor(com[1])
            else:
                ret =  "Incorrect Parameters" 

        elif com[0]=='maru_oobstacle':
            ref=40 #about 3cm,  150:about 2cm
            if 'bot1' not in locals():
                ret = False
            elif param_cnt==1:
                ret = bot1.bobstacle(0,ref)                
            elif param_cnt==2:
                ret = bot1.bobstacle(int(com[1]),ref)
            else:
                ret =  "Incorrect Parameters"                 

        elif com[0]=='maru_ostop':
            if 'bot1' not in locals():
                ret = False
            elif param_cnt==1:
                ret = bot1.bstop()
            else:
                ret =  "Incorrect Parameters" 

        elif com[0]=='maru_oallstop':
            if 'bot1' not in locals():
                ret = False
            elif param_cnt==1:             
                if status=='waiting':
                    stopflag=1
                    status = True
                ret = bot1.ballstop()
            else:
                ret =  "Incorrect Parameters"                 

        elif com[0]=='maru_omove1':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==5:                              
                th_omove1=Thread(target=t4, args=(1, bot1.bmove1,int(com[1]),int(com[2]),int(com[3]),int(com[4])))
                th_omove1.start()
                ret=status                                          
            else:
                ret =  "Incorrect Parameters"    

        elif com[0]=='maru_omove2':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==4:                             
                th_omove1=Thread(target=t3, args=(2, bot1.bmove2,int(com[1]),int(com[2]),int(com[3])))
                th_omove1.start()
                ret=status
            else:
                ret =  "Incorrect Parameters"                      

        elif com[0]=='maru_omove3':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==2:                           
                th_omove3=Thread(target=t1, args=(3, bot1.bmove3,int(com[1])))
                th_omove3.start() 
                ret=status                               
            elif param_cnt==3:                           
                th_omove3=Thread(target=t2, args=(4, bot1.bmove3,int(com[1]),int(com[2])))
                th_omove3.start()                                            
                ret=status                
            else:
                ret =  "Incorrect Parameters"   

        elif com[0]=='maru_orotate1':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==3:                           
                th_orotate1=Thread(target=t2, args=(5, bot1.brotate1,int(com[1]),int(com[2])))
                th_orotate1.start()                                            
                ret=status                                            
            else:
                ret =  "Incorrect Parameters"  

        elif com[0]=='maru_orotate2':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==3:                           
                th_orotate2=Thread(target=t2, args=(6, bot1.brotate2,int(com[1]),int(com[2])))
                th_orotate2.start()                                            
                ret=status                                              
            else:
                ret =  "Incorrect Parameters"  

        elif com[0]=='maru_oturnoff':
            if 'bot1' not in locals():
                ret = False
            elif param_cnt==1:
                ret = bot1.bturnoff()
            else:
                ret =  "Incorrect Parameters" 
                                                
        elif com[0]=='maru_otopled1':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==4:   
                ret = bot1.btopled1(int(com[1]),int(com[2]),int(com[3]))                              
            else:
                ret =  "Incorrect Parameters"        

        elif com[0]=='maru_otopled2':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==1:                          
                ret = bot1.btopled2()                              
            else:
                ret =  "Incorrect Parameters"   

        elif com[0]=='maru_otopled3':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==1:                           
                ret = bot1.btopled3()                              
            else:
                ret =  "Incorrect Parameters"

        elif com[0]=='maru_otopledoff':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==1:                           
                ret = bot1.btopledoff()                              
            else:
                ret =  "Incorrect Parameters"

        elif com[0]=='maru_ofrontled1':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==5:                           
                ret = bot1.bfrontled1(int(com[1]),int(com[2]),int(com[3]),int(com[4]))                              
            else:
                ret =  "Incorrect Parameters"        

        elif com[0]=='maru_ofrontled2':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==1:                           
                ret = bot1.bfrontled2()                              
            else:
                ret =  "Incorrect Parameters"   

        elif com[0]=='maru_ofrontledoff':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==1:                           
                ret = bot1.bfrontledoff()                              
            else:
                ret =  "Incorrect Parameters"  

        elif com[0]=='maru_oemotion':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==2:                           
                ret = bot1.bemotion(str(com[1]))                              
            else:
                ret =  "Incorrect Parameters"     

        elif com[0]=='maru_odirection':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==2:                           
                ret = bot1.bdirection(str(com[1]))                              
            else:
                ret =  "Incorrect Parameters"     

        elif com[0]=='maru_onumber':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==2:                           
                ret = bot1.bnumber(str(com[1]))                              
            else:
                ret =  "Incorrect Parameters"                                                             

        elif com[0]=='maru_ocolor':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==2:                           
                ret = bot1.bcolor(str(com[1]))                              
            else:
                ret =  "Incorrect Parameters" 

        elif com[0]=='maru_ogentone1':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==3:                           
                ret = bot1.bgentone2(int(com[1]),str(com[2]))                              
            else:
                ret =  "Incorrect Parameters"    

        elif com[0]=='maru_ogentone2':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==4:                            
                th_ogentone2=Thread(target=t3, args=(7, bot1.bgentone2,int(com[1]),str(com[2]),float(com[3])))
                th_ogentone2.start()
                ret=status                                           
            else:
                ret =  "Incorrect Parameters"  

        elif com[0]=='maru_ostopsound':
            if 'bot1' not in locals():
                ret = False
            elif param_cnt==1:
                ret = bot1.bstopsound()
            else:
                ret =  "Incorrect Parameters"                                             

        elif com[0]=='maru_orestnote':
            if 'bot1' not in locals():
                ret = False
            elif param_cnt==1:
                ret = bot1.brestnote()                
            elif param_cnt==2:
                th_orestnote=Thread(target=t1, args=(8, bot1.brestnote,int(com[1])))
                th_orestnote.start() 
                ret=status                  
            else:
                ret =  "Incorrect Parameters"  

        elif com[0]=='maru_odance':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==1:                            
                th_odance=Thread(target=td, args=(9,))
                th_odance.start() 
                ret=status                                     
            else:
                ret =  "Incorrect Parameters"     

        elif com[0]=='maru_orainbow':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==1:                           
                ret = bot1.brainbow()                  
            else:
                ret =  "Incorrect Parameters"   

        elif com[0]=='maru_oflashrainbow':
            if 'bot1' not in locals():
                ret = "Not Connected"  
            elif param_cnt==1:                           
                ret = bot1.bflashrainbow()                  
            elif param_cnt==2:                           
                th_oflashrainbow=Thread(target=t1, args=(10, bot1.bflashrainbow,int(com[1])))
                th_oflashrainbow.start() 
                ret=status                                     
            else:
                ret =  "Incorrect Parameters"  

        elif com[0]=='maru_ozigzag':
            if 'bot1' not in locals():
                ret = "Not Connected"                  
            elif param_cnt==2:                           
                th_ozigzag=Thread(target=tz, args=(11,90,int(com[1])))                
                th_ozigzag.start()
                ret=status                  
            elif param_cnt==3: 
                th_ozigzag=Thread(target=tz, args=(12,90,int(com[1]),int(com[2])))
                th_ozigzag.start()
                ret=status                  
            else:
                ret =  "Incorrect Parameters"  

        elif com[0]=='maru_ocheck':
            if param_cnt==1:                           
                ret = status
            else:
                ret =  "Incorrect Parameters" 

        elif com[0]=='maru_oversion':
            if param_cnt==1:                           
                ret = ozolib.version()  
            else:
                ret =  "Incorrect Parameters"                                          

        elif com[0]=='maru_oquit' or  com[0]=='quit':
            if 'bot1' in locals():
                if bot1.isconnected() is True:
                    ret = bot1.disconnect()
                else:
                    ret = True
            else:
                ret = True
            log("Quit {}".format(ret))
        else:
            ret="Unknown command"

        log("Return:{}\n\r".format(ret))            
        client_socket.send(str(ret).encode())

    if data =='quit' or data=='maru_oquit':       
        break
    
client_socket.close()    
server_socket.close()
log("server closed")
exit(0)
