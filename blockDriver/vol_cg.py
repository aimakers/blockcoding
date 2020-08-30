#!/usr/bin/env python
#!/usr/bin/python3
# -*- coding: utf-8 -*-

# =============================================================================
#	KT AMK volume Controller
#	Made By PHJ
#	Date: 2019.07.08 (Modified Version:2019.08.05)
# =============================================================================

from tkinter import *
import time, os, signal, glob, subprocess, multiprocessing, pyaudio, audioop, wave
from multiprocessing import Process, Queue, Lock
from subprocess import check_output


top = Tk()
top.title('KT AI MAKERS KIT volume Controller')

### Define volume Scale ###
VOL_LEV_1 = '0x4e'
VOL_LEV_2 = '0x3e'
VOL_LEV_3 = '0x30'
VOL_LEV_4 = '0x2e'
VOL_LEV_5 = '0x20'
###########################
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 512
###########################
hex_volume = '0x4e'



# Gets the requested values of the height and widht.
windowWidth = top.winfo_reqwidth()
windowHeight = top.winfo_reqheight()
print("Width",windowWidth,"Height",windowHeight)
 
# Gets both half the screen width/height and window width/height
positionRight = int(top.winfo_screenwidth()/2 - windowWidth/2)
positionDown = int(top.winfo_screenheight()/2 - windowHeight/2)
 
# Positions the window in the center of the page.
top.geometry("+{}+{}".format(positionRight, positionDown))

# =============================================================================
# volume Control Functions
# volume Control Functions
# volume Control Functions
# =============================================================================

def read_vol_info():
	r = open('volume_info.txt', mode='rt', encoding='utf-8')
	vv = r.readlines()
	print(vv[0])
	vol_panel.set(int(vv[0]))
	r.close()

def write_vol_info():
	global volume
	f = open('volume_info.txt', mode='wt', encoding='utf-8')
	f.write((str(volume)))
	print(volume)
	f.close()

def write_to_reg(vv):
	filename = '/home/pi/.aicodingblock/bin/SPK-AD82011-Init.py'
	file = open(filename, 'r', encoding="utf8")
	text_str = file.read()
	file.close()

	index = text_str.find('[0x03')
	change_str = '[0x03, ' + vv + '],'
	replace_str="".join((text_str[:index], change_str, text_str[index+13:]))

	file1 = open("/home/pi/.aicodingblock/bin/SPK-AD82011-Init.py", "w")#write mode 
	for line in replace_str:
		file1.write(line)
	file1.close()

def quit_fun(event):
	top.quit()

def confirm_fun(event):
	global hex_volume
	write_to_reg(hex_volume)
	subprocess.call(['python', 'SPK-AD82011-Init.py'], cwd='/home/pi/.aicodingblock/bin')
	play_file("./sample_sound.wav")
	write_vol_info()

# =============================================================================
# Create buttons
# =============================================================================
Btn3 = Button(top, width=10, height=1, text='확인', bg='yellow')
Btn4 = Button(top, width=10, height=1, text='종료', bg='red')

# =============================================================================
# Buttons layout
# =============================================================================
Btn3.grid(row=13,column=7, pady=3)
Btn4.grid(row=14,column=7)

# =============================================================================
# Bind the buttons with the corresponding callback function.
# =============================================================================

Btn3.bind('<ButtonRelease-1>', confirm_fun)
Btn4.bind('<ButtonRelease-1>', quit_fun)


def changevolume(ev=None):
	global volume
	global hex_volume
	min = 78
	max = 32
	volume = vol_panel.get()
	if volume == 1:
		hex_volume = VOL_LEV_1
	elif volume == 2:
		hex_volume = VOL_LEV_2
	elif volume == 3:
		hex_volume = VOL_LEV_3
	elif volume == 4:
		hex_volume = VOL_LEV_4
	elif volume == 5:
		hex_volume = VOL_LEV_5
	else:
		print("Out of Range...")
		hex_volume = '0x3e'

def play_file(fname):
	# create an audio object
	wf = wave.open(fname, 'rb')
	p = pyaudio.PyAudio()
	chunk = 1024

	# open stream based on the wave object which has been input.
	stream = p.open(format=p.get_format_from_width(wf.getsampwidth()),
					channels=wf.getnchannels(),
					rate=wf.getframerate(),
					output=True)

	# read data (based on the chunk size)
	data = wf.readframes(chunk)

	# play stream (looping from beginning of file to the end)
	while len(data) > 0:
		# writing to the stream is what *actually* plays the sound.
		stream.write(data)
		data = wf.readframes(chunk)

		# cleanup stuff.
	stream.close()
	p.terminate()


label = Label(top, text='AMK 단말 볼륨 조절 (1~5 단계)', font = ("맑은 고딕",15), fg='red')
label.grid(row=2, column=5, columnspan=8)
vol_panel = Scale(top, from_=1, to=5, orient=HORIZONTAL, command=changevolume, length=200)
vol_panel.set(1)
vol_panel.grid(row=6, column=5, ipadx=50, padx=50, rowspan=5, columnspan=5)
read_vol_info()


def main():
	top.mainloop()

if __name__ == '__main__':
	main()

