using Azure.Messaging.ServiceBus;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Notifications.Worker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IConfiguration _config;
    private ServiceBusProcessor? _processor;

    public Worker(ILogger<Worker> logger, IConfiguration configuration)
    {
        _logger = logger;
        _config = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var connectionString = _config["AzureServiceBus:ConnectionString"];
        var queueName = _config["AzureServiceBus:QueueName"];
        
        if(string.IsNullOrEmpty(connectionString))
        {
            _logger.LogWarning("AzureServiceBus:ConnectionString is not configured");
            return;
        }
        
        var client = new ServiceBusClient(connectionString);
        _processor = client.CreateProcessor(queueName, new ServiceBusProcessorOptions());
        
        _processor.ProcessMessageAsync += MessageHandler;
        _processor.ProcessErrorAsync += ErrorHandler;

        _logger.LogInformation("Starting ServiceBus Processor...");
        await _processor.StartProcessingAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
            await Task.Delay(10000, stoppingToken);
        }

        await _processor.StopProcessingAsync(stoppingToken);
        await _processor.CloseAsync(stoppingToken);
        
        _logger.LogInformation("ServiceBus Processor stopped.");
    }

    private async Task MessageHandler(ProcessMessageEventArgs args)
    {
        var body = args.Message.Body.ToString();
        _logger.LogInformation("[Notifications Worker] Received message: {body}", body);

        _logger.LogInformation("Enviando correo electrónico de confirmación de pedido al cliente {body}", body);
        await args.CompleteMessageAsync(args.Message);
    }

    private Task ErrorHandler(ProcessErrorEventArgs args)
    {
        _logger.LogError(args.Exception, $"Error procesando mensaje en Service Bus: {args.ErrorSource}");
        return Task.CompletedTask;
    }
}
