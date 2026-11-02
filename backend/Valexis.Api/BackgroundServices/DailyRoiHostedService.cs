using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Valexis.Application.Interfaces;
using Valexis.Application.Services;

namespace Valexis.Api.BackgroundServices;

public class DailyRoiHostedService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DailyRoiHostedService> _logger;
    private DateOnly? _lastRunDate = null;

    public DailyRoiHostedService(IServiceProvider serviceProvider, ILogger<DailyRoiHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Daily ROI Scheduler Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var currentHour = DateTime.UtcNow.Hour;

                using (var scope = _serviceProvider.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                    var roiService = scope.ServiceProvider.GetRequiredService<IRoiEngineService>();

                    var settings = db.InvestmentSettings.FirstOrDefault(s => s.Category == "Crypto" && s.IsActive);
                    var targetHour = settings?.RoiExecutionHourUtc ?? 0;

                    // Execute if it has not run yet today and hour >= targetHour
                    if (_lastRunDate != today && currentHour >= targetHour)
                    {
                        _logger.LogInformation("Executing Daily ROI cycle for {Date}...", today);
                        var processed = await roiService.ProcessDailyRoiAsync(today);
                        _lastRunDate = today;
                        _logger.LogInformation("Daily ROI completed. Processed {Count} investments.", processed);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in Daily ROI Scheduler.");
            }

            // Check every 15 minutes
            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }
}
