#!/bin/sh
sudo systemctl restart serial-getty@ttyUSB0.service
echo "PC 연결 준비가 완료되었습니다..."
echo "Enter키를 누르면 종료합니다."
read choice; case "$choice" in *) exit; esac;
