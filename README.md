# tools
This is a collection of short scripts which may do not deserve an own repository.
Some of them are just for fun, but some of them are really useful.

Currently this repository includes following files and folders:
- colorsquare

  This folder contains a funny script to create multiple colored squares on your screen.
  You can move them around with drag and drop and even destroy them.
  The script is optimized to start multiple processes so that it is hard to kill them with task manager.
  There is also a script to kill all processes, but you may have to run it several times to get all processes.

- counter

  This is a simple counter.
  Availble on https://nikolockenvitz.de/counter.
  Can be controlled by the buttons or by keyboard (-/+ and arrows).

- decisionmatrix

  Webpage to create decision matrices.
  It's available on https://nikolockenvitz.de/decisionmatrix but you can also run it locally or host it yourself.
  You can change, add and delete alternatives and criterias and also move them with drag'n'drop.
  The matrix is auto-saved in local storage, but you can also download it as CSV.

- matrix

  Matrix like animation based on https://github.com/parambirs/matrix.
  Just minor changes, should be used in fullscreen.
  Available on https://nikolockenvitz.de/matrix.

- mocking

  Website to change the case of a text for the [Mocking SpongeBob meme](https://imgflip.com/memegenerator/Mocking-Spongebob).
  Available on https://nikolockenvitz.de/meme.
  (The script tries to have as much lowercase `i`'s and uppercase `L`'s as possible.)

- rcj-current-delay

  For the RoboCup Junior Rescue competition I wanted to show the participants how long the current delay is at each competition field.
  It supports four fields, you can increase, decrease and reset each delay.
  The window can also be controlled by the black bar in the middle.
  You can change the appearance so that you won't see title/close button/etc. of the window (toggle status with right click on black bar).
  The window can be moved with drag and drop (black bar) and supports "locking" (Ctrl+L, see lock.pyw).

- troll

  Whenever someone forgets to lock his/her computer you are supposed to do something funny and memorable so that he/she learns to lock the computer when going away.
  This site is available on https://nikolockenvitz.de/troll and has links to some cool sites.
  It's recommended to switch to fullscreen and then select one of the offered sites.

- lock.pyw

  This script is for some situations where you don't want to lock you pc, cause you want so show a picture, video, ...
  But of course due to security issues not locking your pc is not an option if you are not near you pc.
  This script helps that nothing else is done on your pc while you are away.
  This is done by locking your pc automatically when the focus moves to another program (e.g. someone opens your file explorer).

- pse.py

  Did you ever tried to write your name or a word with chemical element symbols?
  This script runs in command line and checks whether a given word can be represented with element symbols.
  If it is possible all possibilities are listed.
  In general this script checks whether a word can be represented with a list of syllables.

- pwtry.pyw

  Strong passwords are hard to remember - and you can not store all passwords in a password manager.
  The easiest way to remember them is to type them several times (repeat, repeat, repeat).
  But you don't want to log out and sign in again and again, you also don't want to lock your pc and risk to be logged out forever.
  This script offers you the possibility to practice your password multiple times.
  The password is hashed (SHA512) with a salt and stored in a file.
  I am not sure how secure this script is in respect of internal memory.

- toggleTouchscreen.ps1

  This powershell script toggles the status of the touchscreen (enabling/disabling it).
  Find setup instructions in the file.
