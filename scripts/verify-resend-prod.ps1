param(
  [string]$WebhookUrl = "https://www.mipibo.com/api/webhooks/purchase",
  [string]$WebhookSecret = $env:WEBHOOK_SECRET,
  [string]$BaseEmail = "testresend2026@gmail.com",
  [switch]$CreateNewUser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($WebhookSecret)) {
  $envFile = Join-Path (Get-Location) ".env.local"
  if (Test-Path $envFile) {
    $line = (Get-Content $envFile | Where-Object { $_ -match '^WEBHOOK_SECRET=' } | Select-Object -First 1)
    if ($line) {
      $WebhookSecret = $line.Substring("WEBHOOK_SECRET=".Length)
    }
  }
}

if ([string]::IsNullOrWhiteSpace($WebhookSecret)) {
  Write-Error "Missing WEBHOOK_SECRET. Set env:WEBHOOK_SECRET or put it in .env.local."
  exit 1
}

function Get-HmacSignature {
  param(
    [string]$Secret,
    [string]$Payload
  )
  $hmac = New-Object System.Security.Cryptography.HMACSHA256
  $hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
  $hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($Payload))
  return [BitConverter]::ToString($hashBytes).Replace("-", "").ToLower()
}

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = $BaseEmail
if ($CreateNewUser -and $BaseEmail -match "^(.+)@(.+)$") {
  $email = "$($Matches[1])+$stamp@$($Matches[2])"
}

$payloadObj = [ordered]@{
  email = $email
  full_name = "Resend Verify"
  purchase_id = "resend_verify_$stamp"
  amount = 180
  currency = "USD"
  payment_provider = "manual"
}
$payload = $payloadObj | ConvertTo-Json -Compress
$sig = Get-HmacSignature -Secret $WebhookSecret -Payload $payload

$headers = @{
  "Content-Type" = "application/json"
  "x-webhook-signature" = $sig
}

Write-Host "POST $WebhookUrl"
Write-Host "email=$email create_new_user=$CreateNewUser"

try {
  $resp = Invoke-WebRequest -Method POST -Uri $WebhookUrl -Headers $headers -Body $payload
  Write-Host "Status: $($resp.StatusCode)"
  $resp.Content | Write-Host
} catch {
  $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "unknown" }
  Write-Host "Status: $status"
  Write-Host "Error: $($_.Exception.Message)"
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  exit 1
}

