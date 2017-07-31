# npm install 

if [ ! -d src/random-ps1 ]; then
  git -C src/ clone https://github.com/mprather1/random-ps1.git
fi

HOME=$HOME /usr/local/bin/node build/index.js $(pwd)