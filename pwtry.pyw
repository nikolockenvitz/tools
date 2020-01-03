"""
This script should help to remember an important password
by trying it several times (without logging out from a
service each time).

Press Enter after typing a password to check/verify whether
it is correct.
Do a right-click after typing a password to set it and/or
overwrite an existing one.
"""

from tkinter import *
import hashlib
import random

FILENAME = "pwtry.txt"

def hashSHA512(text):
    oHash = hashlib.sha512()
    oHash.update(text.encode())
    return oHash.hexdigest()

class PasswordTry:
    def __init__(self):
        self.readPasswordHashFromFile()
        self.createWindow()

    def readPasswordHashFromFile(self):
        try:
            f = open(FILENAME)
            content = f.read().splitlines()
            f.close()
            self.salt = content[0]
            self.pwHash = content[1]
        except:
            self.salt = ""
            self.pwHash = ""
            print("Couldn't read password from file. Please set one first.")

    def writePasswordHashToFile(self):
        f = open(FILENAME, "w")
        f.write(self.salt + "\n" + self.pwHash)
        f.close()

    def createWindow(self):
        self.root = Tk()
        self.root.geometry("300x200")
        self.e1 = Entry(self.root, show="*", width=40)
        self.e1.place(x=0,y=0)
        self.e1.update()
        self.e1.place(x=(300-self.e1.winfo_width())//2,
                      y=(200-self.e1.winfo_height())//2)
        self.e1.focus()
        self.e1.bind("<Return>", self.validateInput)
        self.root.bind("<ButtonRelease-3>", self.setInputAsNewPassword)

        self.root.mainloop()

    def validateInput(self, event=None):
        pw = self.getAndClearInput()
        if(self.getHash(pw) == self.pwHash):
            self.root.config(bg="lightgreen")
        else:
            self.root.config(bg="red")
        self.e1.focus()

    def setInputAsNewPassword(self, event=None):
        pw = self.getAndClearInput()
        self.salt = self.getRandomSalt()
        self.pwHash = self.getHash(pw)
        self.writePasswordHashToFile()
        self.root.config(bg="SystemButtonFace")
        self.e1.focus()

    def getAndClearInput(self):
        result = self.e1.get()
        self.e1.delete(0, END)
        return result

    def getHash(self, password):
        return hashSHA512(password + self.salt)

    def getRandomSalt(self, length=20):
        return ''.join(chr(random.randint(32,126)) for i in range(length))

if __name__ == "__main__":
    p = PasswordTry()
