#!/bin/sh
echo 업데이트를 확인 하였습니다.테스트중..

get_latest_release_version() {
  lastVersion=`curl --silent "https://api.github.com/repos/aimakers/blockcoding/releases/latest" | # Get latest release from GitHub api
    grep '"tag_name":' |                                            # Get tag line
    sed -E 's/.*"([^"]+)".*/\1/'`                                    # Pluck JSON value
    echo $lastVersion
}

INGIT=`git rev-parse --is-inside-work-tree`

if [ $INGIT = 'true' ];then
    localVersion=`git describe --tag`
    echo Current version: $localVersion
    serverVersion=$(get_latest_release_version)
    echo Server version: $serverVersion
    if [ $localVersion != $serverVersion ];then
        str="최신 버전을 찾았습니다. 업데이트를 시작합니다."
        echo $str
        git pull
    else
        str="현재 버전이 최신 버전입니다."
        echo $str
    fi
else
    echo no inGit
fi
