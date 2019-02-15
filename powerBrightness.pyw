"""
This script should "override" Win10 behaviour in storing
two different brightness-levels: one for charging, and
one for on-battery.
"""

import wmi # pip install wmi
import ctypes
from ctypes import wintypes
import time

def getBrightness():
    return wmi.WMI(namespace='wmi').WmiMonitorBrightness()[0].CurrentBrightness

def setBrightness(brightness):
    wmi.WMI(namespace='wmi').WmiMonitorBrightnessMethods()[0].WmiSetBrightness(brightness,0)

class SYSTEM_POWER_STATUS(ctypes.Structure):
    _fields_ = [
        ('ACLineStatus', wintypes.BYTE),
        ('BatteryFlag', wintypes.BYTE),
        ('BatteryLifePercent', wintypes.BYTE),
        ('Reserved1', wintypes.BYTE),
        ('BatteryLifeTime', wintypes.DWORD),
        ('BatteryFullLifeTime', wintypes.DWORD),
    ]

def getPowerStatus():
    SYSTEM_POWER_STATUS_P = ctypes.POINTER(SYSTEM_POWER_STATUS)

    GetSystemPowerStatus = ctypes.windll.kernel32.GetSystemPowerStatus
    GetSystemPowerStatus.argtypes = [SYSTEM_POWER_STATUS_P]
    GetSystemPowerStatus.restype = wintypes.BOOL

    status = SYSTEM_POWER_STATUS()
    if not GetSystemPowerStatus(ctypes.pointer(status)):
        raise ctypes.WinError()
    return [status.ACLineStatus, status.BatteryFlag, status.BatteryLifePercent]

def isPluggedIn():
    return getPowerStatus()[0] == 1

class PB:
    def __init__(self):
        self.isCharging = isPluggedIn()
        self.brightness = getBrightness()

if __name__ == "__main__":
    status = PB()
    while(1):
        time.sleep(1)
        current = PB()
        if(status.isCharging != current.isCharging):
            if(current.isCharging):
                status.brightness = min(100, int(status.brightness * 1.1)+10)
            else:
                status.brightness = max(0, int(status.brightness * 0.8))
            status.isCharging = current.isCharging
            setBrightness(status.brightness)
        elif(status.brightness != current.brightness):
            status.brightness = current.brightness
                
