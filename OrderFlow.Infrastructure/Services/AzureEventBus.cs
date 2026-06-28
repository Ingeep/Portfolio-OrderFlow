using Azure.Messaging.ServiceBus;
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using OrderFlow.Application.Common.Interfaces;

namespace OrderFlow.Infrastructure.Services;

public class AzureEventBus : IEventBus
{
    private readonly IConfiguration _config;

    public AzureEventBus(IConfiguration config)
    {
        _config = config;
    }

    public async Task PublishAsync<T>(T @event, CancellationToken cancellationToken) where T : class
    {
        var connectionString = _config["AzureServiceBus:ConnectionString"];
        var queueName = _config["AzureServiceBus:QueueName"];

        if(string.IsNullOrEmpty(connectionString))
        {
            System.Console.WriteLine($"[Mock EventBus] Evento publicado: {JsonSerializer.Serialize(@event)}");
            return;
        }

        await using var client = new ServiceBusClient(connectionString);
        var sender = client.CreateSender(queueName);

        var messageBody = JsonSerializer.Serialize(@event);
        var message = new ServiceBusMessage(messageBody)
        {
            CorrelationId = Guid.NewGuid().ToString(),
            Subject = @event.GetType().Name
        };

        await sender.SendMessageAsync(message, cancellationToken);

        System.Console.WriteLine($"[EventBus] Evento publicado: {messageBody}");
    }
}