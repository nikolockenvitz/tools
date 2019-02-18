from tkinter import *
from random import randint as r
import os
import subprocess
import sys

class Square:
    def __init__(self, size=25, x=None, y=None, color=None):
        self.size  = size
        if(color != None): self.color = color
        else:
            self.color = '#%02X%02X%02X' % (r(0,255), r(0,255), r(0,255))
        self.x     = 0
        self.y     = 0
        self.dnd   = [] # drag'n'drop

        self.root = Tk()
        self.root.config(bg = self.color)
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)

        screenwidth  = self.root.winfo_screenwidth()
        screenheight = self.root.winfo_screenheight()
        if(x == None or y == None):
            x = r(0, screenwidth  - self.size)
            y = r(0, screenheight - self.size)
        self.setPosition(x, y)
        
        self.root.bind("<ButtonRelease-3>", self.destroyWindow)
        self.root.bind("<Button-1>",        self.buttonPressed)
        self.root.bind("<ButtonRelease-1>", self.buttonReleased)
        self.root.bind("<B1-Motion>",       self.moveWindow)
        self.root.mainloop()

    def setPosition(self, x, y):
        self.x = x
        self.y = y
        self.root.geometry("{}x{}+{}+{}".format(self.size,
                                                self.size,
                                                self.x,
                                                self.y))

    def destroyWindow(self, event):
        self.root.destroy()

    def buttonPressed(self, event):
        self.dnd = [event.x, event.y]

    def buttonReleased(self, event):
        self.dnd = []

    def moveWindow(self, event):
        if(self.dnd != []):
            self.setPosition(self.x + event.x - self.dnd[0],
                             self.y + event.y - self.dnd[1])


if __name__ == "__main__":
    #os.startfile(os.path.split(__file__)[-1])
    if(len(sys.argv) == 1):
        S = Square()
    else:
        if(sys.argv[1][0] == "-"):
            x = int(sys.argv[1][1:])
            y = int(sys.argv[2][1:])
        else:
            x = int(sys.argv[1])
            y = int(sys.argv[2])

        S = Square(25, x, y)
