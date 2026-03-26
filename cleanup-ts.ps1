$files = Get-ChildItem -Path . -Filter *.d.ts -Recurse -Exclude node_modules
foreach ($file in $files) {
    if ($file.FullName -notmatch "node_modules" -and $file.Name -ne "vite-env.d.ts") {
        Write-Host "Deleting $($file.FullName)"
        Remove-Item $file.FullName -Force
    }
}
