$ErrorActionPreference = 'Stop'

Write-Host "Seeding Contact Messages..."
$contactBody = @{ name="Khoi DEV"; email="test@khoi.dev"; subject="Freelance"; message="Hello! I want to hire you." } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/contact/messages" -Method Post -Body $contactBody -ContentType "application/json"

$contactBody2 = @{ name="Alice"; email="alice@test.com"; subject="Job"; message="Are you available for work?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/contact/messages" -Method Post -Body $contactBody2 -ContentType "application/json"

Write-Host "Seeding Content Projects..."
$projectBody = @{ 
    title="Microservices Portfolio"
    slug="microservices-portfolio"
    summary="A scalable portfolio system"
    descriptionMdx="Built with .NET 9, React, Kafka, Postgres, and Redis."
    techStack="['C#', '.NET 9', 'React', 'Kafka']"
    order=1
    isFeatured=$true
    status="Published"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/content/projects" -Method Post -Body $projectBody -ContentType "application/json"

$projectBody2 = @{ 
    title="SaaS Analytics Platform"
    slug="saas-analytics"
    summary="Real-time analytics for SaaS"
    descriptionMdx="High performance analytics."
    techStack="['React', 'Go', 'ClickHouse']"
    order=2
    isFeatured=$true
    status="Published"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/content/projects" -Method Post -Body $projectBody2 -ContentType "application/json"

Write-Host "Seeding Complete!"
