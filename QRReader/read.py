#!/usr/bin/python
from subprocess import call
import zbar
import sys, signal
import unirest
import hashlib
import json
import time

device   = '/dev/video0'
url      = 'http://192.168.10.10'
door_url = 'http://192.168.10.10:3000'
doc_root = '/home/pi/HomeGateway/'

def play_sound(str):
	call(["aplay", doc_root + 'sound/' + str + '.wav'])

def http_get(url_query, header, param):
	
	response = None

	try:
	
		# Send HTTP Request
		response = unirest.get(url_query, headers=header, params=param)

	except: 
		
		print('Network Error in API Call')
		play_sound('network_error')


	return response

# Show preview window in X Server
preview = False
if len(sys.argv) > 1:
	preview = True

# create a Processor
proc = zbar.Processor()

# configure the Processor
proc.parse_config('enable')

# init
proc.init(device)
play_sound('init_qr')

# loop
while True:

	# enable the preview window
	if (preview):
		proc.visible = True

	# read at least one barcode (or until window closed)
	print('Waiting for QR Code...')
	proc.process_one()

	# Capture photo
	photo = http_get(door_url + '/photo/photo?event=open', {}, {})
	print('name = ' + str(photo.body['name']))

	# hide the preview window
	if (preview):
		proc.visible = False

	# extract results
	symbol = None
	for sym in proc.results:
		symbol = sym	

	print('decoded', symbol.type, 'symbol', '"%s"' % symbol.data)

	response = http_get(url + '/api/query', {}, {
		'qr_code' : symbol.data,
		'checksum': hashlib.sha1('GoodWeb' + symbol.data).hexdigest(),
		'photo_ts': str(photo.body['name']) 
 	})

	# Network Error, skip this loop
	if response == None:
		continue
   
	print('API RESP')
	print(response.body)


	if response.body['status']:

		print('Trigger Door Lock')
		play_sound('access_granted')

		# Unlock
		http_get(door_url + '/lock/unlock', {}, {})

		# wait in seconds
		time.sleep(3)
		
		# lock
		http_get(door_url + '/lock/lock', {}, {})

	else:

		print('Access Denied')
		play_sound('access_denied')

