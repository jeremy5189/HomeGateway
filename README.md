# HomeGateway

Raspberry Pi Home Gateway, Currently supports QR Code reader, Electro Lock and TI Sensortag

Requirement
---

### QR Reader

```
sudo apt-get install zbar-tools python-zbar
sudo pip install unirest
```

### BLE

```
sudo apt-get install libusb-dev libdbus-1-dev libglib2.0-dev libudev-dev libical-dev libreadline-dev libbluetooth-dev
mkdir bluez && cd bluez
wget www.kernel.org/pub/linux/bluetooth/bluez-5.28.tar.xz
unxz bluez-5.28.tar.xz
tar -xvf bluez-5.28.tar
cd bluez-5.28
./configure --disable-systemd
make
sudo make install
sudo apt-get install nodejs npm
sudo npm -g install npm node-gyp
```

Ref: [https://github.com/codeplanner/TI-CC2650-1](https://github.com/codeplanner/TI-CC2650-1)

Testing
---

### QR Code
```
zbarcam /dev/video0
```

### BLE Test

```
gatttool -b 78:A5:04:19:59:B9 -I
# Init Humidity Service by writing to 0x3f

```
```
[78:A5:04:19:59:B9][LE]> connect
Attempting to connect to 78:A5:04:19:59:B9
Connection successful
[78:A5:04:19:59:B9][LE]> char-write-cmd 0x3f 01
[78:A5:04:19:59:B9][LE]> char-write-cmd 0x3c 01:00
Notification handle = 0x003b value: 38 6c be 84
Notification handle = 0x003b value: 38 6c be 84
Notification handle = 0x003b value: 38 6c be 84
Notification handle = 0x003b value: 38 6c be 84
Notification handle = 0x003b value: 38 6c be 84
Notification handle = 0x003b value: 38 6c be 84
[78:A5:04:19:59:B9][LE]> char-write-cmd 0x3c 00:00
[78:A5:04:19:59:B9][LE]>
```
BLE Code Ref: [http://processors.wiki.ti.com/images/a/a8/BLE_SensorTag_GATT_Server.pdf](http://processors.wiki.ti.com/images/a/a8/BLE_SensorTag_GATT_Server.pdf)

Install
---

```
npm install
sudo npm install -g pm2
```
