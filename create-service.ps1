$config = Get-Content "$env:USERPROFILE\.railway\config.json" | ConvertFrom-Json
$token = $config.user.accessToken
$projectId = "04695ee0-53dc-4cec-93fb-a86c0db68b43"

$body = @{
    query = 'mutation serviceCreate($input: ServiceCreateInput!) { serviceCreate(input: $input) { id name } }'
    variables = @{
        input = @{
            projectId = $projectId
            name = "backend"
            source = @{
                repo = "faresosama200/rumor-detection-platform-egypt"
            }
        }
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Using token: $($token.Substring(0,10))..."
Write-Host "Sending request to Railway API..."

try {
    $response = Invoke-RestMethod -Uri "https://backboard.railway.app/graphql/v2" -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Response:"
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
