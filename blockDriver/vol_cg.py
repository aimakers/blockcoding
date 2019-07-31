#!/usr/bin/env python
#!/usr/bin/python3
# -*- coding: utf-8 -*-

# =============================================================================
# 	KT AMK Volumn Controller
# 	Made By PHJ
# 	Date: 2019.07.08
# =============================================================================

from tkinter import *
import time, os, signal, glob, subprocess, multiprocessing
from multiprocessing import Process, Queue, Lock
from subprocess import check_output

top = Tk()
top.title('KT AI MAKERS KIT Volumn Controller')

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
# Volumn Control Functions
# Volumn Control Functions
# Volumn Control Functions
# =============================================================================

def write_to_reg(vv):
	filename = '/home/pi/.genie-kit/bin/SPK-AD82011-Init.py'
	file = open(filename, 'r', encoding="utf8")
	text_str = file.read()
	file.close()

	index = text_str.find('[0x03')
	change_str = '[0x03, ' + vv + '],'
	replace_str="".join((text_str[:index], change_str, text_str[index+13:]))

	file1 = open("/home/pi/.genie-kit/bin/SPK-AD82011-Init.py", "w")#write mode 
	for line in replace_str:
		file1.write(line)
	file1.close()

def quit_fun(event):
	top.quit()

def confirm_fun(event):
	global hex_volumn
	write_to_reg(hex_volumn)
	subprocess.call(['python', 'SPK-AD82011-Init.py'], cwd='/home/pi/.genie-kit/bin')

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


def changeVolumn(ev=None):
	global volumn
	global hex_volumn
	min = 78
	max = 32
	volumn = vol_panel.get()
	adj_val = int(volumn/3)
	hex_volumn = hex(min - adj_val)
	hex_volumn = str(hex_volumn)


label = Label(top, text='AMK 단말 볼륨 조절 (0 - 100)', font = ("맑은 고딕",15), fg='red')
label.grid(row=2, column=5, columnspan=8)
vol_panel = Scale(top, from_=0, to=100, orient=HORIZONTAL, command=changeVolumn, length=250)
vol_panel.set(50)
vol_panel.grid(row=6, column=5, ipadx=50, padx=50, rowspan=5, columnspan=5)


def main():
	top.mainloop()

if __name__ == '__main__':
	main()

