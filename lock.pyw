from tkinter import Tk
import ctypes

class Lock:
    def __init__(self):
        self.lockState = False

        self.root = Tk()
        self.root.overrideredirect(True)
        self.root.geometry("10x10+0+0")
        self.root.config(bg="yellow")
        self.root.attributes("-topmost",True)

        self.root.bind("<Button>", self.activateLocking)
        self.root.bind("<FocusOut>", self.lock)

        self.root.focus()
        self.root.mainloop()

    def lock(self, event=None):
        if(self.lockState == False): return
        self.root.destroy()
        ctypes.windll.user32.LockWorkStation()

    def activateLocking(self, event=None):
        self.lockState = True
        self.root.config(bg="green")
        self.root.focus()

if __name__ == "__main__":
    l = Lock()
