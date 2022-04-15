wget https://github.com/ontodev/robot/releases/download/v1.8.3/robot.jar 
curl https://raw.githubusercontent.com/ontodev/robot/master/bin/robot > robot
export PATH=$PATH:$(pwd)
chmod +x ./robot
./robot help
