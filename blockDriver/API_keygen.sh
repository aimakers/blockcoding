#!/bin/sh


count=$(find /home/pi/Downloads/ -maxdepth 1 -type f -name 'clientKey.json'| wc -l)  
exist=0
echo "API Key Checking...." 

if [ $count -eq 0 ]; then 
    echo "API Key를 신규로 발급합니다. ";
          python /home/pi/blockcoding/kt_ai_makers_kit_block_coding_driver/blockDriver/load_clientkey.py > /home/pi/Downloads/clientKey.json
   echo "API Key가 발급되었습니다. 무료로 하루에 500건을 사용하실 수 있습니다. ";
   echo "/home/pi/Downloads/clientKey.json 에 저장되었습니다. ";
else 
   echo "API Key가 이미 발급 되어 있습니다. ";
fi

echo "Enter키를 누르면 종료합니다."
read choice; case "$choice" in *) exit; esac;

