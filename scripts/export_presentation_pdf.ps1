$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pptxPath = Join-Path $repoRoot "deliverables\Spotify_Growth_Engine_Analysis.pptx"
$pdfPath = Join-Path $repoRoot "deliverables\Spotify_Growth_Engine_Analysis.pdf"

if (-not (Test-Path -LiteralPath $pptxPath)) {
    throw "Presentation not found: $pptxPath"
}

$powerPoint = New-Object -ComObject PowerPoint.Application
try {
    $presentation = $powerPoint.Presentations.Open($pptxPath, $false, $false, $false)
    try {
        $sourceSlide = $presentation.Slides.Item($presentation.Slides.Count)
        for ($index = 0; $index -lt 6; $index++) {
            $shape = $sourceSlide.Shapes.Item("source-url-$index")
            $address = $shape.TextFrame.TextRange.Text.Trim()
            $clickAction = $shape.ActionSettings.Item(1)
            $clickAction.Action = 7
            $clickAction.Hyperlink.Address = $address
        }
        $presentation.Save()
        $presentation.SaveAs($pdfPath, 32)
    }
    finally {
        $presentation.Close()
    }
}
finally {
    $powerPoint.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) | Out-Null
}

Write-Output "Exported $pdfPath"
