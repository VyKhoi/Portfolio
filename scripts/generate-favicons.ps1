Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $projectRoot "src\Web\frontend\public\logo.png"
$publicDir = Join-Path $projectRoot "src\Web\frontend\public"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image logo.png not found at $srcPath"
    exit 1
}

$srcImage = [System.Drawing.Image]::FromFile($srcPath)

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

# Generate 48x48, 96x96, 180x180, 192x192, 512x512
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
Write-Host "All favicons generated successfully!"
