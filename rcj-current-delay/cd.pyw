from tkinter import *

class UI:
    def __init__(self):
        self.bg = "white"
        self.fgText = "black"
        self.fgDelayed = "red"
        self.fgInTime = "black"
        self.fgAhead = "green"
        
        self.fontArena = ("Arial", "18")
        self.fontDelay = ("Arial", "64")
        
        self.root = Tk()
        self.root.title("")
        self.setPosition(0, 600)
        self.root.config(bg=self.bg)
        self.root.attributes("-alpha",0.8)

        self.frames = []
        self.labelsArena = []
        self.arenas = ["Entry 1","Entry 2","Line 1","Line 2"]
        self.labelsDelay = []
        self.delays = [0, 0, 0, 0]
        for i in range(4):
            self.frames.append(Frame(self.root, bg=self.bg))
            self.frames[-1].place(x=20+i*170, y=20, width=150, height=160)

            self.labelsArena.append(Label(self.frames[-1], text=self.arenas[i], fg=self.fgText,bg=self.bg,font=self.fontArena))
            self.labelsArena[-1].pack()

            self.labelsDelay.append(Label(self.frames[-1], bg=self.bg, font=self.fontDelay))
            self.labelsDelay[-1].pack()

        self.labelsDelay[0].bind("<Button>", lambda event: self.clicked(event, 0))
        self.labelsDelay[1].bind("<Button>", lambda event: self.clicked(event, 1))
        self.labelsDelay[2].bind("<Button>", lambda event: self.clicked(event, 2))
        self.labelsDelay[3].bind("<Button>", lambda event: self.clicked(event, 3))

        self.updateLabelsDelay()

        self.control = Frame(self.root, bg="black")
        self.control.place(x=348,y=20,width=4,height=160)
        self.dnd = False
        self.control.bind("<Button-1>",        self.buttonPressed)
        self.control.bind("<ButtonRelease-1>", self.buttonReleased)
        self.control.bind("<B1-Motion>",       self.moveWindow)
        self.control.bind("<Button-3>",        self.changeState)

        self.root.mainloop()

    def updateLabelsDelay(self):
        for i in range(4):
            self.labelsDelay[i]["text"] = ("+" if self.delays[i] > 0 else "") +str(self.delays[i])
            self.labelsDelay[i].config(fg= (self.fgDelayed if self.delays[i] > 0 else self.fgInTime if self.delays[i] == 0 else self.fgAhead))

    def clicked(self, event, arena):
        if(event.num == 1):
            self.delays[arena] += 1
        elif(event.num == 2):
            self.delays[arena] = 0
        elif(event.num == 3):
            self.delays[arena] -= 1
        self.updateLabelsDelay()

    def buttonPressed(self, event):
        self.dnd = [event.x, event.y]

    def buttonReleased(self, event):
        self.dnd = []

    def moveWindow(self, event):
        if(self.dnd != []):
            self.setPosition(self.x + event.x - self.dnd[0],
                             self.y + event.y - self.dnd[1])

    def setPosition(self, x, y):
        self.x = x
        self.y = y
        self.root.geometry("700x200+"+str(self.x)+"+"+str(self.y))

    def changeState(self, event):
        self.root.overrideredirect(not self.root.overrideredirect())
        self.root.attributes("-topmost", self.root.overrideredirect())
        

if __name__ == "__main__":
    r = UI()
