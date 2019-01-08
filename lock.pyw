from tkinter import Tk
import ctypes

class Lock:
    def __init__(self):
        self.createWindow()
        self.setLockState(False)
        self.setBindings()
        
        self.root.focus()
        self.root.mainloop()

    def createWindow(self):
        self.root = Tk()
        self.root.overrideredirect(True)
        self.root.geometry("10x10+0+0")
        self.root.attributes("-topmost",True)

    def setLockState(self, state=True):
        self.lockState = state
        self.root.config(bg="green" if state == True else "yellow")

    def setBindings(self):
        self.root.bind("<Button-1>", self.activateLocking)
        self.root.bind("<Button-3>", self.exit)
        self.root.bind("<FocusOut>", self.lock)

    def activateLocking(self, event=None):
        self.setLockState(True)
        self.root.focus()

    def exit(self, event=None):
        if(self.lockState == True): return
        self.root.destroy()

    def lock(self, event=None):
        if(self.lockState == False): return
        ctypes.windll.user32.LockWorkStation()
        self.setLockState(False)

if __name__ == "__main__":
    l = Lock()
