Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $projectRoot "src\Web\frontend\public"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$svgPath = (Resolve-Path "$publicDir\favicon.svg").Path
$tempHtml = [System.IO.Path]::GetTempFileName() + ".html"
$renderedPng = [System.IO.Path]::GetTempFileName() + ".png"

$html = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 512px; height: 512px; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  img { width: 480px; height: 480px; object-fit: contain; }
</style>
</head>
<body>
<img src="file:///$($svgPath.Replace('\', '/'))" />
</body>
</html>
"@

[System.IO.File]::WriteAllText($tempHtml, $html)

Start-Process -FilePath $chrome -ArgumentList @(
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    "--window-size=512,512",
    "--screenshot=$renderedPng",
    $tempHtml
) -Wait

Remove-Item $tempHtml -ErrorAction SilentlyContinue

$srcImage = [System.Drawing.Image]::FromFile($renderedPng)

function Save-ResizedPng($src, $targetPath, $width, $height) {
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($src, 0, 0, $width, $height)
    $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "Generated: $targetPath ($($width)x$($height))"
}

# Also update logo.png to be the purple logo
Copy-Item $renderedPng (Join-Path $publicDir "logo.png") -Force
Write-Host "Updated logo.png with purple branding!"

Save-ResizedPng $srcImage (Join-Path $publicDir "favicon-48x48.png") 48 48
Save-ResizedPng $srcImage (Join-Path $publicDir "favicon-96x96.png") 96 96
Save-ResizedPng $srcImage (Join-Path $publicDir "apple-touch-icon.png") 180 180
Save-ResizedPng $srcImage (Join-Path $publicDir "icon-192.png") 192 192
Save-ResizedPng $srcImage (Join-Path $publicDir "icon-512.png") 512 512

# Generate favicon.ico (native 48x48 icon)
$icoBmp = New-Object System.Drawing.Bitmap(48, 48)
$icoG = [System.Drawing.Graphics]::FromImage($icoBmp)
$icoG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$icoG.DrawImage($srcImage, 0, 0, 48, 48)
$hIcon = $icoBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$icoPath = Join-Path $publicDir "favicon.ico"
$fs = [System.IO.File]::Create($icoPath)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$icoG.Dispose()
$icoBmp.Dispose()
Write-Host "Generated: $icoPath (48x48 ICO)"

$srcImage.Dispose()
Remove-Item $renderedPng -ErrorAction SilentlyContinue
Write-Host "All purple favicons generated successfully!"
