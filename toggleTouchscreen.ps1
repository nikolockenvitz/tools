# Save this script locally
# Replace the device name (line 10) according to your touch screen name found in device manager
# Create a shortcut to this script
# Right-click on shortcut -> Properties -> Shortcut
# Insert 'powershell -f' before path in target
# Click 'Advanced...'
# Check 'Run as administrator'
# Apply and OK
# Now you can toggle touch screen status by clicking on the shortcut and allowing administrator rights
$d = Get-PnpDevice -FriendlyName "HID-compliant touch screen"
$s = $d."Status"
If ($s.Contains("OK")) {
	Write-Output "Disabling touch screen"
	$d | Disable-PnpDevice -Confirm:$false
}
Else {
	Write-Output "Enabling touch screen"
	$d | Enable-PnpDevice -Confirm:$false
}