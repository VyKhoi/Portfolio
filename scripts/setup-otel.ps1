$services = @(
    "src\Services\Gateway.API\Gateway.API\Gateway.API.csproj",
    "src\Services\Identity.Service\API\Identity.Service.API\Identity.Service.API.csproj",
    "src\Services\Content.Service\API\Content.Service.API\Content.Service.API.csproj",
    "src\Services\Contact.Service\API\Contact.Service.API\Contact.Service.API.csproj",
    "src\Workers\Notification.Worker\Notification.Worker\Notification.Worker.csproj"
)

$packages = @(
    "OpenTelemetry.Extensions.Hosting",
    "OpenTelemetry.Instrumentation.AspNetCore",
    "OpenTelemetry.Instrumentation.Http",
    "OpenTelemetry.Instrumentation.Runtime",
    "OpenTelemetry.Exporter.OpenTelemetryProtocol",
    "OpenTelemetry.Exporter.Prometheus.AspNetCore"
)

foreach ($svc in $services) {
    Write-Host "Adding OpenTelemetry to $svc"
    foreach ($pkg in $packages) {
        dotnet add $svc package $pkg
    }
}
