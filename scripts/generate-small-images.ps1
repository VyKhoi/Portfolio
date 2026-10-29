Add-Type -AssemblyName System.Drawing

# Generates lightweight display variants for images that are rendered small in the UI.
# Source files are kept untouched (logo.png remains the single source of branding).
$projectRoot = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $projectRoot "src\Web\frontend\public"

function Save-SquarePng($srcName, $targetName, $size) {
    $src = [System.Drawing.Image]::FromFile((Join-Path $publicDir $srcName))
    # Center-crop to square so object-cover circles look identical to the original
    $side = [Math]::Min($src.Width, $src.Height)
    $sx = [int](($src.Width - $side) / 2)
    $sy = [int](($src.Height - $side) / 2)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $dest = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $g.DrawImage($src, $dest, $sx, $sy, $side, $side, [System.Drawing.GraphicsUnit]::Pixel)
    $out = Join-Path $publicDir $targetName
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $src.Dispose()
    Write-Host "Generated: $targetName ($size x $size, $((Get-Item $out).Length) bytes)"
}

Save-SquarePng "sigma-cat.png" "sigma-cat-sm.png" 128
