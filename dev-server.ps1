param(
  [int]$Port = 4173,
  [string]$Root = (Get-Location).Path
)

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
$listener.Start()

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".svg" = "image/svg+xml; charset=utf-8"
}

function Write-Response {
  param(
    [System.IO.Stream]$Stream,
    [int]$Status,
    [string]$ContentType,
    [byte[]]$Body
  )

  $reason = if ($Status -eq 200) { "OK" } elseif ($Status -eq 403) { "Forbidden" } elseif ($Status -eq 404) { "Not Found" } else { "Error" }
  $header = "HTTP/1.1 $Status $reason`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  $Stream.Write($Body, 0, $Body.Length)
}

while ($true) {
  $client = $null
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    if (-not $requestLine) {
      $client.Close()
      continue
    }

    $parts = $requestLine.Split(" ")
    $path = [System.Uri]::UnescapeDataString($parts[1].Split("?")[0])
    if ($path -eq "/") { $path = "/index.html" }
    $relative = $path.TrimStart("/")
    $file = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $relative))

    if (-not $file.StartsWith([System.IO.Path]::GetFullPath($Root))) {
      Write-Response $stream 403 "text/plain" ([System.Text.Encoding]::UTF8.GetBytes("Forbidden"))
      $client.Close()
      continue
    }

    if (-not [System.IO.File]::Exists($file)) {
      Write-Response $stream 404 "text/plain" ([System.Text.Encoding]::UTF8.GetBytes("Not found"))
      $client.Close()
      continue
    }

    $ext = [System.IO.Path]::GetExtension($file)
    $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    Write-Response $stream 200 $contentType $bytes
    $client.Close()
  } catch {
    if ($client -ne $null) {
      $client.Close()
    }
  }
}
